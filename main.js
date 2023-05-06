import { Interpreter } from './interpreter.js'
import { parse } from './parser.js'

function hsv2hsl(hsv) {
  const h = hsv.h
  const l = hsv.v * (1 - (hsv.s / 2))
  const s = (l == 0 || l == 1) ? 0 : (hsv.v - l) / Math.min(l, 1 - l)
  return { h, s, l }
}

function lerp(v0, v1, t) {
  return (1 - t) * v0 + t * v1;
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

const point = (x, y, h, s, v) => ({ x, y, h, s, v })

class Projector {
  laserExpression = parse(projectorInput.value)

  options = {
    pointSize: 3,
    gridWidth: 20,
    gridHeight: 20,
    padding: 100,
  }

  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d', { alpha: false })
    this.ctx.globalCompositeOperation = "screen";
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
    const constInputs = {
      pi: Math.PI,
      tau: Math.PI * 2,
      time: currentTime(),
      projectionTime: currentTime() - this.projectionStarted,
      // don't know the difference yet
      projectionStartTime: currentTime() - this.projectionStarted
    }
    const cols = Array.from(interpolate(this.options.gridWidth, -100, 100))
    const rows = Array.from(interpolate(this.options.gridHeight, -100, 100))
    const count = this.options.gridWidth * this.options.gridHeight

    let index = 0;
    for (const rowPos of rows) {
      for (const colPos of cols) {
        const inputs = {
          x: colPos,
          y: rowPos,
          index: index++,
          count: count,
          fraction: index / count,
          ...constInputs,
        }
        const output = Interpreter.interpret(this.laserExpression, inputs)
        this.renderPoint(output)
      }
    }
  }

  renderPoint({ h, s, v, x, y }) {
    const hsl = hsv2hsl({ h, s, v })
    const pos = this.relativeToAbsolutePos({ x, y })

    if (hsl.h < 0) hsl.h -= 90

    // this.ctx.beginPath();
    this.ctx.fillStyle = `hsl(${hsl.h % 360} ${hsl.s * 100}% ${hsl.l * 100}% / ${v * 100}%)`
    // this.ctx.arc(pos.x, pos.y, this.options.pointSize, 0, 2 * Math.PI);
    // this.ctx.fill();
    this.ctx.fillRect(pos.x, pos.y, 10, 10)
  }
}

const projectorOutput = document.getElementById('projectorOutput')
const projectorInput = document.getElementById('projectorInput')
const projectorInfo = document.getElementById('projectorInfo')


const projector = new Projector(projectorOutput)

let parsingError = false
projectorInput.oninput = () => {
  try {
    projector.laserExpression = parse(projectorInput.value)
    parsingError = false;
  } catch (err) {
    projectorInfo.value = `Parsing Error: ${err.toString()}`
    console.error(err)
    parsingError = true;
  }
}

// console.time('render')
projector.renderRectangularGrid()
// console.timeEnd('render')
const render = () => {
  if (!parsingError) {
    projector.ctx.clearRect(0, 0, projector.canvas.width, projector.canvas.height);
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
