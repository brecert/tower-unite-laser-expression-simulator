import { dayInSeconds, hsv2hsl, interpolate } from "./utils.js";
import { interpret } from './vm/src/index.js'

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
      rotation: 0
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
  
    // todo: there will be bugs with the day changing but not this
    // maybe that's accurate though?
    projectionStartTime = dayInSeconds()
    renderRectangularGrid() {
      const cols = Array.from(interpolate(this.options.sizeX, -100, 100))
      const rows = Array.from(interpolate(this.options.sizeY, 100, -100))
      const count = this.options.sizeX * this.options.sizeY
      const time = dayInSeconds()
  
      this.ctx.save()
      if(this.options.rotation !== 0 && this.options.rotation !== 1) {
        const halfWidth = this.canvas.width / 2
        const halfHeight = this.canvas.height / 2
        this.ctx.translate(halfWidth, halfHeight)
        this.ctx.rotate(this.options.rotation*Math.PI*2)
        this.ctx.translate(-halfWidth, -halfHeight)
      }
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
          this.renderPoint(outputs)
        }
      }
      this.ctx.restore()
    }
  
    renderPoint({ h, s, v, x, y }) {
      const hsl = hsv2hsl({ h, s, v: Math.min(v, 1) }) // v might be clamped, check later
      const pos = this.relativeToAbsolutePos({ x, y })
  
      if (hsl.h < 0) hsl.h -= 120
  
      this.ctx.fillStyle = `hsl(${hsl.h % 360} ${hsl.s * 100}% ${hsl.l * 100}% / ${v * 100}%)`
      this.ctx.fillRect(pos.x-this.options.pointSize/2, pos.y-this.options.pointSize/2, this.options.pointSize, this.options.pointSize)
  
      // this.ctx.save()
      // this.ctx.globalAlpha = v;
      // this.ctx.filter = `sepia(100%) saturate(500%) hue-rotate(-25deg) hue-rotate(${h*100}%) saturate(${s})`;
      // this.ctx.drawImage(PointImage, pos.x, pos.y)
      // this.ctx.restore()
    }
  }