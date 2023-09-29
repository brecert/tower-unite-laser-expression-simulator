export type Expression =
    | null
    | number
    | [inst: 'var', name: string]
    | [inst: 'infix', op: string, lhs: Expression, rhs: Expression]
    | [inst: 'prefix', op: string, rhs: Expression]
    | [inst: 'assign', type: 'var', name: string, expr: Expression]
    | [inst: 'call', name: string, args: Expression[]]
    | [inst: 'root', exprs: Expression[]]