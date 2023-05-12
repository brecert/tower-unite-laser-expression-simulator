import { parse } from './parser.js'
import { BytecodeCompiler } from './compiler.js'
import { Projector } from './projector.js'

const $ = (query) => document.querySelector(query)

const withInput = (id, cb) => {
  const el = document.getElementById(id)
  if(el) {
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
  
  projector = new Projector($display)

  set running(value) {
    let startRunning = this.#running === false && value === true
    this.#running = value
    if(startRunning) {
      this.runCycle()
    }
  }

  set runtimeError(error) {
    if(error != null) {
      $logs.value = error.toString()
    } else {
      $logs.value = ""
    }
    this.#runtimeError = error
  }

  constructor() {
    $input.oninput = () => this.handleError(() => this.updateBytecode())
    this.handleError(() => this.updateBytecode())
    this.runCycle()
  }

  handleError(cb) {
    try { cb() }
    catch(err) {
      this.runtimeError = err
    }
  }

  updateBytecode() {
    const ast = parse($input.value)
    const bytecode = BytecodeCompiler.compile(ast)
    this.projector.bytecode = bytecode
    
    this.runtimeError = null
  }

  runCycle() {
    // console.log('cycle', this.#running, this.#runtimeError)
    if(this.#running && this.#runtimeError == null) {
      this.projector.ctx.clearRect(0, 0, this.projector.canvas.width, this.projector.canvas.height)
      
      this.handleError(() => {
        this.projector.render();
      })
    }
    if(this.#running) requestAnimationFrame(() => this.runCycle())
  }
}

const state = new State()

Object.keys(state.projector.options)
  .map(name => withInput(name, el => state.projector.options[name] = el.valueAsNumber))

withInput('run', (el) => state.running = el.checked)

// do not do this
withInput('laserCoordinates', (el) => state.projector.options.laserCoordinates = el.selectedIndex)