import * as vm from '../build/release.js'

const AVAILABLE_MEMORY = 128000;
const mem = new Float64Array(vm.memory.buffer)

export function interpret(bytecode, inputs) {
    if(bytecode.byteLength > AVAILABLE_MEMORY) throw new Error(`Out of Memory: ${bytecode.byteLength} > ${AVAILABLE_MEMORY}`)
    mem.set(bytecode)
    const ptr = vm.interpret(
        inputs.x, inputs.y,
        inputs.index, inputs.count,
        inputs.time, inputs.projectionStartTime,
        bytecode.length
    )
    const [x, y, h, s, v] = mem.slice(ptr, ptr + 5)
    return { x, y, h, s, v }
}