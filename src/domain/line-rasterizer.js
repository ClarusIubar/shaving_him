/**
 * Pure Domain Utility: LineRasterizer
 * Implements Bresenham's line algorithm for discrete 2D grid line interpolation.
 * 0% DOM/Canvas dependency.
 */

/**
 * Interpolate discrete integer grid points along a line from (r0, c0) to (r1, c1) inclusive.
 * @param {number} r0 - Start row
 * @param {number} c0 - Start column
 * @param {number} r1 - End row
 * @param {number} c1 - End column
 * @param {Function} [onPoint] - Optional callback invoked for each (row, col)
 * @returns {Array<{ r: number, c: number }>} Array of interpolated points
 */
export function rasterizeLine(r0, c0, r1, c1, onPoint = null) {
    if (!Number.isFinite(r0) || !Number.isFinite(c0) || !Number.isFinite(r1) || !Number.isFinite(c1)) {
        throw new TypeError('Coordinates must be finite numbers');
    }

    let currR = Math.round(r0);
    let currC = Math.round(c0);
    const targetR = Math.round(r1);
    const targetC = Math.round(c1);

    const dr = Math.abs(targetR - currR);
    const dc = Math.abs(targetC - currC);
    const sr = currR < targetR ? 1 : -1;
    const sc = currC < targetC ? 1 : -1;
    let err = (dc > dr ? dc : -dr) / 2;

    const points = [];

    while (true) {
        if (typeof onPoint === 'function') {
            onPoint(currR, currC);
        } else {
            points.push({ r: currR, c: currC });
        }

        if (currR === targetR && currC === targetC) break;
        const e2 = err;
        if (e2 > -dc) {
            err -= dr;
            currC += sc;
        }
        if (e2 < dr) {
            err += dc;
            currR += sr;
        }
    }

    return points;
}
