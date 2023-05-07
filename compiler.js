import * as fns from './constants/functions.js'
import * as instructions from './constants/instructions.js'
import * as inputs from './constants/inputs.js'
import * as outputs from './constants/outputs.js'

const isInput = (name) => name in inputs.id
const isOutput = (name) => name in outputs.id
const isFunction = (name) => name in fns.id

// not a true bytecode but close enough for out needs
export class BytecodeCompiler {
    knownVars = new Set()

    static compile(ast) {
        return new this().compile(ast)
    }

    compile(ast) {
        // todo: add [lit, val]
        if(typeof ast === 'number') return [instructions.id.Lit, ast]

        switch (ast[0]) {
            case "root": {
                // return chunks
                return ast[1].map(expr => this.compile(expr).flat(Infinity))
            }
            case "assign": {
                const [, type, name, expr] = ast

                if (type !== 'var') throw new Error(`Invalid Assignment Type: ${type}`)
                if (isInput(name)) throw new Error(`Invalid Assignment, cannot assign to input variable: ${name}`)

                const assignType = isOutput(name)
                    ? instructions.id.SetOut
                    : instructions.id.SetVar

                const assignName = isOutput(name)
                    ? outputs.id[name]
                    : name

                // we do bytecode here before knownvars so we don't accidently refer to an invalid variable
                let bytecode = this.compile(expr)

                if(assignType == instructions.id.SetVar)
                    this.knownVars.add(name)

                // todo: optimize variables names to keep track of stacksize and pull from that as needed
                return [bytecode, assignType, assignName]
            }
            case "call": {
                const [, name, args] = ast

                console.log(name, )

                if (!isFunction(name))
                    throw new Error(`Function not found: ${name}`)

                const id = fns.id[name]

                if (args.length !== fns.arity[id])
                    throw new Error(`Invalid amount of arguments: ${name} expected ${fns.arity[name]} arguments, not ${args.length}`)

                return [...args.map(arg => this.compile(arg)), instructions.id.Call, id]
            }
            case "infix": {
                const [, op, left, right] = ast

                if (!(op in instructions.infix)) throw new Error(`Invalid InfixOp: ${op}`)


                return [this.compile(left), this.compile(right), instructions.infix[op]]
            }
            case "prefix": {
                const [, op, right] = ast

                if (!(op in instructions.prefix)) throw new Error(`Invalid PrefixOp: ${op}`)

                return [this.compile(right), instructions.prefix[op]]
            }
            case "var": {
                const [, name] = ast

                if (!isInput(name) && !isOutput(name) && !this.knownVars.has(name))
                    throw new Error(`Variable Not Found: ${name}`)

                let getType = instructions.id.GetVar
                let getName = name

                if (isInput(name)) {
                    getType = instructions.id.GetIn
                    getName = inputs.id[name]
                }
                else if (isOutput(name)) {
                    getType = instructions.id.GetOut
                    getName = outputs.id[name]
                }

                return [getType, getName]
            }
            default: {
                throw new Error(`Invalid Instruction: [${ast}]`)
            }
        }
    }
}
