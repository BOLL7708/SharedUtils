import Log from './Log.mts'

export default class ValueUtils {
    // region Universal
    static isEmpty(value: any): boolean {
        if (value === undefined || value === null) return true
        if (typeof value === 'string') return value.length === 0
        if (Array.isArray(value)) return value.length === 0
        if (typeof value === 'object') return Object.keys(value).length === 0
        if (typeof value === 'number') return isNaN(value) || value === 0
        if (typeof value === 'boolean') return !value
        return false
    }

    static isBlank(value: any): boolean {
        if (this.isEmpty(value)) return true
        if (typeof value === 'string') {
            if (value.trim().length === 0) return true
            if (value.replace(/\s/g, '').length === 0) return true
        }
        return false
    }

    static safeBase64Decode(value: string): any | undefined {
        try {
            return atob(value)
        } catch (e) {
            return undefined
        }
    }

    static safeBase64Encode(value: string): string | undefined {
        try {
            return btoa(value)
        } catch (e) {
            return undefined
        }
    }

    static safeBase64UrlDecode(value: string): any | undefined {
        try {
            return atob(
                value
                    .replace(/-/g, '+')
                    .replace(/_/g, '/'))
        } catch (e) {
            return undefined
        }
    }

    static safeBase64UrlEncode(value: string): string | undefined {
        try {
            return btoa(value)
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, '')
        } catch (e) {
            return undefined
        }
    }

    // endregion

    // region Booleans
    /**
     * Returns the deduced boolean value for a string, provided default or false if no match.
     * @param boolStr
     * @param defaultValue
     */
    static toBool(boolStr: string | undefined | null | unknown, defaultValue: boolean = false): boolean {
        if (boolStr === undefined || boolStr === null || typeof boolStr !== 'string' || boolStr.length == 0) return defaultValue
        const firstChar: string = boolStr.toLowerCase()[0]
        const trueIsh: string[] = ['t', 'y', '1']
        const falseIsh: string[] = ['f', 'n', '0']
        if (trueIsh.includes(firstChar)) return true
        if (falseIsh.includes(firstChar)) return false
        return defaultValue
    }

    // endregion

    // region Numbers
    static ensureNumber(value: any, fallback: number = 0): number {
        switch (typeof value) {
            case 'number':
                return isNaN(value) ? fallback : value
            case 'string':
                const num = parseFloat(value)
                return isNaN(num) ? fallback : num
            case 'boolean':
                return value ? 1 : 0
            default:
                return fallback
        }
    }

    /**
     * Basically a parseInt that also takes undefined
     * @param intStr
     * @param defaultValue
     */
    static toInt(intStr: string | undefined, defaultValue: number = NaN): number {
        return parseInt(intStr ?? '') || defaultValue
    }

    // endregion

    // region Strings
    static isNotEmpty(text: any): text is string {
        return typeof text === 'string' && text.length > 0
    }

    static isNotBlank(text: any): text is string {
        return typeof text === 'string' && text.trim().length > 0 && text.replace(/\s/g, '').length > 0
    }

    static capitalizeFirstLetter(str: string): string {
        if (str.length === 0) return str
        return str.charAt(0).toUpperCase() + str.slice(1)
    }

    static safeJsonParse<T>(json: any): T | undefined {
        if(typeof json !== 'string')  return undefined
        try {
            return JSON.parse(json) as T
        } catch (e) {
            Log.e(this.name, 'Failed to parse JSON', e)
            return undefined
        }
    }

    // endregion

    // region Arrays
    static ensureArray<Type>(value: Type[] | Type | undefined): Type[] {
        if (value === undefined) return []
        return Array.isArray(value) ? value : [value]
    }

    /**
     * Checks if all the needles exist in the haystack.
     * @param haystack
     * @param needles
     */
    static containsAll(needles: any[], haystack: any[]): boolean {
        const haystackSet = new Set(haystack)
        return needles.every(item => haystackSet.has(item))
    }

    // endregion

    // region Objects
    static isObject(obj: any): obj is object {
        return typeof obj === 'object' && obj !== null
    }
    // endregion

    // region Generic
    static ensureValue<Type>(value: Type | Type[]): Type | undefined {
        return (Array.isArray(value) && value.length > 0) ? value.shift() : value as Type
    }

    /**
     * Clone anything data structure by JSON stringify and parse
     * @param data Data to clone
     * @returns The cloned data
     */
    static clone<Type>(data: Type): Type {
        return JSON.parse(JSON.stringify(data)) as Type
    }

    // endregion

    // region Crypto
    /**
     * Legacy password hash used in accessory applications.
     * @param message
     */
    static async hashPasswordSimple(message: string): Promise<string> {
        const textBuffer = new TextEncoder().encode(message) // encode as UTF-8
        const hashBuffer = await crypto.subtle.digest('SHA-256', textBuffer) // hash the message
        const byteArray = Array.from(new Uint8Array(hashBuffer)) // convert ArrayBuffer to Array
        return btoa(String.fromCharCode(...byteArray))
    }
    /**
     * Made to match the hashing done in PHP.
     * @param password
     */
    static async hashForPhp(password: string): Promise<string> {
        const encoder = new TextEncoder()
        const data = encoder.encode(password)
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    }

    static generateSalt(length = 32): Uint8Array {
        const salt = new Uint8Array(length)
        crypto.getRandomValues(salt)
        return salt
    }

    static encodeBytes(uint8array: Uint8Array, urlSafe: boolean = false): string {
        return urlSafe
            ? this.safeBase64UrlEncode(String.fromCharCode(...uint8array)) ?? ''
            : this.safeBase64Encode(String.fromCharCode(...uint8array)) ?? ''
    }

    static decodeBytes(salt: string): Uint8Array {
        const urlSafe = salt.includes('-') || salt.includes('_')
        const binaryString = urlSafe
            ? this.safeBase64UrlDecode(salt) ?? ''
            : this.safeBase64Decode(salt) ?? ''
        const len = binaryString.length
        const bytes = new Uint8Array(len)
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i)
        }
        return bytes
    }

    static async hashPassword(password: string, salt: Uint8Array, urlSafe: boolean = false): Promise<string> {
        const enc = new TextEncoder()
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            enc.encode(password),
            'PBKDF2',
            false,
            ['deriveBits']
        )
        const derivedBits = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100_000,
                hash: 'SHA-512'
            },
            keyMaterial,
            256 + 128
        )
        const hashBytes = new Uint8Array(derivedBits)
        return this.encodeBytes(hashBytes, urlSafe)
    }

    // endregion

    // region Dates
    static daysBetween(start: Date, end: Date): number {
        const durationMs = end.getTime() - start.getTime()
        return Math.floor(durationMs / (1000 * 60 * 60 * 24))
    }

    // endregion
}