import { parse } from './parser.js'

import { id as Input } from './constants/inputs.js'
import { id as Output } from './constants/outputs.js'
import { BytecodeCompiler } from './compiler.js'
import { BytecodeVM } from './vm.js'
import { interpret } from './vm/src/index.js'

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

// the current time in seconds since the beginning of the day
const dayInSeconds = () => ((Date.now() % 86400000) / 1000)

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

  constructor(canvas, compiledData) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d', { alpha: false })
    this.ctx.globalCompositeOperation = "screen";
    this.compiledData = compiledData
  }

  relativeToAbsolutePos(relPos) {
    const widthScale = this.canvas.width / (200 + this.options.padding)
    const heightScale = this.canvas.height / (200 + this.options.padding)
    return {
      x: (relPos.x + (100 + this.options.padding / 2)) * widthScale,
      y: this.canvas.height - (relPos.y + (100 + this.options.padding / 2)) * heightScale
    }
  }

  // todo: there will be bugs with the day changing but not this
  // maybe that's accurate though?
  projectionStartTime = dayInSeconds()
  renderRectangularGrid() {
    const cols = Array.from(interpolate(this.options.gridWidth, -100, 100))
    const rows = Array.from(interpolate(this.options.gridHeight, 100, -100))
    const count = this.options.gridWidth * this.options.gridHeight
    const time = dayInSeconds()

    let index = 0;
    for (const rowPos of rows) {
      for (const colPos of cols) {
        const outputs = interpret(this.bytecode, {
          x: colPos,
          y: rowPos,
          index: index++,
          count: count - 1,
          time: time,
          projectionStartTime: this.projectionStartTime,
        });
        // console.log(outputs)
        this.renderPoint(outputs)
      }
    }
  }

  renderPoint({ h, s, v, x, y }) {
    const hsl = hsv2hsl({ h, s, v: Math.min(v, 1) }) // v might be clamped, check later
    const pos = this.relativeToAbsolutePos({ x, y })

    if (hsl.h < 0) hsl.h -= 120

    this.ctx.fillStyle = `hsl(${hsl.h % 360} ${hsl.s * 100}% ${hsl.l * 100}% / ${v * 100}%)`
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
    // projector.ctx.clearRect(0, 0, projector.canvas.width, projector.canvas.height)
    // projector.renderRectangularGrid()
  } catch (err) {
    projectorInfo.value = `Parsing Error: ${err.toString()}`
    console.error(err)
    parsingError = true;
  }
}

projector.renderRectangularGrid()

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

render()
