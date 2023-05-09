let i = 0;

// Instructions
export const id = {
    End    : i++,
    GetVar : i++,
    SetVar : i++,
    GetOut : i++,
    SetOut : i++,
    GetIn  : i++,
    Call   : i++,
    Add    : i++,
    Sub    : i++,
    Mul    : i++,
    Div    : i++,
    Pow    : i++,
    Mod    : i++,
    Lt     : i++,
    Gt     : i++,
    Leq    : i++,
    Geq    : i++,
    Eql    : i++,
    And    : i++,
    Or     : i++,
    Not    : i++,
    Neg    : i++,
    Lit    : i++,
    Chunk  : i++,
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