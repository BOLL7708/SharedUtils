export interface IStringDictionary {
    [key: string]: string
}

export interface IStringDictionaryUnsafe {
    [key: string]: string | undefined
}

export interface INumberDictionary {
    [key: string]: number
}

export interface INumberDictionaryUnsafe {
    [key: string]: number | undefined
}

export interface IBooleanDictionary {
    [key: string]: boolean
}

export interface IBooleanDictionaryUnsafe {
    [key: string]: boolean | undefined
}

export interface IDictionary<T> {
    [key: string]: T
}

export interface IDictionaryUnsafe<T> {
    [key: string]: T | undefined
}