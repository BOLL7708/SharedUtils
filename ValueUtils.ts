import {IDictionary} from './Dictionary.ts'
import Log from './Log.ts'

export default class ValueUtils {
    // region Universal
    static isEmpty(value: unknown): boolean {
        if (value === undefined || value === null) return true
        if (typeof value === 'string') return value.length === 0
        if (Array.isArray(value)) return value.length === 0
        if (typeof value === 'object') return Object.keys(value).length === 0
        if (typeof value === 'number') return isNaN(value) || value === 0
        if (typeof value === 'boolean') return !value
        return false
    }

    static isBlank(value: unknown): boolean {
        if (this.isEmpty(value)) return true
        if (typeof value === 'string') {
            if (value.trim().length === 0) return true
            if (value.replace(/\s/g, '').length === 0) return true
        }
        return false
    }

    static nullIfEmpty<T>(value: T): T | null {
        return this.isEmpty(value) ? null : value
    }

    static nullIfBlank<T>(value: T): T | null {
        return this.isBlank(value) ? null : value
    }

    static safeBase64Decode(value: string): unknown | undefined {
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

    static safeBase64UrlDecode(value: string): unknown | undefined {
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

    /**
     * Tries to coerce b to be like a.
     * @param a
     * @param b
     */
    static tryToMatchTypes<T>(a: T, b: unknown): T | undefined {
        if (a === null || a === undefined) return
        if (
            typeof a === typeof b
            && (Array.isArray(a) == Array.isArray(b))
        ) return b as T

        switch (typeof a) {
            case 'string':
                return this.ensureString(
                    typeof b === 'object' && !Array.isArray(b)
                        ? JSON.stringify(b)
                        : `${b}`
                ) as T | undefined
            case 'number':
                const newB = this.ensureNumber(b, Infinity)
                if (isNaN(newB) || newB === Infinity) {
                    if (Array.isArray(b)) return b.length as T
                    else if (typeof b === 'object' && b !== null) return Object.keys(b).length as T
                    else return undefined
                } else return newB as T
            case 'boolean':
                return this.toBool(b) as T
            case 'object':
                if (Array.isArray(a)) {
                    if (typeof b === 'object' && b !== null) {
                        return Object.values(b) as T
                    }
                } else {
                    if (Array.isArray(b)) {
                        return Object.fromEntries(Object.entries(b)) as T
                    }
                }
                break
        }
    }

    // endregion

    // region Booleans
    /**
     * Returns the deduced boolean value for a value, provided default or false if no match.
     * @param boolValue
     * @param defaultValue
     */
    static toBool(boolValue: unknown, defaultValue: boolean = false): boolean {
        if (typeof boolValue === 'boolean') return boolValue
        if (boolValue === undefined || boolValue === null) return defaultValue

        if (Array.isArray(boolValue)) return !!boolValue.length
        if (typeof boolValue === 'object') return !!Object.keys(boolValue).length

        const boolStr = `${boolValue}`.toLowerCase()
        const firstChar: string = boolStr[0]
        if (['t', 'y', '1'].includes(firstChar)) return true
        if (['f', 'n', '0'].includes(firstChar)) return false
        if ('ok' === boolStr) return true
        if (typeof boolValue === 'string') return !this.isBlank(boolValue)

        return defaultValue
    }

    // endregion

    // region Numbers
    /**
     * Ensures that any arbitrary values becomes a number representation.
     * The default fallback is zero.
     * @param value
     * @param fallback Defaults to 0
     */
    static ensureNumber(value: any, fallback: number = 0): number {
        switch (typeof value) {
            case 'number':
                return isNaN(value) ? fallback : value
            case 'string': {
                const num = parseFloat(value)
                return isNaN(num) ? fallback : num
            }
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
    static ensureString(text: unknown): string | undefined {
        if (typeof text === 'string') return text
    }

    static isNotEmpty(text: unknown): text is string {
        return typeof text === 'string' && text.length > 0
    }

    static isNotBlank(text: unknown): text is string {
        return typeof text === 'string' && text.trim().length > 0 && text.replace(/\s/g, '').length > 0
    }

    static capitalizeFirstLetter(str: string): string {
        if (str.length === 0) return str
        return str.charAt(0).toUpperCase() + str.slice(1)
    }

    static safeJsonParse<T>(json: unknown): T | undefined {
        if (typeof json !== 'string') return undefined
        try {
            return JSON.parse(json) as T
        } catch (e) {
            Log.e(this.name, 'Failed to parse JSON', e)
            return undefined
        }
    }

    /**
     * Returns a dictionary that maps lower-case values to original case values from a string array.
     * @param inputKeys
     */
    static getCaseMap(inputKeys: string[]): Record<string, string> {
        return Object.fromEntries(inputKeys.map(key => [key.toLowerCase(), key]))
    }

    static kebabCase(str: string): string {
        return str.toLowerCase().replace(/\s/g, '-')
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
    static containsAll(needles: unknown[], haystack: unknown[]): boolean {
        const haystackSet = new Set(haystack)
        return needles.every(item => haystackSet.has(item))
    }

    static generateKeysForArray(array: any[], key: string): string[] {
        return Array.from(
            {length: array.length},
            (_, i) => `${key}${i}`
        )
    }

    // endregion

    // region Objects
    static isObject(obj: unknown): obj is object {
        return typeof obj === 'object' && obj !== null
    }

    static getFieldValueAsStr(obj: Record<string, never>, field: string): string {
        if (Object.hasOwn(obj, field)) return `${obj[field]}`
        return ''
    }

    static getFieldValueOrSet<T>(obj: Record<string, T>, field: string, value: T): T {
        if(Object.hasOwn(obj, field)) return obj[field]
        else {
            obj[field] = value
            return value
        }
    }

    static isObjectFilled(obj: unknown): boolean {
        if(this.isObject(obj)) {
            for(const value of Object.values(obj)) {
                if(this.isBlank(value)) return false
            }
            return true
        }
        return false
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

    static removeUndefined(obj: IDictionary<unknown>) {
        for (const [key, value] of Object.entries(obj)) {
            if (value === undefined) delete obj[key]
        }
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
        const binaryString = this.ensureString(
            urlSafe
                ? this.safeBase64UrlDecode(salt)
                : this.safeBase64Decode(salt)
        ) ?? ''
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