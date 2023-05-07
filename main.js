import { parse } from './parser.js'

import { id as Input } from './constants/inputs.js'
import { id as Output } from './constants/outputs.js'
import { BytecodeCompiler } from './compiler.js'
import { BytecodeVM } from './vm.js'

function hsv2hsl(hsv) {
  const h = hsv.h
  const l = hsv.v * (1 - (hsv.s / 2))
  const s = (l == 0 || l == 1) ? 0 : (hsv.v - l) / Math.min(l, 1 - l)
  return { h, s, l }
}

// evenly space interpolations between start and total
function* interpolate(count, start, total) {
  let spacing = (total - start) / (count - 1)
  for (let i = 0; i < count; i++) {
    yield (spacing * i) + start
  }
}

// the current time in seconds
const currentTime = () => (Date.now() / 1000)

// const PointImage = new Image(64, 64)
// PointImage.src = './point.png'
// PointImage.onload = console.log

class Projector {
  options = {
    pointSize: 3,
    gridWidth: 20,
    gridHeight: 20,
    padding: 100,
  }

  constructor(canvas, bytecode) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d', { alpha: false })
    this.ctx.globalCompositeOperation = "screen";
    this.bytecode = bytecode
  }

  relativeToAbsolutePos(relPos) {
    const widthScale = this.canvas.width / (200 + this.options.padding)
    const heightScale = this.canvas.height / (200 + this.options.padding)
    return {
      x: (relPos.x + (100 + this.options.padding / 2)) * widthScale,
      y: this.canvas.height - (relPos.y + (100 + this.options.padding / 2)) * heightScale
    }
  }

  projectionStarted = currentTime()
  renderRectangularGrid() {
    const cols = Array.from(interpolate(this.options.gridWidth, -100, 100))
    const rows = Array.from(interpolate(this.options.gridHeight, -100, 100))
    const count = this.options.gridWidth * this.options.gridHeight

    const inputs = {
      [Input.x]: 0,
      [Input.y]: 0,
      [Input.index]: 0,
      [Input.count]: count,
      [Input.fraction]: 0,
      [Input.pi]: Math.PI,
      [Input.tau]: Math.PI * 2,
      [Input.time]: Date.now() / 1000,
      [Input.projectionTime]: 0,
      [Input.projectionStartTime]: 0,
    }

    const outputs = {
      [Output["x'"]]: 0,
      [Output["y'"]]: 0,
      [Output.h]: 0,
      [Output.s]: 0,
      [Output.v]: 1,
    }

    const vm = new BytecodeVM({ ...inputs }, { ...outputs })

    let index = 0;
    for (const rowPos of rows) {
      for (const colPos of cols) {
        vm.outputs = { ...outputs }
        vm.inputs = {
          ...inputs,
          [Input.x]: colPos,
          [Input.y]: rowPos,
          [Input.index]: index++,
          [Input.fraction]: index / count,
        }

        const output = vm.getOutput(this.bytecode)
        this.renderPoint(output)
      }
    }
  }

  renderPoint({ [Output.h]: h, [Output.s]: s, [Output.v]: v, [Output["x'"]]: x, [Output["y'"]]: y }) {
    const hsl = hsv2hsl({ h, s, v: Math.min(v, 1) }) // v might be clamped, check later
    const pos = this.relativeToAbsolutePos({ x, y })

    if (hsl.h < 0) hsl.h -= 90

    this.ctx.fillStyle = `hsl(${hsl.h % 360} ${hsl.s * 100}% ${hsl.l * 100}% / ${v * 100}%)`
    
    // this.ctx.beginPath();
    // this.ctx.arc(pos.x, pos.y, this.options.pointSize, 0, 2 * Math.PI);
    // this.ctx.fill();
    
    this.ctx.fillRect(pos.x, pos.y, 10, 10)
    
    // this.ctx.save()
    // this.ctx.globalAlpha = v;
    // this.ctx.filter = `sepia(100%) saturate(500%) hue-rotate(-25deg) hue-rotate(${h*100}%) saturate(${s})`;
    // this.ctx.drawImage(PointImage, pos.x, pos.y)
    // this.ctx.restore()
  }
}

const projectorOutput = document.getElementById('projectorOutput')
const projectorInput = document.getElementById('projectorInput')
const projectorInfo = document.getElementById('projectorInfo')

const projector = new Projector(projectorOutput)

function updateBytecode() {
  const ast = parse(projectorInput.value)
  const bytecode = BytecodeCompiler.compile(ast)
  projector.bytecode = bytecode
}
updateBytecode()

let parsingError = false
projectorInput.oninput = () => {
  try {
    updateBytecode()
    parsingError = false;
  } catch (err) {
    projectorInfo.value = `Parsing Error: ${err.toString()}`
    console.error(err)
    parsingError = true;
  }
}

projector.renderRectangularGrid()

function render() {
  console.clear()
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

render()
