export interface IDictionary<T> {
    [key: string]: T
}

export interface IDictionaryUnsafe<T> {
    [key: string]: T | undefined
}

export interface IStringDictionary extends IDictionary<string> {
}

export interface IStringDictionaryUnsafe extends IDictionaryUnsafe<string> {
}

export interface INumberDictionary extends IDictionary<number> {
}

export interface INumberDictionaryUnsafe extends IDictionaryUnsafe<number> {
}

export interface IBooleanDictionary extends IDictionary<boolean> {
}

export interface IBooleanDictionaryUnsafe extends IDictionaryUnsafe<boolean> {
}

export class Dictionary {
    static toSafe<T>(dictionary: IDictionaryUnsafe<T>): IDictionary<T> {
        return Object.fromEntries(
            Object.entries(dictionary)
                .filter(([_, value]) => value !== undefined)
        ) as IDictionary<T>
    }
}