import { lang, empty } from 'https://unpkg.com/parser-lang@0.4.0/main.mjs?module';

const infixAst = ([l, r]) => {
  if(r.length === 0) {
    return l
  } else {
    const x = r.reduce((acc, curr) => {
      return ['infix', curr[1], acc, curr[3]]
    }, l)
    // console.log({ l, x })
    return x
  }
}
const prefixAst = ([op ,, r]) => ['prefix', op, r]

// while we can assign to any expr, only ident seems to do anything so we'll just do checks to simplify error checking and parsing
export const parser = lang`
  Root
    = (o Expression o ';')* o empty > ${a => ['root', a[0].map(a => a[1])]}
    ;

  Expression
    = PrefixOp
    | Assign
    | InfixOpAll
    ;

  Call
    = ident o '(' o ')' > ${a => ['call', a[0], []]}
    | ident o '(' o Expression (o ',' o Expression)* o ')' > ${a => ['call', a[0], [a[4], ...a[5].map(a => a[3])]]}
    ;


  Assign
    = variable o '=' o Expression > ${([l ,, op ,, r]) => ['assign', ...l, r]}
    ;
    
  InfixOpAll
    = InfixOpCmp (o ('&'|'|') o InfixOpAll)* > ${infixAst}
    ;

  InfixOpCmp
    = InfixOpPow (o ('<='|'>='|'=='|'<'|'>') o InfixOpCmp)* > ${infixAst}
    ;

  InfixOpPow
    = InfixOpAdd (o ('^'|'%') o InfixOpPow)* > ${infixAst}
    ;

  InfixOpAdd
    = InfixOpMul (o ('+'|'-') o InfixOpAdd)* > ${infixAst}
    ;
    
  InfixOpMul
    = Base (o ('*'|'/') o InfixOpMul)* > ${infixAst}
    ;
    
  Base
    = '(' o Expression o ')' > ${a => a[2]}
    | Call
    | FloatExpr
    | variable
    | '-' o Base > ${a => ['prefix', '-', a[2]]}
    ;
    
  FloatExpr
    = float variable > ${a => ['infix', '*', a[0], a[1]]}
    | float
    ;
    
  PrefixOp
    = '!' o Expression > ${prefixAst}
    ;
    
  variable = ident > ${a => ['var', a]};
  
  o = /\s/*;
  ident = /[\w_.']+/ > ${a => a};
  float = /([0-9])?\.?[0-9]+/ > ${ch => parseFloat(ch)};
  untilEnd = /[^\n]*/;
  
  empty = @${empty()};
`

// todo: identifier's can hold unicode characters / emojis, it may be a blacklist rather than a whitelist

export const parse = (input) =>
    parser.Root.tryParse(input.replaceAll(/#.+/g, ''))






