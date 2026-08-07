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
        this.particleRafId = null;
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

        if (dirtyCells === null || dirtyCells === undefined) {
            this.needsFullRedraw = true; // No dirty-cell info at all: signal full redraw required
        } else if (dirtyCells.length > 0) {
            this.pendingDirtyCells.push(...dirtyCells);
        }
        // An empty dirtyCells array means nothing on screen changed - nothing
        // to schedule beyond what may already be pending.

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

        // Kept in sync here too (not just in requestRender()) so a direct
        // render() call - e.g. main.js's initial synchronous paint - still
        // leaves enough state for the particle loop to restore cells from.
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
            if (dirtyCells.length === 0) return; // Nothing changed - nothing to draw
            for (let i = 0; i < dirtyCells.length; i++) {
                const { r, c } = dirtyCells[i];
                if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) continue;
                this.renderSingleCell(r, c, textGrid, colorGrid, hairGrid);
            }
            // spawnParticles() starts (or refills) a self-scheduling animation
            // loop, so particles keep moving/decaying even after this render
            // call - they must not freeze the instant shaving stops.
            this.spawnParticles(dirtyCells);
            return;
        }

        // Mode B: Full Canvas Redraw (dirtyCells is null/undefined - initial load or stage change)
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
                char: chars[Math.floor(Math.random() * chars.length)],
                // Grid cell this particle last painted into, so the NEXT
                // frame can repaint it from real stage data before the
                // particle moves on - otherwise the glyph is left behind as
                // a permanent trail.
                lastCellR: null,
                lastCellC: null
            });
        }
        if (this.particles.length > 40) {
            this.particles.splice(0, this.particles.length - 40);
        }
        this.ensureParticleLoop();
    }

    /**
     * Keep animating particles on their own schedule, independent of shave
     * input. Without this, a particle spawned by the last shave before the
     * user stops dragging never gets another updateAndRenderParticles()
     * call (that only used to happen inside the dirty-cell render path) and
     * freezes on screen mid-flight.
     */
    ensureParticleLoop() {
        if (this.particleRafId || this.particles.length === 0) return;
        if (typeof requestAnimationFrame !== 'function') return;
        const tick = () => {
            this.particleRafId = null;
            this.updateAndRenderParticles();
            if (this.particles.length > 0) {
                this.particleRafId = requestAnimationFrame(tick);
            }
        };
        this.particleRafId = requestAnimationFrame(tick);
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
        if (this.particles.length === 0 || !this.ctx) return;

        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            if (p.lastCellR !== null) {
                this.restoreParticleCell(p.lastCellR, p.lastCellC);
            }
        }

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

            p.lastCellR = Math.floor(p.y / this.fontH);
            p.lastCellC = Math.floor(p.x / this.fontW);
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
