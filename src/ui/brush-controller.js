/**
 * Interface Layer: BrushController
 * Optimized with cached getBoundingClientRect and GPU transform translate3d positioning.
 */
export class BrushController {
    constructor(canvasElement, cursorElement, onShaveCallback) {
        this.canvas = canvasElement;
        this.cursor = cursorElement;
        this.onShave = onShaveCallback;
        
        this.brushRadius = 1; // Default: 3x3 (radius 1)
        this.isMouseDown = false;
        this.fontW = 6;
        this.fontH = 6;
        this.lastR = -1;
        this.lastC = -1;
        this.rect = null;
        this.radiusChangeCallbacks = [];

        this.updateRect();
        this.initEvents();
    }

    updateRect() {
        if (this.canvas) {
            this.rect = this.canvas.getBoundingClientRect();
        }
    }

    setRadius(radius) {
        const newRadius = Math.max(1, Math.min(7, radius)); // Radius 1~7
        const changed = this.brushRadius !== newRadius;
        this.brushRadius = newRadius;
        this.updateCursorSize();
        if (changed) {
            for (let i = 0; i < this.radiusChangeCallbacks.length; i++) {
                this.radiusChangeCallbacks[i](this.brushRadius);
            }
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
        const scaleX = this.canvas.width / this.rect.width;
        const scaleY = this.canvas.height / this.rect.height;
        const mx = (clientX - this.rect.left) * scaleX;
        const my = (clientY - this.rect.top) * scaleY;
        const col = Math.floor(mx / this.fontW);
        const row = Math.floor(my / this.fontH);
        return { row, col };
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

        window.addEventListener('mouseup', () => {
            this.isMouseDown = false;
            this.lastR = -1;
            this.lastC = -1;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.cursor) {
                // GPU composited transform positioning (no DOM reflow)
                this.cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%) rotate(-30deg)`;
            }
            this.handlePointerMove(e.clientX, e.clientY);
        });

        // Touch Drag Support for Mobile
        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                const t = e.touches[0];
                if (this.cursor) {
                    this.cursor.style.transform = `translate3d(${t.clientX}px, ${t.clientY}px, 0) translate(-50%, -50%) rotate(-30deg)`;
                }
                this.handlePointerMove(t.clientX, t.clientY);
            }
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
        if (row !== this.lastR || col !== this.lastC) {
            if (this.onShave) {
                this.onShave(row, col, this.brushRadius);
            }
            this.lastR = row;
            this.lastC = col;
        }
    }
}
