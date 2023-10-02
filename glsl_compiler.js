// @ts-check

import * as fns from './constants/functions.js'
import * as instructions from './constants/instructions.js'
import * as inputs from './constants/inputs.js'
import * as outputs from './constants/outputs.js'

const VERTEX_SHADER = `
    #version 300 es
    precision mediump float;

    const float pi = 3.14159;
    const float tau = 6.28318;
    
    uniform vec3 transform;

    uniform float time;
    uniform float count;
    uniform float projectionStartTime;
    uniform float random;

    in vec3 coordIndex;

    out float h;
    out float s;
    out float v;

    float lerp(float frac, float a, float b) {
        return mix(a, b, frac);
    }

    float iif(float cond, float a, float b) {
        return mix(b, a, step(1.0, cond));
    }
    
    float rand() {
        return random;
    }

    void main () {
        float x = coordIndex.x;
        float y = coordIndex.y;
        float index = coordIndex.z;
        float fraction = index / count;
        float projectionTime = time - projectionStartTime;

        float x1 = 0.0;
        float y1 = 0.0;

        h = 0.0;
        s = 0.0;
        v = 1.0;

        {{SHADER}}
        
        h = h - (float(h<0.0) * 120.0);
        h = h / 360.0;
        
        vec2 scale = transform.xy;
        float angle = transform.z;
        
        float radians = angle * pi / 180.0;
        vec2 rotation = vec2(sin(radians), cos(radians));
        
        gl_Position = vec4(x1, y1, 0.0, 1.0);

        gl_Position.xy = gl_Position.xy / 200.0;
        gl_Position.xy = gl_Position.xy * scale;
        
        gl_Position.xy = vec2(
            gl_Position.x * rotation.y + gl_Position.y * rotation.x,
            gl_Position.y * rotation.y - gl_Position.x * rotation.x
        );

        gl_PointSize = 9.0;
    }
`.trim()

const FRAGMENT_SHADER = `
    #version 300 es
    precision mediump float;
    
    in float h;
    in float s;
    in float v;
    
    out vec4 fragColor;

    vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main () {
        fragColor = vec4(hsv2rgb(vec3(h, clamp(s, 0.0, 1.0), clamp(v, 0.0, 1.0))), v);
    }
`.trim()

const isInput = (name) => name in inputs.id
const isOutput = (name) => name in outputs.id
const isFunction = (name) => name in fns.id
const isBooleanOp = (name) => ["<", ">", "<=", ">=", "==", "&", "|"].includes(name)

const outputNames = {
    "x'": "x1",
    "y'": "y1",
    "h": "h",
    "s": "s",
    "v": "v"
}

const getInputName = (name) => name
const getOutputName = (name) => outputNames[name]
const fmtNumber = (num) => Number.isInteger(num)
    ? num.toFixed(1)
    : num.toString()

class CompileError extends Error {
    line = 0
    column = 0
    offset = 0

    /**
     * @param {{ line: number, column: number, offset: number }} context
     * @param {string} message 
     */
    constructor({ line, column, offset }, message) {
        super(message)
        this.line = line
        this.column = column
        this.offset = offset
    }

    toString() {
        return `[${this.line}:${this.column}] ${this.message}`
    }
}

// not a true bytecode but close enough for out needs
export class GLSLCompiler {
    /** @type {Map<string, number>} */
    knownVars = new Map()
    /** @type {Set<string>} */
    seenOutputs = new Set()
    usedDynamicVar = false;

    /** @param {import('./types.d.ts').Expression} ast  */
    static compile(ast) {
        const compiler = new this();
        return compiler.compile(ast)
    }

    /** @param {import('./types.d.ts').Expression} ast  */
    static compileRaw(ast) {
        const compiler = new this();
        return compiler.compileRaw(ast)
    }

    /** @param {string} name  */
    getVarName(name) {
        const id = this.knownVars.get(name) ?? this.knownVars.size
        return `_${id}`
    }

    /**
     * 
     * @param {import('./types.d.ts').Expression} ast 
     * @returns {{vertex: string, fragment: string, isDynamic: boolean}}
     */
    compile(ast) {
        const raw = this.compileRaw(ast)
        return {
            vertex: VERTEX_SHADER.replace("{{SHADER}}", raw),
            fragment: FRAGMENT_SHADER,
            isDynamic: this.usedDynamicVar
        }
    }

    /**
     * 
     * @param {import('./types.d.ts').Expression} astCtx
     * @returns {string} the expression compiled to GLSL code without any surrounding code
     */
    compileRaw(astCtx) {
        // todo: add [lit, val]
        if (astCtx == null) throw new Error("TODO: Unexpected null")
        const { val: ast, ctx } = astCtx
        if (typeof ast === 'number') return fmtNumber(ast)

        switch (ast[0]) {
            case "root": {
                return ast[1].flatMap(expr => this.compileRaw(expr)).join('')
            }
            case "assign": {
                const [, type, name, expr] = ast

                if (type !== 'var') throw new CompileError(ctx, `Invalid Assignment Type: ${type}`)
                if (isInput(name)) throw new CompileError(ctx, `Invalid Assignment, cannot assign to input variable: ${name}`)

                const assignName = isOutput(name)
                    ? getOutputName(name)
                    : this.getVarName(name)

                const isInitialVar =
                    !isOutput(name) && !this.knownVars.has(name)

                // we do bytecode here before knownvars so we don't accidently refer to an invalid variable
                let expression = this.compileRaw(expr)

                if (isInitialVar) this.knownVars.set(name, this.knownVars.size)
                if (isOutput(name)) this.seenOutputs.add(name)

                // todo: optimize variables names to keep track of stacksize and pull from that as needed
                return `${isInitialVar ? 'float ' : ''}${assignName} = ${expression};\n`
            }
            case "call": {
                let [, name, args] = ast

                if (!isFunction(name))
                    throw new CompileError(ctx, `Function not found: ${name}`)

                const id = fns.id[name]

                if (args.length !== fns.arity[id])
                    throw new CompileError(ctx, `Invalid amount of arguments: ${name} expected ${fns.arity[name]} arguments, not ${args.length}`)

                if (id === fns.id.if) {
                    name = "iif";
                }

                if (id === fns.id.atan2) {
                    name = "atan";
                }

                return `${name}(${args.flatMap(arg => this.compileRaw(arg)).join(', ')})`
            }
            case "infix": {
                let [, op, left, right] = ast

                if (!(op in instructions.infix)) throw new CompileError(ctx, `Invalid infix operator: ${op}`)

                const lhs = this.compileRaw(left)
                const rhs = this.compileRaw(right)

                if (op == "^") {
                    return `pow(${lhs}, ${rhs})`
                }

                if (op === '%') {
                    return `mod(${lhs}, ${rhs})`
                }

                if (op == '&') {
                    return `float(bool(${lhs}) && bool(${rhs}))`
                }

                if (op == '|') {
                    return `float(bool(${lhs}) || bool(${rhs}))`
                }

                return `${isBooleanOp(op) ? 'float' : ''}(${lhs} ${op} ${rhs})`
            }
            case "prefix": {
                const [, op, right] = ast

                if (!(op in instructions.prefix)) throw new CompileError(ctx, `Invalid prefix operator: ${op}`)

                return `(${op}${this.compileRaw(right)})`
            }
            case "var": {
                const [, name] = ast

                if (!isInput(name) && !isOutput(name) && !this.knownVars.has(name))
                    throw new CompileError(ctx, `Variable Not Found: ${name}`)

                let getName = this.getVarName(name)

                if (isInput(name)) {
                    getName = getInputName(name)
                    if (name === "time" || name === "projectionTime") {
                        this.usedDynamicVar = true;
                    }
                }
                else if (isOutput(name)) {
                    if (!this.seenOutputs.has(name)) {
                        throw new CompileError(ctx, `Outputs must be assigned to first before being used to avoid bugs`)
                    }
                    getName = getOutputName(name)
                }

                return getName
            }
            default: {
                throw new CompileError(ctx, `Invalid Instruction: [${JSON.stringify(ast)}]`)
            }
        }
    }
}
