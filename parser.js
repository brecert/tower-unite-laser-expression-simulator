import { lang, empty } from 'https://unpkg.com/parser-lang@0.4.0/main.mjs?module';

const infixAst = ([l ,, op ,, r]) => ['infix', op, l, r]
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
    
  InfixOpAll
    = InfixOpAdd o ('<'|'>'|'<='|'>='|'=='|'&'|'|') o InfixOpAll > ${infixAst}
    | InfixOpAdd
    ;
  
  Assign
    = variable o '=' o Expression > ${([l ,, op ,, r]) => ['assign', ...l, r]}
    ;
    
  InfixOpAdd
    = InfixOpMul o ('+'|'-') o InfixOpAdd > ${infixAst}
    | InfixOpMul
    ;
    
  InfixOpMul
    = InfixOpPow o ('*'|'/') o InfixOpMul > ${infixAst}
    | InfixOpPow
    ;
    
  InfixOpPow
    = Base o ('^'|'%') o InfixOpPow > ${infixAst}
    | Base
    ;
    
  Base
    = '(' o Expression o ')' > ${a => a[2]}
    | Call
    | FloatExpr
    | variable
    | '-' Base > ${a => ['prefix', '-', a[1]]}
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

export const parse = (input) =>
    parser.Root.tryParse(input.replaceAll(/#.+/g, ''))
  








