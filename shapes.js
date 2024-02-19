import { interpolate } from "./utils.js"

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

/**
 * @param {number} cols 
 * @param {number} rows 
 */
export const rectangularGridPoints = (cols, rows) =>
    pointDataFrom(genRectangularGridPoints(cols, rows))