import { parse } from './parser.js'
import { BytecodeCompiler } from "./compiler.js";
import { id as Input } from './constants/inputs.js';
import { id as Instruction, infix as Infix, prefix as Prefix } from './constants/instructions.js';
import { interpret } from './vm/src/index.js';
import { id as Output } from './constants/outputs.js';
import { id as Function, arity as Arity } from './constants/functions.js';

const flipObject = (obj) =>
    Object.fromEntries(Object.entries(obj).map(([a, b]) => [b, a]))

const infixNames = flipObject(Infix)
const prefixNames = flipObject(Prefix)
const instructionNames = flipObject(Instruction)
const inputNames = flipObject(Input)
const outputNames = flipObject(Output)
const functionNames = flipObject(Function)
const printBytecode = (instructions) => {
    let i = 0;

    const next = () => instructions[++i]

    for(i; i < instructions.length; i++) {
        const opcode = instructions[i]

        const name = instructionNames[opcode]
        
        if(opcode >= Instruction.Add && opcode <= Instruction.Or) {
            // (${infixNames[opcode]})
            console.log(`${name}`)
            continue
        }
        if(opcode == Instruction.Not || opcode == Instruction.Neg) {
            // (${prefixNames[opcode]})
            console.log(`${name}`)
            continue
        }
        switch(opcode) {
            case Instruction.GetVar: {
                console.log(`Get #${next()}`)
                continue
            }
            case Instruction.SetVar: {
                console.log(`Set #${next()}`)
                continue
            }
            case Instruction.GetOut: {
                console.log(`Get ${outputNames[next()]}`)
                continue
            }
            case Instruction.SetOut: {
                console.log(`Set ${outputNames[next()]}`)
                continue
            }
            case Instruction.GetIn: {
                console.log(`Get ${inputNames[next()]}`)
                continue
            }
            case Instruction.Call: {
                const id = next()
                const arity = Arity[id]
                console.log(`Call ${functionNames[id]} (${arity})`)
                continue
            }
            case Instruction.Lit: {
                console.log(`Lit ${next()}`)
                continue
            }
            case Instruction.Chunk: {
                console.log(`\nchunk:`)
                continue
            }
            case Instruction.End: {
                console.log(`\nEnd`)
                continue
            }
            default: console.log(`MISSING: ${instructionNames[opcode]} (${opcode})`)
        }
    }
}

const input = `
var = 4;
var = 1;
var = 2;

x' = x;
y' = y;

h = var * 100;
s = 0.9;
`
const ast = parse(input)
const bytecode = BytecodeCompiler.compile(ast)
printBytecode(bytecode)
// console.log(bytecode)
// const inputs = { x: 0, y: 0, index: 1, count: 1, time: Date.now() / 1000, projectionTime: 0, projectionStartTime: 0 }
// const output = interpret(bytecode, inputs)
// console.log(output)