// @ts-check
const RE_TOKEN = /([0-9]?\.?[0-9]+)|([\w_.']+)|(<=|>=|==|[><|&^%=*/,;()+*/-])|(\n)|(\s+)|(#.+)|(.)/gi

const
  TOKEN_FLOAT = 1,
  TOKEN_IDENT = 2,
  TOKEN_SYM = 3,
  TOKEN_NL = 4,
  TOKEN_WS = 5,
  TOKEN_COMMENT = 6,
  TOKEN_UNKNOWN = 7

export class Tokenizer {
  line = 0
  column = 0
  offset = 0
  #lastIndex = 0

  pos = 0
  tokens

  /** @param {string} string  */
  static fromString(string) {
    return new this([...string.matchAll(RE_TOKEN)])
  }

  /** @param {RegExpMatchArray[]} tokens  */
  constructor(tokens) {
    this.tokens = tokens.filter(t => !t[TOKEN_WS])
  }

  /** @returns {RegExpMatchArray} */
  next() {
    const token = this.tokens[this.pos]
    if (!token) return token

    this.pos += 1
    this.column += (token.index ?? 0) - this.#lastIndex
    this.offset = token.index ?? -1
    this.#lastIndex = token.index ?? 0

    if (token[TOKEN_NL] != null || token[TOKEN_COMMENT] != null) {
      this.line += 1
      this.column = 0
      return this.next()
    }

    return token
  }

  peek(offset = 0) {
    let tok = this.tokens[this.pos + offset]
    while (tok?.[TOKEN_NL] != null || tok?.[TOKEN_COMMENT] != null) {
      offset += 1
      tok = this.tokens[this.pos + offset]
    }
    return tok
  }

  /** Skip to the next expression for failable parsing */
  gotoNextExpression() {
    let tok
    do {
      tok = this.next()
    } while (tok != null && tok[TOKEN_SYM] != ';')
  }
}

class ParsingError extends Error {
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

class ExpectedTokenError extends ParsingError {
  /**
   * 
   * @param {{ line: number, column: number, offset: number }} t 
   * @param {string} expected 
   * @param {RegExpMatchArray} actual 
   */
  constructor(t, expected, actual) {
    super(t, `Expected ${expected} but got ${actual ? formatToken(actual) : `EOF`} instead while parsing.`)
  }
}

/** @param {RegExpMatchArray} token */
const formatToken = ([text]) =>
  `'${text.replace('\n', '\\n')}'`

/** @param {string} tok  */
function infixBP(tok) {
  switch (tok) {
    case '&':
    case '|':
      return [2, 3]
    case '<=':
    case '>=':
    case '==':
    case '<':
    case '>':
      return [4, 5]
    case '^':
    case '%':
      return [6, 7]
    case '+':
    case '-':
      return [8, 9]
    case '*':
    case '/':
      return [10, 11]
  }
}

/** @param {string} tok  */
function prefixBP(tok) {
  // TODO: FIX ME
  switch (tok) {
    case '-': return 12
    case '!': return 0
  }
}

/**
 * @param {Tokenizer} t 
 * @param {number} mbp 
 * @returns {import("./types.d.ts").Expression}
 */
export function parseBPExpr(t, mbp) {
  let tok = t.next()
  /** @type {import("./types.d.ts").Expression} */
  let lhs = null
  let pbp

  if (tok == null) {
    return lhs
  }
  else if (tok[TOKEN_IDENT] != null) {
    let name = tok[TOKEN_IDENT]
    lhs = ['var', name]
    tok = t.peek()
    if (tok?.[TOKEN_SYM] === '(') {
      t.next()

      tok = t.peek()

      if (tok?.[TOKEN_SYM] === ')') {
        t.next()
        lhs = ['call', name, []]
      } else {
        let args = []
        do {
          let expr = parseBPExpr(t, 0)
          args.push(expr)

          tok = t.peek()
          if (tok?.[TOKEN_SYM] === ')') {
            t.next()
            break
          }
          else if (tok?.[TOKEN_SYM] === ',') {
            t.next()
            continue
          }
          else throw new ExpectedTokenError(t, `')' or ','`, tok)
        } while (tok)
        lhs = ['call', name, args]
      }
    }
  }
  else if (tok[TOKEN_FLOAT] != null) {
    lhs = parseFloat(tok[TOKEN_FLOAT])
    tok = t.peek()
    // it's a postfix and we could fit it in the pratt loop but we only want the postfix if it's a float for clarity
    if (tok?.[TOKEN_IDENT] != null) {
      t.next()
      lhs = ['infix', '*', lhs, ['var', tok[TOKEN_IDENT]]]
    }
  }
  else if (tok[TOKEN_SYM] === '(') {
    lhs = parseBPExpr(t, 0)
    tok = t.next()
    if (tok?.[TOKEN_SYM] !== ')') {
      throw new ExpectedTokenError(t, `')'`, tok)
    }
  }
  else if ((pbp = prefixBP(tok[0])) != null) {
    const rhs = parseBPExpr(t, pbp)
    lhs = ['prefix', tok[0], rhs]
  }
  else throw new ParsingError(t, `Unexpected Literal or Unsupported Prefix: ${formatToken(tok)}`)

  while (true) {
    let op = t.peek()
    if (!op) break

    if (op[TOKEN_SYM] === ';') {
      return lhs
    }

    if (op[TOKEN_SYM] == null) {
      throw new ParsingError(t, `Unexpected Infix Token: ${formatToken(op)}`)
    }

    let ibp = infixBP(op[0])
    if (ibp) {
      let [lbp, rbp] = ibp

      if (lbp < mbp) break
      t.next()

      let rhs = parseBPExpr(t, rbp)
      lhs = ['infix', op[0], lhs, rhs]
      continue
    }

    // throw new ParsingError(t, `Invalid Token?: ${formatToken(op)}`)
    break
  }

  return lhs
}

/** 
 * @param {string} text
 * @returns {{ exprs: ['root', import('./types.d.ts').Expression[]], errors:(Error|ParsingError)[] }}
*/
export function parseProgram(text) {
  let t = Tokenizer.fromString(text)
  /** @type {import('./types.d.ts').Expression[]} */
  let exprs = []
  let errors = []
  while (true) {
    try {
      let name = t.peek()
      if (name == null) break
      if (name[TOKEN_IDENT] == null) throw new ExpectedTokenError(t, "an identifier", name)
      t.next()

      let eq = t.peek()
      if (eq?.[TOKEN_SYM] !== '=') throw new ExpectedTokenError(t, `'='`, eq)
      t.next()

      let expr = parseBPExpr(t, 0)
      if (expr == null) throw new ExpectedTokenError(t, `an expression starting with an identifier, a number, '(', '-', or '!'`, t.peek())

      let semi = t.peek()
      if (semi?.[TOKEN_SYM] !== ';') throw new ExpectedTokenError(t, `';'`, semi)
      else t.next()

      exprs.push(['assign', 'var', name[TOKEN_IDENT], expr])
    } catch (error) {
      errors.push(error)
      t.gotoNextExpression()
    }
  }
  return { exprs: ['root', exprs], errors }
}

/** 
 * parses a string and resturns a 'root' expression, throws the first parsing error if any are found
 * @deprecated use {@link parseProgram} instead, this function is a holdover from before errors were returned as a set
 * @param {string} string the input string to parse
 **/
export const parse = (string) => {
  const { exprs, errors } = parseProgram(string)
  if (errors[0]) throw errors[0]
  return exprs
}