import { parseProgram } from './parser.js'
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

    for (i; i < instructions.length; i++) {
        const opcode = instructions[i]

        const name = instructionNames[opcode]

        if (opcode >= Instruction.Add && opcode <= Instruction.Or) {
            // (${infixNames[opcode]})
            console.log(`${name}`)
            continue
        }
        if (opcode == Instruction.Not || opcode == Instruction.Neg) {
            // (${prefixNames[opcode]})
            console.log(`${name}`)
            continue
        }
        switch (opcode) {
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
size = 500;

# Plot the tornado points in 3d
sidx = index * 0.15;
spin = sidx + (time / (sidx ^ 1.2)) * 50;
heightRand = (sidx ^ 0.6) * 10 -sin(sidx * 10000) * 8;

xp = cos(spin) * sidx;
yp = heightRand;
zp = sin(spin) * sidx + 500;

xp = xp + sin(sidx/10 + time) * 10;
zp = zp + cos(sidx/10 + time) * 10;


x' = xp;
y' = yp + 100;

z = zp;
x' = x' * size / z;
y' = y' * size / z - 145;

h = -time*100 + fraction*350;
v = 2.5 - z/300;
s = v;
`

// const t = Tokenizer.fromString(input)
const ast = parseProgram(input)
for (let error of ast.errors) {
    console.error(error)
}
if (ast.errors.length > 0) {
    throw new Error(ast.errors)
}

console.log(ast)

// const ast = parse(input)
// console.log(ast)

// const input = `
// var = 4;
// var = 1;
// var = 2;

// x' = x;
// y' = y;

// h = var * 100;
// s = 0.9;
// `
// const ast = parse(input)
const bytecode = BytecodeCompiler.compile(ast.exprs)
printBytecode(bytecode)
// console.log(bytecode)
// const inputs = { x: 0, y: 0, index: 1, count: 1, time: Date.now() / 1000, projectionTime: 0, projectionStartTime: 0 }
// const output = interpret(bytecode, inputs)
// console.log(output)