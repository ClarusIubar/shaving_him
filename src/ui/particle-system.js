/**
 * Interface Layer: ParticleSystem
 * Manages ASCII shaving particle generation, decay dynamics, and autonomous animation loops.
 */

export class ParticleSystem {
    /**
     * @param {Object} options
     * @param {number} options.fontW - Grid cell width
     * @param {number} options.fontH - Grid cell height
     * @param {Function} options.onRestoreCell - Callback (r, c) => void to repaint background
     * @param {Function} options.onRenderGlyph - Callback (char, x, y, alpha) => void to draw glyph
     * @param {number} [options.maxParticles=40] - Maximum concurrent particles
     */
    constructor({ fontW = 6, fontH = 6, onRestoreCell = null, onRenderGlyph = null, maxParticles = 40 } = {}) {
        this.fontW = fontW;
        this.fontH = fontH;
        this.onRestoreCell = onRestoreCell;
        this.onRenderGlyph = onRenderGlyph;
        this.maxParticles = maxParticles;
        this.particles = [];
        this.rafId = null;
    }

    get count() {
        return this.particles.length;
    }

    spawn(dirtyCells) {
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
                lastCellR: null,
                lastCellC: null
            });
        }

        if (this.particles.length > this.maxParticles) {
            this.particles.splice(0, this.particles.length - this.maxParticles);
        }

        this.ensureLoop();
    }

    ensureLoop() {
        if (this.rafId || this.particles.length === 0) return;
        if (typeof requestAnimationFrame !== 'function') return;

        const tick = () => {
            this.rafId = null;
            this.updateAndRender();
            if (this.particles.length > 0) {
                this.rafId = requestAnimationFrame(tick);
            }
        };
        this.rafId = requestAnimationFrame(tick);
    }

    updateAndRender() {
        if (this.particles.length === 0) return;

        if (typeof this.onRestoreCell === 'function') {
            for (let i = 0; i < this.particles.length; i++) {
                const p = this.particles[i];
                if (p.lastCellR !== null) {
                    this.onRestoreCell(p.lastCellR, p.lastCellC);
                }
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            if (typeof this.onRenderGlyph === 'function') {
                this.onRenderGlyph(p.char, p.x, p.y, p.life);
            }

            p.lastCellR = Math.floor(p.y / this.fontH);
            p.lastCellC = Math.floor(p.x / this.fontW);
        }
    }

    clear() {
        this.particles = [];
        this.rafId = null;
    }
}
