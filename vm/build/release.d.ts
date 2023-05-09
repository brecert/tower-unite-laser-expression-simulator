/** Exported memory */
export declare const memory: WebAssembly.Memory;
/**
 * assembly/index/interpret
 * @param x `f64`
 * @param y `f64`
 * @param index `f64`
 * @param count `f64`
 * @param time `f64`
 * @param projectionStartTime `f64`
 * @param bytecodeLength `u32`
 * @returns `f64`
 */
export declare function interpret(x: number, y: number, index: number, count: number, time: number, projectionStartTime: number, bytecodeLength: number): number;
