export default class ValueUtils {
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

}