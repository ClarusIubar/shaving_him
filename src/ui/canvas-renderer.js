/**
 * Interface Layer: CanvasRenderer
 * High-performance ASCII grid drawing with Dirty Region partial redraw and rAF batching.
 */
import { GridGeometry } from '../domain/grid-geometry.js';

export class CanvasRenderer {
    constructor(canvasElement, gridGeometry = GridGeometry.default()) {
        this.canvas = canvasElement;
        this.geometry = gridGeometry;
        this.cols = gridGeometry.cols;
        this.rows = gridGeometry.rows;
        this.fontW = gridGeometry.cellWidth;
        this.fontH = gridGeometry.cellHeight;

        this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;

        this.setupCanvas();
        this.rafId = null;
        this.pendingDirtyCells = [];
        this.needsFullRedraw = false;
        this.currentStageData = null;
        this.currentHairGrid = null;
        this.particles = [];
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
            this.needsFullRedraw = true; // Signal full redraw required
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

        if (stageData.cols !== this.cols || stageData.rows !== this.rows) {
            this.cols = stageData.cols;
            this.rows = stageData.rows;
            this.setupCanvas();
        }

        const { textGrid, colorGrid } = stageData;

        // Mode A: Partial Dirty Cell Redraw (Ultra Fast < 1ms)
        if (dirtyCells && Array.isArray(dirtyCells) && dirtyCells.length > 0) {
            this.spawnParticles(dirtyCells);
            for (let i = 0; i < dirtyCells.length; i++) {
                const { r, c } = dirtyCells[i];
                if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) continue;
                this.renderSingleCell(r, c, textGrid, colorGrid, hairGrid);
            }
            this.updateAndRenderParticles();
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

    spawnParticles(dirtyCells) {
        if (!dirtyCells || dirtyCells.length === 0) return;
        const count = Math.min(dirtyCells.length, 12);
        const chars = ['*', '.', '°', '·'];
        for (let i = 0; i < count; i++) {
            const cell = dirtyCells[i];
            this.particles.push({
                x: cell.c * this.fontW + (Math.random() * 4 - 2),
                y: cell.r * this.fontH + (Math.random() * 4 - 2),
                vx: (Math.random() - 0.5) * 1.8,
                vy: (Math.random() - 0.8) * 1.5,
                life: 1.0,
                decay: 0.12 + Math.random() * 0.08,
                char: chars[Math.floor(Math.random() * chars.length)]
            });
        }
        if (this.particles.length > 40) {
            this.particles.splice(0, this.particles.length - 40);
        }
    }

    updateAndRenderParticles() {
        if (this.particles.length === 0 || !this.ctx) return;
        this.ctx.font = '900 6px "Courier New", monospace';
        this.ctx.textBaseline = 'top';

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            this.ctx.fillStyle = `rgba(255, 220, 180, ${p.life.toFixed(2)})`;
            this.ctx.fillText(p.char, p.x, p.y);
        }
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
