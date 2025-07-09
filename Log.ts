export interface ILogOptions {
    logLevel: ELogLevel
    stackLevel: ELogLevel
    useColors: boolean
    tagPrefix: string
    tagPostfix: string
    capitalizeTag: boolean
}

export enum ELogLevel {
    None,
    Verbose,
    Debug,
    Info,
    Warning,
    Error,
}

/**
 * Convenience class for outputting various levels of logging to the console.
 * Takes inspiration from LogCat in AndroidStudio.
 *
 * This is storing an instance, as that instance is needed where this is used as a proxy.
 * This is the case for some runtime classes that not always have access to this class.
 */
export default class Log {
    static #isInternal = false
    static #instance: Log

    private constructor() {
        if (!Log.#isInternal) throw new TypeError('This class is not constructable.')
        Log.#isInternal = false
    }

    static get(): Log {
        if (!this.#instance) {
            this.#isInternal = true
            this.#instance = new Log()
        }
        return this.#instance
    }

    readonly #tag = this.constructor.name
    #options: ILogOptions = {
        logLevel: ELogLevel.Warning,
        stackLevel: ELogLevel.Error,
        useColors: true,
        tagPrefix: '[',
        tagPostfix: '] ',
        capitalizeTag: false
    }

    /**
     * Provide options for logging.
     * @param options
     */
    setOptions(options: Partial<ILogOptions>) {
        this.#options = {...this.#options, ...options}
        this.i(this.#tag, 'Options updated, log and stack levels are now', ELogLevel[this.#options.logLevel], ELogLevel[this.#options.stackLevel])
    }

    static setOptions(options: Partial<ILogOptions>) {
        this.get().setOptions(options)
    }

    /**
     * Set from which level and above that logs should be printed to the console.
     * The default is none, which won't print anything.
     * @param logLevel
     */
    setLogLevel(logLevel: ELogLevel) {
        this.#options.logLevel = logLevel
        this.i(this.#tag, 'Logging level is now', ELogLevel[logLevel])
    }

    static setLogLevel(logLevel: ELogLevel) {
        this.get().setLogLevel(logLevel)
    }

    setStackLevel(stackLevel: ELogLevel) {
        this.#options.stackLevel = stackLevel
        this.i(this.#tag, 'Stack level is now', ELogLevel[stackLevel])
    }

    static setStackLevel(stackLevel: ELogLevel) {
        this.get().setStackLevel(stackLevel)
    }

    v(tag: string, message: string, ...extras: any[]) {
        this.outputToConsole(tag, ELogLevel.Verbose, message, ...extras)
    }

    static v(tag: string, message: string, ...extras: any[]) {
        this.get().v(tag, message, ...extras)
    }

    d(tag: string, message: string, ...extras: any[]) {
        this.outputToConsole(tag, ELogLevel.Debug, message, ...extras)
    }

    static d(tag: string, message: string, ...extras: any[]) {
        this.get().d(tag, message, ...extras)
    }

    i(tag: string, message: string, ...extras: any[]) {
        this.outputToConsole(tag, ELogLevel.Info, message, ...extras)
    }

    static i(tag: string, message: string, ...extras: any[]) {
        this.get().i(tag, message, ...extras)
    }

    w(tag: string, message: string, ...extras: any[]) {
        this.outputToConsole(tag, ELogLevel.Warning, message, ...extras)
    }

    static w(tag: string, message: string, ...extras: any[]) {
        this.get().w(tag, message, ...extras)
    }

    e(tag: string, message: string, ...extras: any[]) {
        this.outputToConsole(tag, ELogLevel.Error, message, ...extras)
    }

    static e(tag: string, message: string, ...extras: any[]) {
        this.get().e(tag, message, ...extras)
    }

    private buildMessage(tag: string, level: ELogLevel, message: string, ...extras: any[]): [string, string, string, any[]] {
        const useColors = this.#options.useColors ? '%c' : ''
        if (this.#options.capitalizeTag) tag = tag.toLocaleUpperCase()
        const logMessage = `${useColors}${this.#options.tagPrefix}${tag}${this.#options.tagPostfix}${message}`
        let color: string = ''
        switch (level) {
            case ELogLevel.Verbose:
                color = 'color: gray;'
                if (useColors) extras.unshift(color)
                break
            case ELogLevel.Debug:
                color = 'color: turquoise;'
                if (useColors) extras.unshift(color)
                break
            case ELogLevel.Info:
                color = 'color: olivedrab;'
                if (useColors) extras.unshift(color)
                break
            case ELogLevel.Warning:
                color = 'color: yellow;'
                if (useColors) extras.unshift(color)
                break
            case ELogLevel.Error:
                color = 'color: red;'
                if (useColors) extras.unshift(color)
                break
        }
        return [useColors, color, logMessage, extras]
    }

    /**
     * Log message if the provided level is equal to or higher than the set level.
     * @param tag
     * @param level
     * @param message
     * @param extras
     * @private
     */
    private outputToConsole(tag: string, level: ELogLevel, message: string, ...extras: any[]) {
        if (
            this.#options.logLevel === ELogLevel.None ||
            level.valueOf() < this.#options.logLevel.valueOf()
        ) return
        const [useColors, color, logMessage, allExtras] = this.buildMessage(tag, level, message, ...extras)
        console.log(logMessage, ...allExtras)
        if (
            this.#options.stackLevel !== ELogLevel.None
            && this.#options.stackLevel <= level.valueOf()
        ) {
            const error = new Error()
            const stack = error.stack
            if (stack) {
                const message = stack
                    .split('\n')
                    .slice(3)
                    .filter((it) => it.includes('file:///'))
                    .join('\n')
                if (message.trim().length > 0) {
                    if (useColors) {
                        console.log(`%c${message}`, color)
                    } else {
                        console.log(message)
                    }
                }
            }
        }
    }
}
