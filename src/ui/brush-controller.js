/**
 * Interface Layer: BrushController
 * Optimized with cached getBoundingClientRect and GPU transform translate3d positioning.
 */
import { GridGeometry } from '../domain/grid-geometry.js';
import { rasterizeLine } from '../domain/line-rasterizer.js';
import { CursorView } from './views/cursor-view.js';

export class BrushController {
    constructor(canvas, cursorOrCursorView, onShaveCallback, gridGeometry = GridGeometry.default()) {
        this.canvas = canvas;
        this.cursorView = (cursorOrCursorView instanceof CursorView)
            ? cursorOrCursorView
            : new CursorView(cursorOrCursorView);
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

    get cursor() {
        return this.cursorView.cursor;
    }

    set cursor(el) {
        this.cursorView.cursor = el;
    }

    updateRect() {
        if (this.canvas) {
            this.rect = this.canvas.getBoundingClientRect();
        }
    }

    setRadius(newRadius) {
        this.brushRadius = Math.max(1, Math.min(7, newRadius));
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
        this.cursorView.setSize(this.brushRadius);
    }

    getGridCoords(clientX, clientY) {
        if (!this.rect) this.updateRect();
        return this.geometry.clientToGrid(clientX, clientY, this.rect);
    }

    invalidateRect() {
        this.updateRect();
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
            this.cursorView.setPosition(e.clientX, e.clientY);
            this.handlePointerMove(e.clientX, e.clientY);
        });

        // Touch Drag Support for Mobile
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.cancelable) e.preventDefault();
            this.updateRect();
            this.isMouseDown = true;
            this.lastR = -1;
            this.lastC = -1;
            if (e.touches.length > 0) {
                const t = e.touches[0];
                this.cursorView.setVisibility(true);
                this.handlePointerMove(t.clientX, t.clientY);
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            if (e.cancelable) e.preventDefault(); // Prevents mobile pull-to-refresh
            if (e.touches.length > 0) {
                const t = e.touches[0];
                this.cursorView.setPosition(t.clientX, t.clientY);
                this.handlePointerMove(t.clientX, t.clientY);
            }
        }, { passive: false });

        this.canvas.addEventListener('touchend', () => {
            this.isMouseDown = false;
            this.lastR = -1;
            this.lastC = -1;
            this.cursorView.setVisibility(false);
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
            this.cursorView.setVisibility(true);
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.cursorView.setVisibility(false);
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
            rasterizeLine(this.lastR, this.lastC, row, col, (r, c) => {
                if (typeof this.onShave === 'function') {
                    this.onShave(r, c, this.brushRadius);
                }
            });
        } else if (this.isMouseDown && typeof this.onShave === 'function') {
            this.onShave(row, col, this.brushRadius);
        }
        this.lastR = row;
        this.lastC = col;
    }
}
