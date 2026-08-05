/**
 * Pure Domain Value Object: GridGeometry
 * Encapsulates grid dimensions, cell sizes, bounds checking, and normalized client-to-grid coordinate mapping.
 * 0% DOM/Canvas dependency. Immutable.
 */
export class GridGeometry {
    constructor(cols = 280, rows = 219, cellWidth = 6, cellHeight = 6) {
        this.cols = Math.max(1, cols);
        this.rows = Math.max(1, rows);
        this.cellWidth = Math.max(1, cellWidth);
        this.cellHeight = Math.max(1, cellHeight);
        Object.freeze(this);
    }

    get width() {
        return this.cols * this.cellWidth;
    }

    get height() {
        return this.rows * this.cellHeight;
    }

    contains(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }

    /**
     * Map viewport client pixel coordinates (x, y) with client rect dimensions to grid (row, col)
     * Normalized relative ratio prevents High-DPI / DPR coordinate scaling bugs.
     */
    clientToGrid(clientX, clientY, clientRect) {
        if (!clientRect || clientRect.width <= 0 || clientRect.height <= 0) {
            return { row: -1, col: -1 };
        }
        const relX = clientX - clientRect.left;
        const relY = clientY - clientRect.top;

        const normX = relX / clientRect.width;
        const normY = relY / clientRect.height;

        const col = Math.floor(normX * this.cols);
        const row = Math.floor(normY * this.rows);

        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
            return { row: -1, col: -1 };
        }
        return { row, col };
    }
}
