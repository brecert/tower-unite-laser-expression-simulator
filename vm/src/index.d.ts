export interface Inputs {
    x: number
    y: number
    index: number
    count: number
    time: number
    projectionStartTime: number
}

export interface Outputs {
    x: number
    y: number
    h: number
    s: number
    v: number
}

export declare function interpret(bytecode: Float64Array, inputs: Inputs): Outputs