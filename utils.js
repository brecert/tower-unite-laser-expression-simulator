export function hsv2hsl(hsv) {
    const h = hsv.h
    const l = hsv.v * (1 - (hsv.s / 2))
    const s = (l == 0 || l == 1) ? 0 : (hsv.v - l) / Math.min(l, 1 - l)
    return { h, s, l }
}

// evenly space interpolations between start and total
export function* interpolate(count, start, total) {
    let spacing = (total - start) / (count - 1)
    for (let i = 0; i < count; i++) {
        yield (spacing * i) + start
    }
}

// the current time in seconds since the beginning of the day
export const dayInSeconds = () => ((Date.now() % 86400000) / 1000)
