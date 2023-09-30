import * as twgl from 'https://esm.sh/v132/twgl.js@5.5.3/es2022/twgl.mjs'
import { dayInSeconds } from './utils.js';
import { GLSLCompiler } from './glsl_compiler.js';
import { parse } from './parser.js';

import {
    rectangularGridPoints,
    linePoints,
    plusPoints,
    circlePoints,
    squarePoints,
} from './shapes.js';

export const
    RectangularGrid = 0,
    LineShape = 1,
    PlusShape = 2,
    CircleShape = 3,
    SquareShape = 4

function getPointDataForShape(shape, cols, rows) {
    switch (shape) {
        case RectangularGrid: return rectangularGridPoints(cols, rows)
        case LineShape: return linePoints()
        case PlusShape: return plusPoints()
        case CircleShape: return circlePoints()
        case SquareShape: return squarePoints()
        default:
            throw new Error(`Invalid Laser Coordinates: ${shape}`)
    }
}

export class WebGLProjector {
    #programDraw
    #projectionStartTime
    #pointData
    #pointsBuffer
    #vertexArrayInfo
    #transformFeedback
    #vertexArrayInfo2
    #transformFeedback2
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
    constructor(canvas) {
        let gl = canvas.getContext('webgl2', { depth: false, antialiasing: false, alpha: false });
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
        this.#pointData = pointData
        this.updateInfo()
    }

    updateProgram({ vertex, fragment }) {
        this.#programDraw = twgl.createProgramInfo(this.gl, [vertex, fragment], {
            transformFeedbackVaryings: ["colorOut", "coordOut"],
        });
        if (this.#programDraw == null) {
            throw new Error(`Error Compiling Shaders`)
        }
        this.updateInfo()
    }

    updateInfo() {
        const gl = this.gl;
        if (this.#programDraw != null && this.#pointData != null) {
            let pointData = this.#pointData
            let pointCount = pointData.length / 2

            const pointsObject = {
                index: { numComponents: 1, data: new Float32Array(pointCount).map((_, i) => i) },
                coord: { numComponents: 2, data: pointData },
                coordIn: { numComponents: 2, data: pointCount * 2 },
                coordOut: { numComponents: 2, data: pointCount * 2 },
                colorIn: { numComponents: 3, data: pointCount * 3 },
                colorOut: { numComponents: 3, data: pointCount * 3 },
            };
            this.#pointsBuffer = twgl.createBufferInfoFromArrays(gl, pointsObject);

            this.#vertexArrayInfo = twgl.createVertexArrayInfo(gl, this.#programDraw, this.#pointsBuffer)
            this.#transformFeedback = twgl.createTransformFeedback(gl, this.#programDraw, this.#pointsBuffer)
            this.#projectionStartTime = dayInSeconds()

            const attribs = this.#pointsBuffer.attribs;
            const pointsBuffer2 = twgl.createBufferInfoFromArrays(gl, {
                index: { numComponents: 1, buffer: attribs.index.buffer },
                coord: { numComponents: 2, buffer: attribs.coord.buffer },
                coordIn: { numComponents: 2, buffer: attribs.coordOut.buffer },
                coordOut: { numComponents: 2, buffer: attribs.coordIn.buffer },
                colorIn: { numComponents: 3, buffer: attribs.colorOut.buffer },
                colorOut: { numComponents: 3, buffer: attribs.colorIn.buffer },
            })
            this.#vertexArrayInfo2 = twgl.createVertexArrayInfo(gl, this.#programDraw, pointsBuffer2)
            this.#transformFeedback2 = twgl.createTransformFeedback(gl, this.#programDraw, pointsBuffer2)
        }
        this.reset()
    }

    getUniforms(delta) {
        return {
            time: dayInSeconds(),
            count: this.#pointData.length / 2,
            projectionStartTime: this.#projectionStartTime,
            random: Math.random(),
            scale: [this.scaleX, this.scaleY],
            rotation: this.rotation,
            delta
        }
    }

    #shouldReset = true;
    reset() {
        this.#shouldReset = true;
    }

    #idx = 0;
    #lastTime = 0;
    render(time = 0) {
        time *= 0.001
        let delta = time - this.#lastTime
        this.#lastTime = time;

        const gl = this.gl;
        const programDraw = this.#programDraw;

        if (!this.#shouldReset) this.#idx = 1 - this.#idx;
        const vertexArray = this.#idx === 0 ? this.#vertexArrayInfo : this.#vertexArrayInfo2;
        const transform = this.#idx === 0 ? this.#transformFeedback : this.#transformFeedback2;

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.useProgram(programDraw.program);
        twgl.setBuffersAndAttributes(gl, programDraw, vertexArray);

        if (!this.#shouldReset) {
            gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transform)
            gl.beginTransformFeedback(gl.POINTS)
        }
        twgl.setUniforms(programDraw, this.getUniforms(delta));
        twgl.drawBufferInfo(gl, vertexArray, gl.POINTS);
        if (!this.#shouldReset) {
            gl.endTransformFeedback()
            gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
        }

        this.#shouldReset = false
    }
}

