import { parse } from './parser.js'
import { BytecodeCompiler } from "./compiler.js";
import { BytecodeVM } from './vm.js';
import { id as Input } from './constants/inputs.js';

const input = `
z = 2;
x' = z * 2;
`

const ast = parse(input)
const bytecode = BytecodeCompiler.compile(ast)

console.log(bytecode)

const vm = new BytecodeVM({
    [Input.x]: 50,
    [Input.y]: 50,
    [Input.pi]: Math.PI,
    [Input.tau]: Math.PI * 2,
    [Input.time]: Date.now() / 1000,
    [Input.projectionTime]: 0,
    [Input.projectionStartTime]: 0,
}, {})

const out = vm.getOutput(bytecode)

console.log(vm)
console.log(out)