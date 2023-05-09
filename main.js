import { parse } from './parser.js'
import { BytecodeCompiler } from './compiler.js'
import { Projector } from './projector.js'

const projectorOutput = document.getElementById('projectorOutput')
const projectorInput = document.getElementById('projectorInput')
const projectorInfo = document.getElementById('projectorInfo')
const projector = new Projector(projectorOutput)

function updateBytecode() {
  const ast = parse(projectorInput.value)
  const bytecode = BytecodeCompiler.compile(ast)
  projector.bytecode = bytecode
}

let parsingError = false
projectorInput.oninput = () => {
  try {
    updateBytecode()
    parsingError = false;
    // projector.ctx.clearRect(0, 0, projector.canvas.width, projector.canvas.height)
    // projector.renderRectangularGrid()
  } catch (err) {
    projectorInfo.value = `Parsing Error: ${err.toString()}`
    console.error(err)
    parsingError = true;
  }
}


function render() {
  // console.clear()
  if (!parsingError) {
    projector.ctx.clearRect(0, 0, projector.canvas.width, projector.canvas.height)
    try {
      projector.renderRectangularGrid()
      projectorInfo.value = ""
    } catch (err) {
      projectorInfo.value = err.toString()
      console.error(err)
    }
  }
  requestAnimationFrame(render)
}

updateBytecode()
// projector.renderRectangularGrid()
render()
