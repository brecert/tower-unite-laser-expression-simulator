// Instructions
@inline
const
  Op_End    : u8 = 0,
  Op_GetVar : u8 = 1,
  Op_SetVar : u8 = 2,
  Op_GetOut : u8 = 3,
  Op_SetOut : u8 = 4,
  Op_GetIn  : u8 = 5,
  Op_Call   : u8 = 6,
  Op_Add    : u8 = 7,
  Op_Sub    : u8 = 8,
  Op_Mul    : u8 = 9,
  Op_Div    : u8 = 10,
  Op_Pow    : u8 = 11,
  Op_Mod    : u8 = 12,
  Op_Lt     : u8 = 13,
  Op_Gt     : u8 = 14,
  Op_Leq    : u8 = 15,
  Op_Geq    : u8 = 16,
  Op_Eql    : u8 = 17,
  Op_And    : u8 = 18,
  Op_Or     : u8 = 19,
  Op_Not    : u8 = 20,
  Op_Neg    : u8 = 21,
  Op_Lit    : u8 = 22,
  Op_Chunk  : u8 = 23


// Inputs
@inline
const
  In_x                   : u8 = 0,
  In_y                   : u8 = 1,
  In_index               : u8 = 3,
  In_count               : u8 = 4,
  In_fraction            : u8 = 5,
  In_pi                  : u8 = 6,
  In_tau                 : u8 = 7,
  In_time                : u8 = 8,
  In_projectionTime      : u8 = 9,
  In_projectionStartTime : u8 = 10

// Outputs
@inline
const
  Out_x : u8 = 0,
  Out_y : u8 = 1,
  Out_h : u8 = 2,
  Out_s : u8 = 3,
  Out_v : u8 = 4

@inline
const
  Fn_sin    : u8 = 0,
  Fn_cos    : u8 = 1,
  Fn_tan    : u8 = 2,
  Fn_asin   : u8 = 3,
  Fn_acos   : u8 = 4,
  Fn_atan   : u8 = 5,
  Fn_atan2  : u8 = 6,
  Fn_sqrt   : u8 = 7,
  Fn_min    : u8 = 8,
  Fn_max    : u8 = 9,
  Fn_floor  : u8 = 10,
  Fn_ceil   : u8 = 11,
  Fn_round  : u8 = 12,
  Fn_abs    : u8 = 13,
  Fn_if     : u8 = 14,
  Fn_lerp   : u8 = 15,
  Fn_dbg    : u8 = 16

// @inline
// function getFnArity(fnId: u32): u32 {
//   switch(fnId) {
//     case Fn_sin:
//     case Fn_acos:
//     case Fn_asin:
//     case Fn_atan:
//     case Fn_sqrt:
//     case Fn_floor:
//     case Fn_ceil:
//     case Fn_round:
//     case Fn_abs:
//     case Fn_dbg:
//       return 1
//     case Fn_atan2:
//     case Fn_min:
//     case Fn_max:
//       return 2
//     case Fn_if:
//     case Fn_lerp:
//       return 3
//     default: abort(); return 0
//   }
// }

// todo: this may need to moved eventually for optimized block sizing
const stack = new StaticArray<f64>(64)

@inline
function varPtr(offset: u32, id: u32): u32 {
  return offset*sizeof<f64>() + id*sizeof<f64>()
}

export function interpret(
  x: f64, y: f64, 
  index: f64, count: f64, 
  time: f64, projectionStartTime: f64,
  bytecodeLength: u32,
): f64 {
  // calculated inputs
  const projectionTime = time - projectionStartTime;
  const fraction = index / count;
  const pi = Math.PI;
  const tau = pi * 2;
  
  // outputs
  let x$ : f64 = 0;
  let y$ : f64 = 0;
  let h  : f64 = 0;
  let s  : f64 = 0;
  let v  : f64 = 1; 

  let stackSize = 0;
  
  // console.log(`len: ${bytecodeLength.toString()}`)
  for(let i: u32 = 0; i < bytecodeLength; i++) {
    const opcode = <u32>load<f64>(i * sizeof<f64>())
    // console.log(`(${i}) ${opcode.toString()}`)
    
    if(opcode >= Op_Add && opcode <= Op_Or) {
      let value: f64
      const r = (stack[--stackSize]);
      const l = (stack[--stackSize]);
      switch (<u32>opcode) {
        case Op_Add : { value = (l + r);     break }
        case Op_Sub : { value = (l - r);     break }
        case Op_Mul : { value = (l * r);     break }
        case Op_Div : { value = (l / r);     break }
        case Op_Pow : { value = (l ** r);    break } // big output
        case Op_Mod : { value = (l % r);     break } // big output
        case Op_Lt  : { value = (+(l < r));  break }
        case Op_Gt  : { value = (+(l > r));  break }
        case Op_Leq : { value = (+(l <= r)); break }
        case Op_Geq : { value = (+(l >= r)); break }
        case Op_Eql : { value = (+(l == r)); break }
        case Op_And : { value = (+(l && r)); break } // todo: check to see if this is the same behavior
        case Op_Or  : { value = (+(l || r)); break }
        default: abort(`Invalid Infix Opcode: ${opcode}`); return 0 // return otherwise there's a compile error
      };
      (stack[stackSize++] = (value));
      continue
    }

    switch (opcode) {
      case Op_Lit: {
        const value = load<f64>((++i) * sizeof<f64>());
        (stack[stackSize++] = (value));
        break
      }
      case Op_Chunk: {
        stackSize = 0;
        break
      }
      case Op_Call: {
        const fnId = <u32>load<f64>((++i) * sizeof<f64>());
        let value: f64
        switch(fnId) {
          // arity: 1
          case Fn_sin:
            value = Math.sin((stack[--stackSize]))
            break
          case Fn_cos:
            value = Math.cos((stack[--stackSize]))
            break
          case Fn_tan:
            value = Math.tan((stack[--stackSize]))
            break
          case Fn_acos:
            value = Math.acos((stack[--stackSize]))
            break
          case Fn_asin:
            value = Math.asin((stack[--stackSize]))
            break
          case Fn_atan:
            value = Math.atan((stack[--stackSize]))
            break
          case Fn_sqrt:
            value = Math.sqrt((stack[--stackSize]))
            break
          case Fn_floor:
            value = Math.floor((stack[--stackSize]))
            break
          case Fn_ceil:
            value = Math.ceil((stack[--stackSize]))
            break
          case Fn_round:
            value = Math.round((stack[--stackSize]))
            break
          case Fn_abs:
            value = Math.abs((stack[--stackSize]))
            break
          case Fn_dbg:
            abort("dbg is not implemented")
          // arity: 2
          case Fn_atan2: {
            const b = (stack[--stackSize])
            const a = (stack[--stackSize])
            value = Math.atan2(a, b)
            break
          }
          case Fn_min: {
            const b = (stack[--stackSize])
            const a = (stack[--stackSize])
            value = Math.min(a, b)
            break
          }
          case Fn_max: {
            const b = (stack[--stackSize])
            const a = (stack[--stackSize])
            value = Math.max(a, b)
            break
          }
          // arity: 3
          case Fn_if: {
            const ifFalse = (stack[--stackSize])
            const ifTrue = (stack[--stackSize])
            const condition = (stack[--stackSize]) >= 1;
            value = select(ifTrue, ifFalse, condition)
            break
          }
          case Fn_lerp: {
            const frac = (stack[--stackSize])
            const a = (stack[--stackSize])
            const b = (stack[--stackSize])
            value = (a * frac + b * (1 - frac))
            break
          }
          default: abort(`Invalid Function: ${fnId}`); return 0
        };
        (stack[stackSize++] = (value));
        break
      }
      case Op_GetVar: {
        const varId = <u32>load<f64>((++i) * sizeof<f64>());
        const value = load<f64>(varPtr(bytecodeLength, varId));
        (stack[stackSize++] = (value))
        break
      }
      case Op_SetVar: {
        const varId = <u32>load<f64>((++i) * sizeof<f64>());
        const value = (stack[stackSize-1]) // we don't pop because `x = 1` is an expression that returns 1.
        store<f64>(varPtr(bytecodeLength, varId), value)
        break;
      }
      case Op_GetOut: {
        const outputId = <u32>load<f64>((++i) * sizeof<f64>())
        let value: f64
        switch (outputId) {
          case Out_x: { value = x$; break }
          case Out_y: { value = y$; break }
          case Out_h: { value = h; break }
          case Out_s: { value = s; break }
          case Out_v: { value = v; break }
          default: abort(`Invalid Output: ${outputId}`); return 0 // return otherwise there's a compile error
        };
        (stack[stackSize++] = (value));
        break
      }
      case Op_SetOut: {
        const outputId = <u32>load<f64>((++i) * sizeof<f64>())
        const value = (stack[stackSize-1])
        switch (outputId) {
          case Out_x: { x$ = value; break; }
          case Out_y: { y$ = value; break; }
          case Out_h: { h = value; break; }
          case Out_s: { s = value; break; }
          case Out_v: { v = value; break; }
          default: abort(`Invalid Output: ${outputId}`); return 0 // return otherwise there's a compile error
        }
        break
      }
      case Op_GetIn: {
        const inputId = <u32>load<f64>((++i) * sizeof<f64>())
        let value: f64
        // why'd I format it like this
        switch (inputId) {
          case In_x:                   { value = x;                    break }
          case In_y:                   { value = y;                    break }
          case In_index:               { value = index;                break }
          case In_count:               { value = count;                break }
          case In_fraction:            { value = fraction;             break }
          case In_pi:                  { value = pi;                   break }
          case In_tau:                 { value = tau;                  break }
          case In_time:                { value = time;                 break }
          case In_projectionTime:      { value = projectionTime;       break }
          case In_projectionStartTime: { value = projectionStartTime;  break }
          default: abort(`Invalid Input: ${inputId}`); return 0 // return otherwise there's a compile error
        };
        (stack[stackSize++] = (value))
        break
      }
      case Op_Neg: {
        const value = (stack[--stackSize]);
        (stack[stackSize++] = -value)
        break
      }
      case Op_Not: {
        const value = (stack[--stackSize]);
        (stack[stackSize++] = +!(value > 0))
        break
      }
      case Op_End: {
        store<f64>(0 * sizeof<f64>(), x$);
        store<f64>(1 * sizeof<f64>(), y$);
        store<f64>(2 * sizeof<f64>(), h);
        store<f64>(3 * sizeof<f64>(), s);
        store<f64>(4 * sizeof<f64>(), v);
        return 0
      }
      default: abort(`Invalid Opcode: ${opcode}`); return 0
    }
  }

  abort("loop finished without an end instruction");
  return 0;
}















