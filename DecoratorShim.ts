// Metadata shim to enable the property which otherwise stays undefined
interface SymbolConstructor {
    readonly metadata: unique symbol
}
// @ts-ignore
Symbol['metadata'] ??= Symbol.for('Symbol.metadata')