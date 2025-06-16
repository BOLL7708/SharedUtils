/** Should match any valid constructor, used for Decorators */
export type TClassConstructor<Class = any> = { new (...args: any[]): Class }

/** Should match any valid class method, used for Decorators */
export type TClassMethod<
    This = unknown,
    Args extends any[] = any[],
    Return = any
> = (this: This, ...args: Args) => Return;

// region Decorator Factory Functions
/** Function signature for a ClassDecorator */
export type TClassDecorator = (
    constructor: TClassConstructor,
    context: ClassDecoratorContext
) => void

/** Function signature for a ClassMethodDecorator */
export type TClassMethodDecorator = <This, Value extends TClassMethod<This> = TClassMethod<This>>(
    originalMethod: Value,
    context: ClassMethodDecoratorContext<This, Value>
) => Value

/** Function signature for a ClassFieldDecorator */
export type TClassFieldDecorator = <This, Value>(
    value: undefined,
    context: ClassFieldDecoratorContext<This, Value>
) => void
// endregion