/**
 * Pure Domain Model: HairGrid
 * Represents character canvas hair cell matrix.
 * Optimized with 1D Uint8Array for 0B memory allocation and O(1) performance.
 */
export class HairGrid {
    constructor(rows = 219, cols = 280, hairPositions = []) {
        this.rows = rows;
        this.cols = cols;
        this.data = new Uint8Array(rows * cols);
        this.totalHairCount = 0;
        this.remainingHairs = 0;

        this.initHairs(hairPositions);
    }

    initHairs(hairPositions) {
        this.data.fill(0);
        let count = 0;
        for (let i = 0; i < hairPositions.length; i++) {
            const p = hairPositions[i];
            if (p.r >= 0 && p.r < this.rows && p.c >= 0 && p.c < this.cols) {
                const idx = p.r * this.cols + p.c;
                if (this.data[idx] === 0) {
                    this.data[idx] = 1;
                    count++;
                }
            }
        }
        this.totalHairCount = count;
        this.remainingHairs = count;
    }

    has(r, c) {
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return false;
        return this.data[r * this.cols + c] === 1;
    }

    /**
     * Shave hair within radius around (r, c)
     * @param {number} r 
     * @param {number} c 
     * @param {number} radius 
     * @returns {{ count: number, dirtyCells: Array<{r: number, c: number}> }}
     */
    shave(r, c, radius = 1) {
        let count = 0;
        const dirtyCells = [];

        const startR = Math.max(0, r - radius);
        const endR = Math.min(this.rows - 1, r + radius);
        const startC = Math.max(0, c - radius);
        const endC = Math.min(this.cols - 1, c + radius);

        for (let row = startR; row <= endR; row++) {
            const rowOffset = row * this.cols;
            for (let col = startC; col <= endC; col++) {
                const idx = rowOffset + col;
                if (this.data[idx] === 1) {
                    this.data[idx] = 0;
                    count++;
                    dirtyCells.push({ r: row, c: col });
                }
            }
        }

        this.remainingHairs -= count;
        return { count, dirtyCells };
    }

    getRemainingCount() {
        return this.remainingHairs;
    }

    getClearedPercentage() {
        if (this.totalHairCount === 0) return 100;
        const cleared = this.totalHairCount - this.remainingHairs;
        return Math.min(100, Math.max(0, Math.round((cleared / this.totalHairCount) * 100)));
    }
}
