// Instructions
export const id = {
    GetVar : 0,
    SetVar : 1,
    GetOut : 2,
    SetOut : 3,
    GetIn  : 4,
    Call   : 5,
    Add    : 6,
    Sub    : 7,
    Mul    : 8,
    Div    : 9,
    Pow    : 10,
    Mod    : 11,
    Lt     : 12,
    Gt     : 13,
    Leq    : 14,
    Geq    : 15,
    Eql    : 16,
    And    : 17,
    Or     : 18,
    Not    : 19,
    Neg    : 20,
    Lit    : 21,
}

export const infix = {
    "+": id.Add,
    "-": id.Sub,
    "*": id.Mul,
    "/": id.Div,
    "^": id.Pow,
    "%": id.Mod,
    "<": id.Lt,
    ">": id.Gt,
    "<=":id.Leq,
    ">=":id.Geq,
    "==":id.Eql,
    "&": id.And,
    "|": id.Or,
}

export const prefix = {
    "!": id.Not,
    "-": id.Neg,
}