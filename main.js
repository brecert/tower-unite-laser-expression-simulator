import { parse } from './parser.js'
import { RectangularGrid, WebGLProjector } from './gl_projector.js'
import { GLSLCompiler } from './glsl_compiler.js'

const $ = (query) => document.querySelector(query)

const withInput = (id, cb) => {
  const el = document.getElementById(id)
  if (el) {
    el.oninput = (e) => cb(el)
    cb(el)
  }
}


const $display = $('#projectorDisplay')
const $input = $('#projectorInput')
const $logs = $('#projectorLogs')

// this is bad but I was curious how it'd work out
class State {
  #running = true
  #runtimeError = null

  projector = new WebGLProjector($display, $input.value, RectangularGrid)

  set running(value) {
    let startRunning = this.#running === false && value === true
    this.#running = value
    if (startRunning) {
      this.runCycle()
    }
  }

  set runtimeError(error) {
    if (error != null) {
      console.error(error)
      $logs.value = error.toString()
    } else {
      $logs.value = ""
    }
    this.#runtimeError = error
  }

  constructor() {
    $input.oninput = () => this.handleError(() => this.updateProgram())
    this.handleError(() => this.updateProgram())
    this.runCycle()
  }

  handleError(fn) {
    try { fn() }
    catch (err) {
      this.runtimeError = err
    }
  }

  updateProgram() {
    this.projector.useProgram($input.value)
    this.runtimeError = null
  }

  runCycle() {
    if (this.#running && this.#runtimeError == null) {
      this.handleError(() => this.projector.render())
    }
    if (this.#running) requestAnimationFrame(() => this.runCycle())
  }
}

const state = new State()

// Object.keys(state.projector.options)
//   .map(name => withInput(name, el => state.projector.options[name] = el.valueAsNumber))

withInput('run', (el) => state.running = el.checked)

const $laserCoordinates = $('#laserCoordinates')
const $gridSize = $('#gridSize')
const $sizeX = $('#sizeX')
const $sizeY = $('#sizeY')
const updateShape = () => {
  state.projector.useShape($laserCoordinates.selectedIndex, $sizeX.valueAsNumber, $sizeY.valueAsNumber)
  $gridSize.hidden = $laserCoordinates.selectedIndex !== 0

}

withInput('laserCoordinates', updateShape)
withInput('sizeX', updateShape)
withInput('sizeY', updateShape)

withInput('rotation', (el) => state.projector.rotation = el.valueAsNumber * 360)
withInput('scaleX', (el) => state.projector.scaleX = el.valueAsNumber)
withInput('scaleY', (el) => state.projector.scaleY = el.valueAsNumber)

window.onblur = () => state.running = false
window.onfocus = () => state.running = run.checked