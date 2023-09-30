// Functions
export const id = {
    sin    : 0,
    cos    : 1,
    tan    : 2,
    asin   : 3,
    acos   : 4,
    atan   : 5,
    atan2  : 6,
    sqrt   : 7,
    min    : 8,
    max    : 9,
    floor  : 10,
    ceil   : 11,
    round  : 12,
    abs    : 13,
    rand   : 14,
    if     : 15,
    lerp   : 16,
    dbg    : 17
}

export const arity = {
    [id.sin]    : 1,
    [id.cos]    : 1,
    [id.tan]    : 1,
    [id.asin]   : 1,
    [id.acos]   : 1,
    [id.atan]   : 1,
    [id.atan2]  : 2,
    [id.sqrt]   : 1,
    [id.min]    : 2,
    [id.max]    : 2,
    [id.floor]  : 1,
    [id.ceil]   : 1,
    [id.round]  : 1,
    [id.abs]    : 1,
    [id.rand]   : 0,
    [id.if]     : 3,
    [id.lerp]   : 3,
    [id.dbg]    : 1
}