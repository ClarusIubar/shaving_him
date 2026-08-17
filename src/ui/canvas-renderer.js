/**
 * Interface Layer: CanvasRenderer
 * High-performance ASCII grid drawing with Dirty Region partial redraw and rAF batching.
 */
import { GridGeometry } from '../domain/grid-geometry.js';
import { ParticleSystem } from './particle-system.js';

export class CanvasRenderer {
    constructor(canvasElement, gridGeometry = GridGeometry.default()) {
        this.canvas = canvasElement;
        this.geometry = gridGeometry;
        this.cols = gridGeometry.cols;
        this.rows = gridGeometry.rows;
        this.fontW = gridGeometry.cellWidth;
        this.fontH = gridGeometry.cellHeight;

        this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;

        this.rafId = null;
        this.pendingDirtyCells = [];
        this.needsFullRedraw = false;
        this.currentStageData = null;
        this.currentHairGrid = null;

        this.particleSystem = new ParticleSystem({
            fontW: this.fontW,
            fontH: this.fontH,
            onRestoreCell: (r, c) => this.restoreParticleCell(r, c),
            onRenderGlyph: (char, x, y, alpha) => {
                if (!this.ctx) return;
                this.ctx.font = '900 6px "Courier New", monospace';
                this.ctx.textBaseline = 'top';
                this.ctx.fillStyle = `rgba(255, 220, 180, ${alpha.toFixed(2)})`;
                this.ctx.fillText(char, x, y);
            }
        });

        this.setupCanvas();
    }

    get particles() {
        return this.particleSystem.particles;
    }

    set particles(val) {
        this.particleSystem.particles = val;
    }

    get particleRafId() {
        return this.particleSystem.rafId;
    }

    set particleRafId(val) {
        this.particleSystem.rafId = val;
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

        this.particleSystem.fontW = this.fontW;
        this.particleSystem.fontH = this.fontH;
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

        if (dirtyCells === null || dirtyCells === undefined) {
            this.needsFullRedraw = true; // No dirty-cell info at all: signal full redraw required
        } else if (dirtyCells.length > 0) {
            this.pendingDirtyCells.push(...dirtyCells);
        }

        if (!this.rafId) {
            this.rafId = requestAnimationFrame(() => {
                this.rafId = null;
                const dirty = this.needsFullRedraw ? null : this.pendingDirtyCells;
                this.needsFullRedraw = false;
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

        this.currentStageData = stageData;
        this.currentHairGrid = hairGrid;

        if (stageData.cols !== this.cols || stageData.rows !== this.rows) {
            this.cols = stageData.cols;
            this.rows = stageData.rows;
            this.setupCanvas();
        }

        const { textGrid, colorGrid } = stageData;

        // Mode A: Partial Dirty Cell Redraw (Ultra Fast < 1ms)
        if (Array.isArray(dirtyCells)) {
            if (dirtyCells.length === 0) return;
            for (let i = 0; i < dirtyCells.length; i++) {
                const { r, c } = dirtyCells[i];
                if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) continue;
                this.renderSingleCell(r, c, textGrid, colorGrid, hairGrid);
            }
            this.spawnParticles(dirtyCells);
            return;
        }

        // Mode B: Full Canvas Redraw
        this.ctx.font = '900 6px "Courier New", monospace';
        this.ctx.textBaseline = 'top';
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.cols * this.fontW, this.rows * this.fontH);

        const maxR = Math.min(this.rows, textGrid.length);
        for (let r = 0; r < maxR; r++) {
            const rowText = textGrid[r];

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

    spawnParticles(dirtyCells) {
        this.particleSystem.spawn(dirtyCells);
    }

    ensureParticleLoop() {
        this.particleSystem.ensureLoop();
    }

    /** Repaint the grid cell at (r, c) from the last known stage/hair data,
     *  used to erase a particle's previous position before it moves on. */
    restoreParticleCell(r, c) {
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return;
        if (!this.currentStageData) return;
        const { textGrid, colorGrid } = this.currentStageData;
        this.renderSingleCell(r, c, textGrid, colorGrid, this.currentHairGrid);
    }

    updateAndRenderParticles() {
        this.particleSystem.updateAndRender();
    }

    exportPng(filename = 'shaving_art.png') {
        if (!this.canvas || typeof document === 'undefined') return;
        try {
            const dataUrl = this.canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = filename;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error('PNG export failed:', e);
        }
    }
}
