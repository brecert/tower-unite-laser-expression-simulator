import { interpolate } from "./utils.js"

/**
 * Generate points of a regular n-gon.
 * @param {number} n the number of sides the n-gon has
 */
export function* genRegularPolygonPoints(n, r) {
    const rad = (360 / n) * (Math.PI / 180);
    for (let i = 0; i < n; i++) {
        const x = r * Math.sin(rad * i)
        const y = r * Math.cos(rad * i)
        yield { x, y }
    }
}

export function* genSquarePoints() {
    const pointsForward = Array.from(interpolate(9, -100, 100))
    const pointsBackward = Array.from(interpolate(9, 100, -100))

    pointsForward.pop()
    pointsBackward.pop()

    // top (>)
    for (const x of pointsForward) {
        yield { x, y: 100 }
    }

    // right (v)
    for (const y of pointsBackward) {
        yield { x: 100, y }
    }

    // bottom (<)
    for (const x of pointsBackward) {
        yield { x, y: -100 }
    }

    // left (^)
    for (const y of pointsForward) {
        yield { x: -100, y }
    }
}

export function* genCirclePoints() {
    yield* genRegularPolygonPoints(32, 100)
}

export function* genPlusPoints() {
    for (const x of interpolate(16, -100, 100)) {
        yield { x, y: 0 }
    }
    for (const y of interpolate(16, -100, 100)) {
        yield { x: 0, y }
    }
}

export function* genLinePoints() {
    for (const x of interpolate(32, -100, 100)) {
        yield { x, y: 100 }
    }
}

export function* genRectangularGridPoints(colSize, rowSize) {
    const cols = Array.from(interpolate(colSize, -100, 100))
    const rows = Array.from(interpolate(rowSize, 100, -100))

    for (const y of rows) {
        for (const x of cols) {
            yield { x, y }
        }
    }
}

// PointData

/** @param {Generator<{x:number, y:number}>} generator  */
export function* genPointData(generator) {
    let i = 0
    for (let { x, y } of generator) {
        yield x
        yield y
        yield i++
    }
}

/** @param {Generator<{x:number, y:number}>} generator  */
export const pointDataFrom = (generator) => Float32Array.from(genPointData(generator))

// PointData Outputs

export const squarePoints = () =>
    pointDataFrom(genSquarePoints())

export const circlePoints = () =>
    pointDataFrom(genCirclePoints())

export const plusPoints = () =>
    pointDataFrom(genPlusPoints())

export const linePoints = () =>
    pointDataFrom(genLinePoints())

/**
 * @param {number} cols 
 * @param {number} rows 
 */
export const rectangularGridPoints = (cols, rows) =>
    pointDataFrom(genRectangularGridPoints(cols, rows))