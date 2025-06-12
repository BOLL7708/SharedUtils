import ValueUtils from './ValueUtils.ts'

export default class SerializedId {
    static idx = 0
    static next(tag?: string): string {
        this.idx++
        return tag
            ? `${ValueUtils.kebabCase(tag.trim())}-${this.idx}`
            : `message-id-${this.idx}`
    }
}