import ValueUtils from './ValueUtils.mts'

export type TAbstractDataInput = string | { [key: string]: any } | undefined

/**
 * Abstract data class that can take a JSON string or JSON object and apply the values to the class.
 */
export default abstract class AbstractData {
    __keys(): string[] {
        return [...new Set([ // Ensure only one occurrence per key
            ...Object.keys(this), // Works on direct instances of the class
            ...Object.keys(Object.getPrototypeOf(this)) // Required for Object.create() clones of the class
        ])]
    }

    __new(inputData?: TAbstractDataInput): typeof this {
        if (inputData === undefined) return Object.create(this)
        else return Object.create(this).__apply(inputData)
    }

    __apply(inputData: TAbstractDataInput): typeof this {
        if (typeof inputData === 'string') {
            inputData = ValueUtils.safeJsonParse(inputData)
        }
        if (inputData === undefined) return this

        const targetKeysMap = ValueUtils.getCaseMap(this.__keys())
        const inputKeysMap = ValueUtils.getCaseMap(Object.keys(inputData))
        const targetKeys = Object.keys(targetKeysMap)
        const inputKeys = Object.keys(inputKeysMap)
        for (const targetKey of targetKeys) {
            if (
                inputKeys.includes(targetKey)
                && (
                    typeof (inputData as any)[inputKeysMap[targetKey]] ===
                    typeof (this as any)[targetKeysMap[targetKey]]
                )
            ) {
                (this as any)[targetKeysMap[targetKey]] = (inputData as any)[inputKeysMap[targetKey]]
            }
        }

        return this
    }
}