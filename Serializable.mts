import ValueUtils from './ValueUtils.mts'

export type TAbstractDataInput = string | { [key: string]: any } | undefined

/**
 * Abstract class that can take a JSON string or JSON object and apply the values to the class.
 * The intent is for this class to get JSON encoded, transferred, and reinstated at target location.
 * This is a naive data projection that only handles shallow objects for easy deserialization.
 */
export default abstract class Serializable {
    /** Get all property keys even if the object was cloned */
    __keys(): string[] {
        return [...new Set([ // Ensure only one occurrence per key
            ...Object.keys(this), // Works on direct instances of the class
            ...Object.keys(Object.getPrototypeOf(this)) // Required for Object.create() clones of the class
        ])]
    }

    /** Create a new instance of this object, with optional application of data */
    __new(inputData?: TAbstractDataInput): typeof this {
        if (inputData === undefined) return Object.create(this)
        else return Object.create(this).__apply(inputData)
    }

    /**
     * Apply data to the properties of this object, string input will be parsed as JSON.
     * Application is shallow and naive, will not differentiate between types of objects.
     */
    __apply(inputData: TAbstractDataInput): typeof this {
        if (typeof inputData === 'string') inputData = ValueUtils.safeJsonParse(inputData)
        if (inputData === undefined) return this // Unable to parse so we skip application

        const targetKeysMap = ValueUtils.getCaseMap(this.__keys())
        const inputKeysMap = ValueUtils.getCaseMap(Object.keys(inputData))
        const targetKeys = Object.keys(targetKeysMap)
        const inputKeys = Object.keys(inputKeysMap)
        for (const targetKey of targetKeys) {
            const targetValue = (this as any)[targetKeysMap[targetKey]]
            const inputValue = (inputData as any)[inputKeysMap[targetKey]]
            const targetType = typeof targetValue
            const inputType = typeof inputValue
            if (
                inputKeys.includes(targetKey) // Match property to class
                && inputType === targetType // Ensure similar types, a class has default values for properties
            ) {
                // Somewhat convoluted value application to support mixed-case property names
                (this as any)[targetKeysMap[targetKey]] = (inputData as any)[inputKeysMap[targetKey]]
            }
        }

        return this
    }
}