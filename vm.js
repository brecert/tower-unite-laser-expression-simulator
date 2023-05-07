import { id as Op } from "./constants/instructions.js";
import * as functions from './constants/functions.js'

class ValueStack {
    length = 0;

    constructor(length) {
        this.values = new Float64Array(length);
    }

    push(value) {
        this.values[this.length] = value;
        this.length += 1;
    }

    pop() {
        this.length -= 1;
        return this.values[this.length];
    }

    get() {
        return this.values[this.length - 1]
    }

    take(count) {
        this.length -= count;
        return this.values.slice(this.length, this.length + count);
    }

    reset() {
        this.length = 0;
    }
}

const vs = new ValueStack(8)
vs.push(1)
console.log('e', vs, vs.pop())
// vs.push(1)
// vs.push(1)
// vs.take(2)
// vs.push(2)
// vs.take(2)
// vs.push(3)
// console.log({ vs }, vs.get())

export class BytecodeVM {
    vars = new Map();
    values = new ValueStack(128);

    // inputs and outputs are arrays
    constructor(inputs, outputs) {
        this.inputs = inputs;
        this.outputs = outputs;
    }

    resetStack() {
        this.values.reset()
    }

    getOutput(fromChunks) {
        for (const chunk of fromChunks) {
            this.interpretChunk(chunk)
            this.resetStack()
        }
        return this.outputs
    }

    // no verification checks
    interpretChunk(bytecode) {
        for (let i = 0; i < bytecode.length; i++) {
            const inst = bytecode[i];

            switch (inst) {
                // Literals
                case Op.Lit: {
                    const float = bytecode[++i];
                    this.values.push(float);
                    break;
                }
                // Variables
                case Op.GetVar: {
                    const varName = bytecode[++i];
                    const value = this.vars.get(varName);
                    this.values.push(value)
                    break
                }
                case Op.SetVar: {
                    const varName = bytecode[++i];
                    const value = this.values.get(); // we don't pop because `x = 1` is an expression that returns 1.
                    this.vars.set(varName, value)
                    break;
                }
                case Op.GetOut: {
                    const outputId = bytecode[++i]
                    const value = this.outputs[outputId]
                    this.values.push(value);
                    break
                }
                case Op.SetOut: {
                    const outputId = bytecode[++i]
                    const value = this.values.get();
                    this.outputs[outputId] = value
                    break
                }
                case Op.GetIn: {
                    const inputId = bytecode[++i]
                    const value = this.inputs[inputId]
                    this.values.push(value)
                    break
                }
                // Functions
                case Op.Call: {
                    const fnId = bytecode[++i]
                    const fnArity = functions.arity[fnId]
                    const args = this.values.take(fnArity)
                    const value = functions.table[fnId].apply(null, args)
                    this.values.push(value)
                    break
                }
                // Infix Ops
                case Op.Add: {
                    const [l, r] = this.values.take(2);
                    this.values.push(l + r);
                    break;
                }
                case Op.Sub: {
                    const [l, r] = this.values.take(2);
                    this.values.push(l - r);
                    break;
                }
                case Op.Mul: {
                    const [l, r] = this.values.take(2);
                    this.values.push(l * r);
                    break;
                }
                case Op.Div: {
                    const [l, r] = this.values.take(2);
                    this.values.push(l / r);
                    break;
                }
                case Op.Pow: {
                    const [l, r] = this.values.take(2);
                    this.values.push(l ** r);
                    break;
                }
                case Op.Mod: {
                    const [l, r] = this.values.take(2);
                    this.values.push(l % r);
                    break;
                }
                case Op.Lt: {
                    const [l, r] = this.values.take(2);
                    this.values.push(+(l < r));
                    break;
                }
                case Op.Gt: {
                    const [l, r] = this.values.take(2);
                    this.values.push(+(l > r));
                    break;
                }
                case Op.Leq: {
                    const [l, r] = this.values.take(2);
                    this.values.push(+(l <= r));
                    break;
                }
                case Op.Geq: {
                    const [l, r] = this.values.take(2);
                    this.values.push(+(l >= r));
                    break;
                }
                case Op.Eql: {
                    const [l, r] = this.values.take(2);
                    this.values.push(+(l == r));
                    break;
                }
                // todo: check to see if this is the same behavior
                case Op.And: {
                    const [l, r] = this.values.take(2);
                    this.values.push(+(l && r));
                    break;
                }
                case Op.Or: {
                    const [l, r] = this.values.take(2);
                    this.values.push(+(l || r));
                    break;
                }
                // Prefix Ops
                case Op.Not: {
                    const r = this.values.pop()
                    this.values.push(+!(r > 0))
                    break
                }
                case Op.Neg: {
                    const r = this.values.pop()
                    this.values.push(-r)
                }
            }
        }
    }
}
