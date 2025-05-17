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
        logLevel: ELogLevel.None,
        stackLevel: ELogLevel.Warning,
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
        this.i(this.TAG, 'Options updated, log and stack levels are now', ELogLevel[options.logLevel], ELogLevel[options.stackLevel])
    }
    static setOptions(options: ILogOptions) {
        this.get().setOptions(options)
    }

    /**
     * Set from which level and above that logs should be printed to the console.
     * The default is none, which won't print anything.
     * @param logLevel
     */
    setLogLevel(logLevel: ELogLevel) {
        this._options.logLevel = logLevel
        this.i(this.TAG, 'Logging level is now', ELogLevel[logLevel])
    }
    static setLogLevel(logLevel: ELogLevel) {
        this.get().setLogLevel(logLevel)
    }
    setStackLevel(stackLevel: ELogLevel) {
        this._options.stackLevel = stackLevel
        this.i(this.TAG, 'Stack level is now', ELogLevel[stackLevel])
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
        const useColors = this._options.useColors ? '%c' : ''
        if (this._options.capitalizeTag) tag = tag.toLocaleUpperCase()
        const logMessage = `${useColors}${this._options.tagPrefix}${tag}${this._options.tagPostfix}${message}`
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
            this._options.logLevel === ELogLevel.None ||
            level.valueOf() < this._options.logLevel.valueOf()
        ) return
        const [useColors, color, logMessage, allExtras] = this.buildMessage(tag, level, message, ...extras)
        console.log(logMessage, ...allExtras)
        if(
            this._options.stackLevel !== ELogLevel.None
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
