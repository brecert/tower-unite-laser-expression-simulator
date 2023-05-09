import assert from "assert";
import { memory, interpret } from "../build/debug.js";

const stack = new Float64Array(memory.buffer)
let p = 0;
stack[p++] = 21;
stack[p++] = 1;
// [1]
stack[p++] = 21;
stack[p++] = 2;
// [1, 2]
stack[p++] = 21;
stack[p++] = 3;
// [1, 2, 3]
stack[p++] = 6;
// [1, 5]
stack[p++] = 6;
// [6]
stack[p++] = 3;
stack[p++] = 0;
// [] { x'=6 }
stack[p++] = 23;

// console.log(stack, memory.buffer)
const result = interpret(0, 0, 1, 1, Date.now() / 1000, 0, 0, 7)
assert.strictEqual(result, 6.0)
console.log("ok")
