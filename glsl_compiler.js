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

    in vec3 v_coord_index;
    
    uniform sampler2D u_texture;
    uniform float time;
    uniform float count;
    uniform float projectionStartTime;
    uniform float random;
    uniform vec3 u_transform;

    out float h;
    out float s;
    out float v;

    float lerp(float frac, float a, float b) {
        return mix(a, b, frac);
    }

    float iif(float cond, float a, float b) {
        return mix(b, a, step(1.0, cond));
    }

    float atan2(float y, float x) {
        bool s = abs(x) > abs(y);
        return mix(pi/2.0 - atan(x,y), atan(y,x), float(s));
    }
    
    float rand() {
        return random;
    }

    void main () {
        float x = v_coord_index.x;
        float y = v_coord_index.y;
        float index = v_coord_index.z;
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
        
        vec2 scale = u_transform.xy;
        float angle = u_transform.z;
        
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

// not a true bytecode but close enough for out needs
export class GLSLCompiler {
    /** @type {Map<string, number>} */
    knownVars = new Map()
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
     * @param {import('./types.d.ts').Expression} ast 
     * @returns {string} the expression compiled to GLSL code without any surrounding code
     */
    compileRaw(ast) {
        // todo: add [lit, val]
        if (ast == null) throw new Error("TODO: Unexpected null")
        if (typeof ast === 'number') return fmtNumber(ast)

        switch (ast[0]) {
            case "root": {
                return ast[1].flatMap(expr => this.compileRaw(expr)).join('')
            }
            case "assign": {
                const [, type, name, expr] = ast

                if (type !== 'var') throw new Error(`Invalid Assignment Type: ${type}`)
                if (isInput(name)) throw new Error(`Invalid Assignment, cannot assign to input variable: ${name}`)

                const assignName = isOutput(name)
                    ? getOutputName(name)
                    : this.getVarName(name)

                const isInitialVar =
                    !isOutput(name) && !this.knownVars.has(name)

                // we do bytecode here before knownvars so we don't accidently refer to an invalid variable
                let expression = this.compileRaw(expr)

                if (isInitialVar) this.knownVars.set(name, this.knownVars.size)

                // todo: optimize variables names to keep track of stacksize and pull from that as needed
                return `${isInitialVar ? 'float ' : ''}${assignName} = ${expression};\n`
            }
            case "call": {
                let [, name, args] = ast

                if (!isFunction(name))
                    throw new Error(`Function not found: ${name}`)

                const id = fns.id[name]

                if (args.length !== fns.arity[id])
                    throw new Error(`Invalid amount of arguments: ${name} expected ${fns.arity[name]} arguments, not ${args.length}`)

                if (id == fns.id.if) {
                    name = "iif";
                }

                return `${name}(${args.flatMap(arg => this.compileRaw(arg)).join(', ')})`
            }
            case "infix": {
                let [, op, left, right] = ast

                if (!(op in instructions.infix)) throw new Error(`Invalid InfixOp: ${op}`)

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

                if (!(op in instructions.prefix)) throw new Error(`Invalid PrefixOp: ${op}`)

                return `(${op}${this.compileRaw(right)})`
            }
            case "var": {
                const [, name] = ast

                if (!isInput(name) && !isOutput(name) && !this.knownVars.has(name))
                    throw new Error(`Variable Not Found: ${name}`)

                let getName = this.getVarName(name)

                if (isInput(name)) {
                    getName = getInputName(name)
                    if (name === "time" || name === "projectionTime") {
                        this.usedDynamicVar = true;
                    }
                }
                else if (isOutput(name)) {
                    getName = getOutputName(name)
                }

                return getName
            }
            default: {
                throw new Error(`Invalid Instruction: [${JSON.stringify(ast)}]`)
            }
        }
    }
}
