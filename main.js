import { WebGLProjector } from './webgl_projector.js'
import shapes from './constants/shapes.js'

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
const $icon = $('link[rel="icon"]')

for (const [name] of shapes) {
  const $option = document.createElement('option')
  $option.textContent = name
  $laserCoordinates.append($option)
}

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

    if (this.#running) {
      $icon.href = $icon.href.replace('%23333', '%23EB3D1C')
    } else {
      $icon.href = $icon.href.replace('%23EB3D1C', '%23333')
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

  updateShape(type, cols, rows) {
    this.projector.useShape($laserCoordinates.selectedIndex, $sizeX.valueAsNumber, $sizeY.valueAsNumber)
    $gridSize.hidden = $laserCoordinates.selectedIndex !== 0
  }

  runCycle() {
    if (this.#running && this.#runtimeError == null) {
      this.handleError(() => this.projector.render())
    }
    if (this.#running) requestAnimationFrame(() => this.runCycle())
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

const $outputActions = $('#outputActions')
const inputs = [$('#rotation'), $('#scaleX'), $('#scaleY')]

for (const input of inputs) {
  input.parentElement.onclick = (e) => {
    if (e.target === input.parentElement) input.type = 'number'
  }
  input.onblur = () => input.type = 'range'
}

$outputActions.addEventListener('submit', e => {
  e.preventDefault()
  inputs.forEach(input => input.type = 'range')
})


window.onblur = () => state.running = false
window.onfocus = () => state.running = run.checked