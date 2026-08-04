/**
 * Interface Layer: CanvasRenderer
 * High-performance ASCII grid drawing with Dirty Region partial redraw and rAF batching.
 */
export class CanvasRenderer {
    constructor(canvasElement, cols = 280, rows = 219, fontW = 6, fontH = 6) {
        this.canvas = canvasElement;
        this.cols = cols;
        this.rows = rows;
        this.fontW = fontW;
        this.fontH = fontH;

        this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;

        this.setupCanvas();
        this.rafId = null;
        this.pendingDirtyCells = [];
        this.currentStageData = null;
        this.currentHairGrid = null;
    }

    setupCanvas() {
        if (!this.canvas) return;
        const displayW = this.cols * this.fontW;
        const displayH = this.rows * this.fontH;

        this.canvas.width = Math.round(displayW * this.dpr);
        this.canvas.height = Math.round(displayH * this.dpr);
        this.canvas.style.width = `${displayW}px`;
        this.canvas.style.height = `${displayH}px`;

        this.ctx = this.canvas.getContext('2d', { alpha: false });
        if (this.ctx) {
            this.ctx.scale(this.dpr, this.dpr);
            this.ctx.font = '900 6px "Courier New", monospace';
            this.ctx.textBaseline = 'top';
        }
    }

    /**
     * Batch dirty cells and schedule 60FPS rAF render
     */
    requestRender(stageData, hairGrid, dirtyCells = null) {
        this.currentStageData = stageData;
        this.currentHairGrid = hairGrid;

        if (stageData && (this.cols !== stageData.cols || this.rows !== stageData.rows)) {
            this.cols = stageData.cols;
            this.rows = stageData.rows;
            this.setupCanvas();
        }

        if (dirtyCells && dirtyCells.length > 0) {
            this.pendingDirtyCells.push(...dirtyCells);
        } else {
            this.pendingDirtyCells = null; // Forces full redraw
        }

        if (!this.rafId) {
            this.rafId = requestAnimationFrame(() => {
                this.rafId = null;
                const dirty = this.pendingDirtyCells;
                this.pendingDirtyCells = [];
                this.render(this.currentStageData, this.currentHairGrid, dirty);
            });
        }
    }

    /**
     * Render stage and hair grid (full or dirty partial)
     */
    render(stageData, hairGrid, dirtyCells = null) {
        if (!stageData || !this.ctx) return;

        if (stageData.cols !== this.cols || stageData.rows !== this.rows) {
            this.cols = stageData.cols;
            this.rows = stageData.rows;
            this.setupCanvas();
        }

        const { textGrid, colorGrid } = stageData;

        // Mode A: Partial Dirty Cell Redraw (Ultra Fast < 1ms)
        if (dirtyCells && Array.isArray(dirtyCells) && dirtyCells.length > 0) {
            for (let i = 0; i < dirtyCells.length; i++) {
                const { r, c } = dirtyCells[i];
                if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) continue;
                this.renderSingleCell(r, c, textGrid, colorGrid, hairGrid);
            }
            return;
        }

        // Mode B: Full Canvas Redraw (Initial load or stage change)
        this.ctx.font = '900 6px "Courier New", monospace';
        this.ctx.textBaseline = 'top';
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.cols * this.fontW, this.rows * this.fontH);

        const maxR = Math.min(this.rows, textGrid.length);
        for (let r = 0; r < maxR; r++) {
            const rowText = textGrid[r];
            const rowColors = colorGrid ? colorGrid[r] : null;

            for (let c = 0; c < this.cols && c < rowText.length; c++) {
                this.renderSingleCell(r, c, textGrid, colorGrid, hairGrid);
            }
        }
    }

    renderSingleCell(r, c, textGrid, colorGrid, hairGrid) {
        const xOff = c * this.fontW;
        const yOff = r * this.fontH;
        const ch = (textGrid[r] && textGrid[r][c]) ? textGrid[r][c] : ' ';
        const isHair = hairGrid ? hairGrid.has(r, c) : false;

        if (isHair) {
            // Draw dark hair cell background rect
            this.ctx.fillStyle = '#0a0a0f';
            this.ctx.fillRect(xOff, yOff, this.fontW, this.fontH);
            // Draw subtle dark hair character
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillText(ch, xOff, yOff);
        } else if (colorGrid && colorGrid[r] && colorGrid[r][c]) {
            // Clear background cell
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(xOff, yOff, this.fontW, this.fontH);
            // Draw skin character in sampled RGB color
            const [cr, cg, cb] = colorGrid[r][c];
            this.ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
            this.ctx.fillText(ch, xOff, yOff);
        } else {
            // Empty cell background fill
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(xOff, yOff, this.fontW, this.fontH);
        }
    }
}
