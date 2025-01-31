export interface ILogOptions {
    logLevel: EEasyDebugLogLevel
    stackLevel: EEasyDebugLogLevel
    useColors: boolean
    tagPrefix: string
    tagPostfix: string
    capitalizeTag: boolean
}

export enum EEasyDebugLogLevel {
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
 */
export default class Log {
    private static _instance: Log
    private constructor() {

    }
    static get(): Log {
        if(!this._instance) {
            Log._instance = new Log()
        }
        return this._instance
    }

    private readonly TAG = this.constructor.name
    private _options: ILogOptions = {
        logLevel: EEasyDebugLogLevel.None,
        stackLevel: EEasyDebugLogLevel.Warning,
        useColors: false,
        tagPrefix: '',
        tagPostfix: ' ',
        capitalizeTag: false
    }

    /**
     * Provide options for logging.
     * @param options
     */
    setOptions(options: ILogOptions) {
        this._options = options
        this.i(this.TAG, 'Options updated, log and stack levels are now', EEasyDebugLogLevel[options.logLevel], EEasyDebugLogLevel[options.stackLevel])
    }
    static setOptions(options: ILogOptions) {
        this.get().setOptions(options)
    }

    /**
     * Set from which level and above that logs should be printed to the console.
     * The default is none, which won't print anything.
     * @param logLevel
     */
    setLogLevel(logLevel: EEasyDebugLogLevel) {
        this._options.logLevel = logLevel
        this.i(this.TAG, 'Logging level is now', EEasyDebugLogLevel[logLevel])
    }
    static setLogLevel(logLevel: EEasyDebugLogLevel) {
        this.get().setLogLevel(logLevel)
    }
    setStackLevel(stackLevel: EEasyDebugLogLevel) {
        this._options.stackLevel = stackLevel
        this.i(this.TAG, 'Stack level is now', EEasyDebugLogLevel[stackLevel])
    }
    static setStackLevel(stackLevel: EEasyDebugLogLevel) {
        this.get().setStackLevel(stackLevel)
    }

    v(tag: string, message: string, ...extras: any[]) {
        this.outputToConsole(tag, EEasyDebugLogLevel.Verbose, message, ...extras)
    }
    static v(tag: string, message: string, ...extras: any[]) {
        this.get().v(tag, message, ...extras)
    }

    d(tag: string, message: string, ...extras: any[]) {
        this.outputToConsole(tag, EEasyDebugLogLevel.Debug, message, ...extras)
    }
    static d(tag: string, message: string, ...extras: any[]) {
        this.get().d(tag, message, ...extras)
    }

    i(tag: string, message: string, ...extras: any[]) {
        this.outputToConsole(tag, EEasyDebugLogLevel.Info, message, ...extras)
    }
    static i(tag: string, message: string, ...extras: any[]) {
        this.get().i(tag, message, ...extras)
    }

    w(tag: string, message: string, ...extras: any[]) {
        this.outputToConsole(tag, EEasyDebugLogLevel.Warning, message, ...extras)
    }
    static w(tag: string, message: string, ...extras: any[]) {
        this.get().w(tag, message, ...extras)
    }

    e(tag: string, message: string, ...extras: any[]) {
        this.outputToConsole(tag, EEasyDebugLogLevel.Error, message, ...extras)
    }
    static e(tag: string, message: string, ...extras: any[]) {
        this.get().e(tag, message, ...extras)
    }

    /**
     * Log message if the provided level is equal to or higher than the set level.
     * @param tag
     * @param level
     * @param message
     * @param extras
     * @private
     */
    private outputToConsole(tag: string, level: EEasyDebugLogLevel, message: string, ...extras: any[]) {
        if (
            this._options.logLevel === EEasyDebugLogLevel.None ||
            level.valueOf() < this._options.logLevel.valueOf()
        ) return

        const useColors = this._options.useColors ? '%c' : ''
        if (this._options.capitalizeTag) tag = tag.toLocaleUpperCase()
        const logMessage = `${useColors}${this._options.tagPrefix}${tag}${this._options.tagPostfix}${message}`
        let color: string = ''
        switch (level) {
            case EEasyDebugLogLevel.Verbose:
                color = 'color: gray;'
                if (useColors) extras.unshift(color)
                console.log(logMessage, ...extras)
                break
            case EEasyDebugLogLevel.Debug:
                color = 'color: turquoise;'
                if (useColors) extras.unshift(color)
                console.log(logMessage, ...extras)
                break
            case EEasyDebugLogLevel.Info:
                color = 'color: olivedrab;'
                if (useColors) extras.unshift(color)
                console.log(logMessage, ...extras)
                break
            case EEasyDebugLogLevel.Warning:
                color = 'color: yellow;'
                if (useColors) extras.unshift(color)
                console.log(logMessage, ...extras)
                break
            case EEasyDebugLogLevel.Error:
                color = 'color: red;'
                if (useColors) extras.unshift(color)
                console.log(logMessage, ...extras)
                break
        }
        if(
            this._options.stackLevel !== EEasyDebugLogLevel.None
            && this._options.stackLevel <= level.valueOf()
        ) {
            const error = new Error()
            const stack = error.stack
            if(stack) {
                const message = stack
                    .split('\n')
                    .slice(3)
                    .filter((it)=>it.includes('file:///'))
                    .join('\n')
                if(message.trim().length > 0) {
                    if(useColors) {
                        console.log(`%c${message}`, color)
                    } else {
                         console.log(message)
                    }
                }
            }
            // console.log(stack?.split('\n')[1]?.trim().split(' ')[2], ...extras)
        }
    }
}
