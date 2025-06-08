export default class Nonce {
    static idx = 0
    static get(tag?: string): string {
        this.idx++
        return `${tag}${this.idx}`
    }
}