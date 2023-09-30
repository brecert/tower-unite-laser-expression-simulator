import { WebGLProjector } from './webgl_projector.js'

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

const $laserCoordinates = $('#laserCoordinates')
const $gridSize = $('#gridSize')
const $sizeX = $('#sizeX')
const $sizeY = $('#sizeY')


// this is bad but I was curious how it'd work out
class State {
  #running = true
  #runtimeError = null
  projector

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
    this.handleError(() => this.projector = new WebGLProjector($display, $input.value))
    $input.oninput = () => this.handleError(() => this.updateProgram())
    this.handleError(() => this.updateProgram())
    this.handleError(() => this.updateShape())
    this.runCycle()
  }

  handleError(fn) {
    try { return fn() }
    catch (err) {
      this.runtimeError = err
    }
  }

  updateProgram() {
    this.projector.useProgram($input.value)
    this.runtimeError = null
  }

  updateShape() {
    this.projector.useShape($laserCoordinates.selectedIndex, $sizeX.valueAsNumber, $sizeY.valueAsNumber)
    $gridSize.hidden = $laserCoordinates.selectedIndex !== 0
  }

  runCycle(delta) {
    if (this.#running && this.#runtimeError == null) {
      this.handleError(() => this.projector.render(delta))
    }
    if (this.#running) requestAnimationFrame((delta) => this.runCycle(delta))
  }
}

const state = new State()

withInput('run', (el) => state.running = el.checked)

withInput('laserCoordinates', () => state.updateShape())
withInput('sizeX', () => state.updateShape())
withInput('sizeY', () => state.updateShape())

withInput('rotation', (el) => state.projector.rotation = el.valueAsNumber * 360)
withInput('scaleX', (el) => state.projector.scaleX = el.valueAsNumber)
withInput('scaleY', (el) => state.projector.scaleY = el.valueAsNumber)

window.onblur = () => state.running = false
window.onfocus = () => state.running = run.checked