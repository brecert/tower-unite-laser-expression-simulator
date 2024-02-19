import * as twgl from 'https://esm.sh/v132/twgl.js@5.5.3/es2022/twgl.mjs'
import { dayInSeconds } from './utils.js';
import { GLSLCompiler } from './glsl_compiler.js';
import { parse } from './parser.js';
import { rectangularGridPoints } from './shapes.js';
import shapes from './constants/shapes.js'

export const RectangularGrid = 0

function getPointDataForShape(shape, cols, rows) {
    switch (shape) {
        case RectangularGrid: return rectangularGridPoints(cols, rows)
        default: return new Float32Array(shapes[shape - 1][1])
    }
}

export class WebGLProjector {
    #programDraw
    #pointCount
    #pointsBuffer
    #projectionStartTime
    /** @type {WebGL2RenderingContext} */
    gl
    scaleX = 1;
    scaleY = 1;
    rotation = 0;

    /**
     * @param {HTMLCanvasElement} canvas
     * @param {string} script
     * @param {number} shape
     */
    constructor(canvas, script, shape = RectangularGrid, cols = 20, rows = 20) {
        let gl = canvas.getContext('webgl2', { depth: false, antialiasing: false, alpha: false });
        if (gl == null) {
            throw new Error("Unable to initialize WebGL. Your browser or machine may not support it.")
        }
        this.gl = gl
        this.gl.enable(gl.BLEND);
        this.gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_COLOR);
    }

    /**
     * @param {number} shape 
     * @param {number} cols
     * @param {number} rows 
     */
    useShape(shape, cols, rows) {
        this.updateShape(getPointDataForShape(shape, cols, rows))
    }

    useProgram(script) {
        const ast = parse(script)
        const program = GLSLCompiler.compile(ast)
        this.updateProgram(program)
    }

    /** @param {Float32Array} pointData  */
    updateShape(pointData) {
        const gl = this.gl
        const pointsObject = { coordIndex: { data: pointData, numComponents: 3 } };
        this.#pointCount = pointData.length / 3
        this.#pointsBuffer = twgl.createBufferInfoFromArrays(gl, pointsObject);
        this.#projectionStartTime = dayInSeconds()
    }

    updateProgram({ vertex, fragment }) {
        this.#programDraw = twgl.createProgramInfo(this.gl, [vertex, fragment]);
        if (this.#programDraw == null) {
            throw new Error(`Error Compiling Shaders`)
        }
        this.#projectionStartTime = dayInSeconds()
    }

    getUniforms() {
        return {
            time: dayInSeconds(),
            count: this.#pointCount,
            projectionStartTime: this.#projectionStartTime,
            random: Math.random(),
            transform: [this.scaleX, this.scaleY, this.rotation]
        }
    }

    render() {
        const gl = this.gl;
        const programDraw = this.#programDraw;
        const pointsBuffer = this.#pointsBuffer

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);


        gl.useProgram(programDraw.program);
        twgl.setBuffersAndAttributes(gl, programDraw, pointsBuffer);
        twgl.setUniforms(programDraw, this.getUniforms());
        twgl.drawBufferInfo(gl, pointsBuffer, gl.POINTS);
    }
}

