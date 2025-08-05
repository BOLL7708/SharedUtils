import Log from './Log.ts'
import SerializedId from './SerializedId.ts'

/**
 * Options for the WebSocketClient.
 */
export interface IWebSocketClientOptions {
    /**
     * Used in logging.
     */
    clientName: string
    /**
     * URL including protocol and port to the server we are connecting to, e.g. ws://127.0.0.1:7700
     */
    serverUrl: string
    /**
     * The delay in seconds between reconnection attempts if the client was disconnected.
     *
     * Defaults to 30, which means it will wait 30 seconds between each attempt.
     */
    reconnectIntervalSeconds?: number
    /**
     * Make messages queue up if the client is disconnected, will be sent when reconnected.
     *
     * Defaults to false which means the queue is disabled.
     */
    messageQueueing?: boolean
    /**
     * How long a message should be retained in the queue before being skipped.
     *
     * Defaults to 0 which means nothing is skipped but retained forever until reconnected.
     */
    messageMaxQueueSeconds?: number
    /**
     * Callback for when the client connects to a server.
     */
    onOpen?: IWebSocketClientOpenCallback
    /**
     * Callback for when the client disconnects from the server.
     */
    onClose?: IWebSocketClientCloseCallback
    /**
     * Callback for when the client receives messages from the server.
     */
    onMessage?: IWebSocketClientMessageCallback
    /**
     * Callback for client errors.
     */
    onError?: IWebSocketClientErrorCallback
    /**
     * List of subprotocol values to use when connecting to the server.
     */
    subprotocolValues?: string[]
}

/**
 * Resilient WebSocket Client implementation that supports:
 * 1. Automatic reconnect
 * 2. Message queueing upon disconnect
 * 3. Promise based messageId messaging
 * Required: Run .init() after instantiation to activate the connection.
 */
export default class WebSocketClient {
    readonly #tag: string
    #options: IWebSocketClientOptions
    #onOpen: IWebSocketClientOpenCallback
    #onClose: IWebSocketClientCloseCallback
    #onMessage: IWebSocketClientMessageCallback
    #onError: IWebSocketClientErrorCallback

    constructor(options: IWebSocketClientOptions) {
        this.#options = options
        this.#tag = `${this.constructor.name}->${this.#options.clientName}`
        this.#onOpen = options.onOpen ?? (() => {
            Log.v(this.#tag, 'onOpen callback not set')
        })
        this.#onClose = options.onClose ?? (() => {
            Log.v(this.#tag, 'onClose callback not set')
        })
        this.#onMessage = options.onMessage ?? (() => {
            Log.v(this.#tag, 'onMessage callback not set')
        })
        this.#onError = options.onError ?? (() => {
            Log.v(this.#tag, 'onError callback not set')
        })
    }

    #socket?: WebSocket
    #connected = false
    #messageQueue: QueueItem[] = []
    #reconnectIntervalHandle: number = 0
    #resolverQueue: Map<string, (result: any) => void> = new Map()
    #shouldReconnect = false

    /**
     * Start the connection loop, no connection will be established unless this is executed.
     */
    init() {
        this.#shouldReconnect = true
        this.startConnectLoop(true)
    }

    /**
     * Send a message to the server.
     * @param body
     */
    send(body: string | object | [] | number | boolean | null) {
        if (typeof body !== 'string') body = JSON.stringify(body)
        if (this.#connected) {
            this.#socket?.send(body)
            Log.v(this.#tag, 'Sent message', body)
        } else if (this.#options.messageQueueing) {
            this.#messageQueue.push(new QueueItem(Date.now(), body))
            Log.d(this.#tag, 'Not connected, adding to queue (entries)', this.#messageQueue.length)
        }
    }

    /**
     * Will close the connection and restart it.
     */
    reconnect() {
        this.#shouldReconnect = true
        this.#socket?.close()
        this.startConnectLoop(true)
    }

    /**
     * Will force the connection to close and stay closed until manually triggering a reconnection.
     */
    disconnect() {
        this.#shouldReconnect = false
        this.stopConnectLoop()
        this.#socket?.close()
        this.#socket = undefined
    }

    isConnected(): boolean {
        return this.#connected
    }

    private startConnectLoop(immediate: boolean = false) {
        this.stopConnectLoop()
        this.#reconnectIntervalHandle = setInterval(this.connect.bind(this), (this.#options.reconnectIntervalSeconds ?? 30) * 1000)
        if (immediate) this.connect()
    }

    private stopConnectLoop() {
        clearInterval(this.#reconnectIntervalHandle)
    }

    /**
     * Will instantiate a new client instance and open the connection.
     * @private
     */
    private connect() {
        this.#socket?.close()
        this.#socket = undefined
        this.#socket = new WebSocket(this.#options.serverUrl, this.#options.subprotocolValues)
        this.#socket.onopen = (ev => onOpen(this, ev))
        this.#socket.onclose = (ev => onClose(this, ev))
        this.#socket.onmessage = (ev => onMessage(this, ev))
        this.#socket.onerror = (ev => onError(this, ev))

        const onOpen = (self: WebSocketClient, ev: Event) => {
            Log.d(self.#tag, 'Connected')
            self.#connected = true
            self.stopConnectLoop()
            self.#onOpen(ev)

            // Will skip messages that are older than the maximum allowed if a limit is set.
            const maxTime = (self.#options.messageMaxQueueSeconds ?? 0) * 1000
            const now = Date.now()
            for (const item of self.#messageQueue) {
                if (maxTime == 0 || (now - item.time) <= maxTime) {
                    self.#socket?.send(item.message)
                }
            }
            self.#messageQueue = []
        }

        const onClose = (self: WebSocketClient, ev: CloseEvent) => {
            Log.d(self.#tag, 'Disconnected')
            self.#connected = false
            if (this.#shouldReconnect) self.startConnectLoop()
            self.#onClose(ev)
        }

        const onMessage = (self: WebSocketClient, ev: MessageEvent) => {
            Log.v(self.#tag, 'Received message', ev.data)
            self.#onMessage(ev)
        }

        const onError = (self: WebSocketClient, ev: Event | ErrorEvent) => {
            const message = ev instanceof ErrorEvent ? ev.message : 'Unknown issue'
            Log.d(self.#tag, 'Error', message)
            self.#socket?.close()
            self.startConnectLoop()
            self.#onError(ev)
        }
    }


    private registerResolver(messageId: string, resolver: (result: any) => void, timeoutMs: number) {
        Log.v(this.#tag, 'Registered resolver for messageId with timeout (ms)', messageId, timeoutMs)
        this.#resolverQueue.set(messageId, resolver)
        setTimeout(() => {
                const enqueuedResolver = this.#resolverQueue.get(messageId)
                if (enqueuedResolver) {
                    enqueuedResolver(undefined)
                    this.#resolverQueue.delete(messageId)
                    Log.d(this.#tag, 'Resolver for messageId timed out (ms)', messageId, timeoutMs)
                }
            },
            timeoutMs
        )
    }

    /**
     * Trigger a registered promise resolver with a result.
     * @param messageId
     * @param result
     */
    resolvePromise(messageId: string, result: any) {
        const resolver = this.#resolverQueue.get(messageId)
        if (resolver) {
            resolver(result)
            this.#resolverQueue.delete(messageId)
            Log.v(this.#tag, 'Ran resolver for messageId', messageId)
        } else {
            Log.w(this.#tag, 'MessageId did not exist in resolver queue, cannot resolve promise', messageId)
        }
    }

    /**
     * Will send a message and store a callback for a unique messageId value until the resolvePromise() method is called
     * with that same messageId value, or the timeout has been triggered, where it will return undefined.
     * @param body
     * @param messageId
     * @param timeoutMs
     */
    sendMessageWithPromise<T>(body: string | object | [] | number | boolean | null, messageId: string, timeoutMs: number = 1000): Promise<T | undefined> {
        if (messageId.length == 0) Log.w(this.#tag, 'Message with promise registered with empty messageId')
        else Log.v(this.#tag, 'Sent message and registered resolver with messageId and timeout (ms)', messageId, timeoutMs)
        return new Promise((resolve) => {
            this.registerResolver(messageId, resolve, timeoutMs)
            this.send(body)
        })
    }

    getNextMessageId(): string {
        return SerializedId.next(this.#options.clientName)
    }
}

// region Callbacks
export interface IWebSocketClientOpenCallback {
    (evt: Event): void
}

export interface IWebSocketClientCloseCallback {
    (evt: CloseEvent): void
}

export interface IWebSocketClientMessageCallback {
    (evt: MessageEvent): void
}

export interface IWebSocketClientErrorCallback {
    (evt: Event | ErrorEvent): void
}

// region

class QueueItem {
    constructor(
        public time: number = 0,
        public message: string = '') {
    }
}