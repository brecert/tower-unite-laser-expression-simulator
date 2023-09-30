import { Tokenizer } from "./parser"

export type Expression =
    | null
    | { val: number, ctx: Context }
    | { val: [inst: 'var', name: string], ctx: Context }
    | { val: [inst: 'infix', op: string, lhs: Expression, rhs: Expression], ctx: Context }
    | { val: [inst: 'prefix', op: string, rhs: Expression], ctx: Context }
    | { val: [inst: 'assign', type: 'var', name: string, expr: Expression], ctx: Context }
    | { val: [inst: 'call', name: string, args: Expression[]], ctx: Context }
    | { val: [inst: 'root', exprs: Expression[]], ctx: Context }

export type Context = { line: number, column: number, offset: number }