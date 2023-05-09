import { dayInSeconds, hsv2hsl, interpolate } from "./utils.js";
import { interpret } from './vm/src/index.js'

export class Projector {
    compiledData = null
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