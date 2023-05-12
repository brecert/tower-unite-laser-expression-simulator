import { dayInSeconds, hsv2hsl, interpolate, regularPolygonPoints } from "./utils.js";
import { interpret } from './vm/src/index.js'

const
  RectangularGrid = 0,
  LineShape = 1,
  PlusShape = 2


export class Projector {
  compiledData = null
  options = {
    pointSize: 10,
    padding: 100,
    // official
    sizeX: 20,
    sizeY: 20,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    laserCoordinates: RectangularGrid
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
      x: ((relPos.x * this.options.scaleX) + (100 + this.options.padding / 2)) * widthScale,
      y: this.canvas.height - ((relPos.y * this.options.scaleY) + (100 + this.options.padding / 2)) * heightScale
    }
  }

  render() {
    this.renderPoints(this.points())
  }

  points() {
    switch (this.options.laserCoordinates) {
      case RectangularGrid: return Array.from(this.rectangularGridPoints())
      case LineShape: return Array.from(this.linePoints())
      case PlusShape: return Array.from(this.plusPoints())
      default:
        throw new Error(`Invalid Laser Coordinates: ${this.options.laserCoordinates}`)
    }
  }

  *plusPoints() {
    for (const x of interpolate(16, -100, 100)) {
      yield { x, y: 0 }
    }
    for (const y of interpolate(16, -100, 100)) {
      yield { x: 0, y }
    }
  }

  *linePoints() {
    for (const x of interpolate(32, -100, 100)) {
      yield { x, y: 100 }
    }
  }

  *rectangularGridPoints() {
    const cols = Array.from(interpolate(this.options.sizeX, -100, 100))
    const rows = Array.from(interpolate(this.options.sizeY, 100, -100))

    for (const y of rows) {
      for (const x of cols) {
        yield { x, y }
      }
    }
  }

  // todo: there will be bugs with the day changing but not this
  // maybe that's accurate though?
  projectionStartTime = dayInSeconds()
  renderPoints(points) {
    const count = points.length - 1
    const time = dayInSeconds()

    this.ctx.save()

    if (this.options.rotation !== 0 && this.options.rotation !== 1) {
      const halfWidth = this.canvas.width / 2
      const halfHeight = this.canvas.height / 2
      this.ctx.translate(halfWidth, halfHeight)
      this.ctx.rotate(this.options.rotation * Math.PI * 2)
      this.ctx.translate(-halfWidth, -halfHeight)
    }

    points.forEach(({ x, y }, index) => {
      const outputs = interpret(this.bytecode, {
        x, y,
        index,
        count,
        time,
        projectionStartTime: this.projectionStartTime,
      });
      this.renderPoint(outputs)
    })

    this.ctx.restore()
  }

  renderPoint({ h, s, v, x, y }) {
    const hsl = hsv2hsl({ h, s, v: Math.min(v, 1) }) // v might be clamped, check later
    const pos = this.relativeToAbsolutePos({ x, y })

    if (hsl.h < 0) hsl.h -= 120

    this.ctx.fillStyle = `hsl(${hsl.h % 360} ${hsl.s * 100}% ${hsl.l * 100}% / ${v * 100}%)`
    this.ctx.fillRect(pos.x - this.options.pointSize / 2, pos.y - this.options.pointSize / 2, this.options.pointSize, this.options.pointSize)

    // this.ctx.save()
    // this.ctx.globalAlpha = v;
    // this.ctx.filter = `sepia(100%) saturate(500%) hue-rotate(-25deg) hue-rotate(${h*100}%) saturate(${s})`;
    // this.ctx.drawImage(PointImage, pos.x, pos.y)
    // this.ctx.restore()
  }
}