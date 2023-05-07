export class Interpreter {
  static functions = {
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    asin: Math.asin,
    acos: Math.acos,
    atan: Math.atan,
    atan2: Math.atan2,
    sqrt: Math.sqrt,
    min: Math.min,
    max: Math.max,
    floor: Math.floor,
    ceil: Math.ceil,
    round: Math.round,
    abs: Math.abs,
    rand: Math.random,
    if: (float, a, b) => float >= 1 ? a : b,
    lerp: (frac, a, b) => (a * frac + b * (1 - frac)),
    // debug
    dbg: (n) => { console.log(n); return n }
  }

  static infix = {
    "+": (l, r) => l + r,
    "-": (l, r) => l - r,
    "*": (l, r) => l * r,
    "/": (l, r) => l / r,
    "^": (l, r) => l ** r,
    "%": (l, r) => l % r,
    "<": (l, r) => +(l < r),
    ">": (l, r) => +(l > r),
    "<=": (l, r) => +(l <= r),
    ">=": (l, r) => +(l >= r),
    "==": (l, r) => +(l == r),
    "&": (l, r) => +(l && r),
    "|": (l, r) => +(l || r),
  }

  static prefix = {
    "!": (r) => +!(r > 0),
    "-": (r) => -r
  }

  static interpret(ast, inputs, vars = { "x'": 0, "y'": 0, h: 0, s: 0, v: 1 }) {
    const interpreter = new this(inputs, vars)
    interpreter.interpret(ast)
    return {
      x: interpreter.vars[`x'`],
      y: interpreter.vars[`y'`],
      h: interpreter.vars[`h`],
      s: interpreter.vars[`s`],
      v: interpreter.vars[`v`],
    }
  }

  constructor(inputs, vars) {
    this.vars = {
      ...inputs,
      ...vars
    }
    this.inputs = new Set(Object.keys(inputs))
  }

  // unsafe and dangerous but should be fine lol
  interpret(ast) {
    if (typeof ast === "number") return ast
    
    switch(ast[0]) {
      case "root": return this.root(ast[1])
      case "assign": return this.assign(ast[1], ast[2], ast[3])
      case "call": return this.call(ast[1], ast[2])
      case "infix": return this.infix(ast[1], ast[2], ast[3])
      case "prefix": return this.prefix(ast[1], ast[2])
      case "var": return this.var(ast[1])
      default: throw new Error(`Unsupported AST: ${type}`)
    }
  }

  root(ast) {
    for (const node of ast) {
      this.interpret(node)
    }
  }

  assign(type, name, ast) {
    if (type !== 'var') throw new Error(`Invalid Assignment Type: ${type}`)
    if (this.inputs.has(name)) throw new Error(`Invalid Assignment, Cannot Assign to Input Variable: ${name}`)

    const value = this.interpret(ast)
    this.vars[name] = value
    return value
  }

  call(name, args) {
    if (!(name in this.constructor.functions)) throw new Error(`Function Not Found: ${name}`)
    return this.constructor.functions[name].apply(null, args.map(arg => this.interpret(arg)))
  }

  infix(op, left, right) {
    if (!(op in this.constructor.infix)) throw new Error(`Infix Not Found: ${op}`)
    return this.constructor.infix[op](this.interpret(left), this.interpret(right))
  }

  prefix(op, right) {
    if (!(op in this.constructor.prefix)) throw new Error(`Infix Not Found: ${op}`)
    return this.constructor.prefix[op](this.interpret(right))
  }

  var(name) {
    if (!(name in this.vars)) throw new Error(`Variable Not Found: ${name}`)
    return this.vars[name]
  }
}
