import Log from './Log.ts'
import ValueUtils from './ValueUtils.ts'

export type TSerializableInput = string | TSerializableParsedInput | undefined
export type TSerializableParsedInput = Record<string, unknown>

export type TSerializableMethod = (...args: never) => unknown
type TSerializableTypes =
    | TSerializableAllowedTypes
    | TSerializableMethod

/** Allowed types that can be assigned to fields on a Serializable inheritor, all possible JSON types. */
export const serializableAllowedTypes: string[] = [...new Set([
    typeof '',
    typeof 0,
    typeof {},
    typeof [],
    typeof false,
    typeof null
])] // Three of these are 'object', but they are all included for completeness.
export type TSerializableAllowedTypes = string | number | object | [] | boolean | null

/**
 * Abstract class that can take a JSON string or JSON object and apply the values to the class.
 * The intent is for this class to get JSON encoded, transferred, and reinstated at target location.
 * This is a naive data projection that only handles shallow objects for easy deserialization.
 */
export default abstract class Serializable {
    /* Allowed field types */
    [key: string]: TSerializableTypes

    /** Tag for logging */
    #tag: string = 'Serializable'

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
    __new(inputData?: TSerializableInput): typeof this {
        if (inputData === undefined) return Object.create(this)
        else return Object.create(this).__apply(inputData)
    }

    /**
     * Apply data to the properties of this object, string input will be parsed as JSON.
     * Application is shallow and naive, will not differentiate between types of objects.
     */
    __apply(input: TSerializableInput, allowedTypes: string[] = []): typeof this {
        if (!allowedTypes.length) allowedTypes = serializableAllowedTypes

        // Skip if no input
        if (ValueUtils.isBlank(input)) {
            Log.w(this.#tag, 'Input was blank.')
            return this
        }

        // Parse if input was a string
        if (typeof input === 'string') {
            const jsonResult = ValueUtils.safeJsonParse<TSerializableParsedInput>(input)
            if (jsonResult && typeof jsonResult === 'object') input = jsonResult
            else Log.w(this.#tag, 'Input was string but not suitable JSON.', {input})
        }

        // Check if we can use the result
        if (
            Array.isArray(input)
            || typeof input !== 'object'
        ) {
            Log.w(this.#tag, 'The input is an array object or not an object.', typeof input)
            return this
        }

        // Map the values from input to this instance
        const keys = [...new Set([
            ...Object.keys(this),
            ...Object.keys(Object.getPrototypeOf(this))
        ])]
        const keysMap = ValueUtils.getCaseMap(keys)
        const keysLowerCase = Object.keys(keysMap)
        const inputKeys = Object.keys(input)
        const inputKeysMap = ValueUtils.getCaseMap(inputKeys)
        const inputKeysLowerCase = Object.keys(inputKeysMap)
        for (const keyLowerCase of keysLowerCase) {
            // The input property must exist on the instance.
            if (!inputKeysLowerCase.includes(keyLowerCase)) {
                continue
            }
            const key = keysMap[keyLowerCase]
            const inputKey = inputKeysMap[keyLowerCase]

            // Input value must not be null nor undefined.
            if (input[inputKey] === null || input[inputKey] === undefined) {
                Log.v(this.#tag, `Skipped ${inputKey} as it is null or undefined:`, input[inputKey])
                continue
            }
            // Types between input and instance properties must match each other.
            if (
                typeof this[key] !== typeof input[inputKey]
                || (Array.isArray(this[key]) !== Array.isArray(input[inputKey]))
            ) {
                // We try to convert here because JavaScript can put string values from inputs into number fields on a class, as an example.
                const newInput = ValueUtils.tryToMatchTypes(this[key], input[inputKey])
                if (newInput !== undefined) {
                    input[inputKey] = newInput
                } else {
                    Log.v(this.#tag, `Skipped ${inputKey} due being the wrong type:`, typeof input[inputKey], '!==', typeof this[key])
                    continue
                }
            }

            /*
            We do not match against the existing types in arrays or objects,
            values are simply applied naively, we just filter on allowed types.
             */

            // Arrays are checked explicitly as they are also objects but should be handled differently.
            if (Array.isArray(this[key]) && Array.isArray(input[inputKey])) {
                this[key] = input[inputKey].filter(item => allowedTypes.includes(typeof item))
            }
            // Object values are also filtered on allowed types.
            else if (typeof input[inputKey] === 'object' && input[inputKey] !== null) {
                this[key] = Object.fromEntries(
                    Object.entries(input[inputKey])
                        .filter(([_key, value]) => allowedTypes.includes(typeof value))
                )
            }
            // Primitives are applied
            else if (allowedTypes.includes(typeof input[inputKey])) {
                this[key] = input[inputKey] as TSerializableTypes
            } else Log.w(this.#tag, `Unable to apply ${key} to instance, value:`, input[inputKey])
        }

        return this
    }
}