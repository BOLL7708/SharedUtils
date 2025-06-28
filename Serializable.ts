import Log from './Log.ts'
import ValueUtils from './ValueUtils.ts'

export type TAbstractDataInput = string | { [key: string]: any } | undefined

/**
 * Abstract class that can take a JSON string or JSON object and apply the values to the class.
 * The intent is for this class to get JSON encoded, transferred, and reinstated at target location.
 * This is a naive data projection that only handles shallow objects for easy deserialization.
 */
export default abstract class Serializable {
    /** Get all property keys even if the object was cloned */
    __keys(): string[] {
        return [
            // Ensure only one occurrence per key
            ...new Set([
                // Works on direct instances of the class
                ...Object.keys(this),
                // Required for Object.create() clones of the class
                ...Object.keys(Object.getPrototypeOf(this))
            ])
        ]
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
        console.log({targetKeys, inputKeys})
        for (const targetKey of targetKeys) {
            // Match property to class
            if (inputKeys.includes(targetKey)) {
                // Somewhat convoluted value application to support property names with mismatched casing.
                (this as any)[targetKeysMap[targetKey]] = (inputData as any)[inputKeysMap[targetKey]]
            } else {
                Log.w(this.constructor.name, `Could not map ${targetKey} onto class.`)
            }
        }

        return this
    }
}