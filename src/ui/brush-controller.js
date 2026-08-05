/**
 * Interface Layer: BrushController
 * Optimized with cached getBoundingClientRect and GPU transform translate3d positioning.
 */
import { GridGeometry } from '../domain/grid-geometry.js';

export class BrushController {
    constructor(canvas, cursor, onShaveCallback, gridGeometry = GridGeometry.default()) {
        this.canvas = canvas;
        this.cursor = cursor;
        this.onShave = onShaveCallback;
        this.geometry = gridGeometry;
        this.cols = gridGeometry.cols;
        this.rows = gridGeometry.rows;
        this.fontW = gridGeometry.cellWidth;
        this.fontH = gridGeometry.cellHeight;
        this.brushRadius = 1;
        this.isMouseDown = false;
        this.lastR = -1;
        this.lastC = -1;
        this.rect = null;
        this.radiusChangeCallbacks = [];

        if (this.canvas) {
            this.updateRect();
            this.initEvents();
        }
    }

    updateRect() {
        if (this.canvas) {
            this.rect = this.canvas.getBoundingClientRect();
        }
    }

    setRadius(newRadius) {
        this.brushRadius = Math.max(1, Math.min(5, newRadius));
        this.updateCursorSize();
        for (let i = 0; i < this.radiusChangeCallbacks.length; i++) {
            this.radiusChangeCallbacks[i](this.brushRadius);
        }
    }

    onRadiusChange(callback) {
        if (typeof callback === 'function') {
            this.radiusChangeCallbacks.push(callback);
        }
    }

    updateCursorSize() {
        if (!this.cursor) return;
        const fontSize = 24 + (this.brushRadius - 1) * 8; // Scale cursor emoji
        this.cursor.style.fontSize = `${fontSize}px`;
    }

    getGridCoords(clientX, clientY) {
        if (!this.rect) this.updateRect();
        return this.geometry.clientToGrid(clientX, clientY, this.rect);
    }

    initEvents() {
        if (typeof window !== 'undefined') {
            // Cache canvas bounding box on resize / scroll to eliminate layout thrashing
            window.addEventListener('resize', () => this.updateRect(), { passive: true });
            window.addEventListener('scroll', () => this.updateRect(), { passive: true });

            window.addEventListener('mouseup', () => {
                this.isMouseDown = false;
                this.lastR = -1;
                this.lastC = -1;
            });
        }

        if (!this.canvas) return;

        // Mouse Down / Up for Drag Shaving
        this.canvas.addEventListener('mousedown', (e) => {
            this.isMouseDown = true;
            this.handlePointerMove(e.clientX, e.clientY);
        });



        this.canvas.addEventListener('mousemove', (e) => {
            if (this.cursor) {
                // GPU composited transform positioning (no DOM reflow)
                this.cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%) rotate(-30deg)`;
            }
            this.handlePointerMove(e.clientX, e.clientY);
        });

        // Touch Drag Support for Mobile
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.cancelable) e.preventDefault();
            this.isMouseDown = true;
            this.lastR = -1;
            this.lastC = -1;
            if (e.touches.length > 0) {
                const t = e.touches[0];
                if (this.cursor) this.cursor.style.opacity = '1';
                this.handlePointerMove(t.clientX, t.clientY);
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            if (e.cancelable) e.preventDefault(); // Prevents mobile pull-to-refresh
            if (e.touches.length > 0) {
                const t = e.touches[0];
                if (this.cursor) {
                    this.cursor.style.transform = `translate3d(${t.clientX}px, ${t.clientY}px, 0) translate(-50%, -50%) rotate(-30deg)`;
                }
                this.handlePointerMove(t.clientX, t.clientY);
            }
        }, { passive: false });

        this.canvas.addEventListener('touchend', () => {
            this.isMouseDown = false;
            this.lastR = -1;
            this.lastC = -1;
            if (this.cursor) this.cursor.style.opacity = '0';
        }, { passive: true });

        // Mouse Wheel for Dynamic Razor Resizing
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY < 0) {
                this.setRadius(this.brushRadius + 1); // Increase size
            } else {
                this.setRadius(this.brushRadius - 1); // Decrease size
            }
        }, { passive: false });

        this.canvas.addEventListener('mouseenter', () => {
            this.updateRect();
            if (this.cursor) this.cursor.style.opacity = '1';
        });

        this.canvas.addEventListener('mouseleave', () => {
            if (this.cursor) this.cursor.style.opacity = '0';
        });
    }

    handlePointerMove(clientX, clientY) {
        const { row, col } = this.getGridCoords(clientX, clientY);

        if (row < 0 || col < 0 || row >= this.rows || col >= this.cols) {
            this.lastR = -1;
            this.lastC = -1;
            return;
        }

        if (this.isMouseDown && this.lastR !== -1 && this.lastC !== -1 && (this.lastR !== row || this.lastC !== col)) {
            // Line interpolation (Bresenham's line algorithm)
            let r0 = this.lastR, c0 = this.lastC;
            const r1 = row, c1 = col;
            const dr = Math.abs(r1 - r0);
            const dc = Math.abs(c1 - c0);
            const sr = r0 < r1 ? 1 : -1;
            const sc = c0 < c1 ? 1 : -1;
            let err = (dc > dr ? dc : -dr) / 2;

            while (true) {
                if (this.onShave) {
                    this.onShave(r0, c0, this.brushRadius);
                }
                if (r0 === r1 && c0 === c1) break;
                const e2 = err;
                if (e2 > -dc) { err -= dr; c0 += sc; }
                if (e2 < dr) { err += dc; r0 += sr; }
            }
        } else if (this.isMouseDown || (row !== this.lastR || col !== this.lastC)) {
            if (this.isMouseDown && this.onShave) {
                this.onShave(row, col, this.brushRadius);
            }
        }
        this.lastR = row;
        this.lastC = col;
    }
}
