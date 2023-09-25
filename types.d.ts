export type Expression =
    | null
    | number
    | ['var', name: string]
    | ['infix', op: string, lhs: Expression, rhs: Expression]
    | ['prefix', op: string, rhs: Expression]
    | ['assign', 'var', name: string, expr: Expression]
    | ['call', name: string, args: Expression[]]
    | ['root', Expression[]]