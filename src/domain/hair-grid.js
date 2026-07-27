/**
 * Pure Domain Model: HairGrid
 * Encapsulates hair coordinate tracking and radius shaving math.
 * 0% DOM/Canvas dependency.
 */
export class HairGrid {
    /**
     * @param {Array<{r: number, c: number}>} hairPositions - List of hair coordinates
     * @param {number} rows - Grid row count
     * @param {number} cols - Grid column count
     */
    constructor(hairPositions = [], rows = 0, cols = 0) {
        this.rows = rows;
        this.cols = cols;
        this.hairSet = new Set();
        
        hairPositions.forEach(pos => {
            this.hairSet.add(`${pos.r},${pos.c}`);
        });

        this.initialCount = this.hairSet.size;
    }

    /**
     * Check if hair exists at (r, c)
     */
    has(r, c) {
        return this.hairSet.has(`${r},${c}`);
    }

    /**
     * Shave hair at (centerR, centerC) within radius
     * @param {number} centerR 
     * @param {number} centerC 
     * @param {number} radius - e.g. 1 for 3x3, 3 for 7x7, 5 for 11x11, 7 for 15x15
     * @returns {number} Count of hairs removed in this operation
     */
    shave(centerR, centerC, radius = 1) {
        let removed = 0;

        for (let dr = -radius; dr <= radius; dr++) {
            for (let dc = -radius; dc <= radius; dc++) {
                const r = centerR + dr;
                const c = centerC + dc;
                const key = `${r},${c}`;

                if (this.hairSet.has(key)) {
                    this.hairSet.delete(key);
                    removed++;
                }
            }
        }

        return removed;
    }

    get remainingCount() {
        return this.hairSet.size;
    }

    get totalCount() {
        return this.initialCount;
    }

    get removedCount() {
        return this.initialCount - this.hairSet.size;
    }

    get percentageCleared() {
        if (this.initialCount === 0) return 100;
        return Math.round((this.removedCount / this.initialCount) * 100);
    }
}
