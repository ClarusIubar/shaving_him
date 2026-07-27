/**
 * Interface Layer: BrushController
 * Manages razor brush size (3x3 ~ 15x15), mouse drag, touch drag, and mouse wheel zooming.
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

        this.initEvents();
    }

    setRadius(radius) {
        this.brushRadius = Math.max(1, Math.min(7, radius)); // Radius 1~7
        this.updateCursorSize();
    }

    updateCursorSize() {
        if (!this.cursor) return;
        const fontSize = 24 + (this.brushRadius - 1) * 8; // Scale cursor emoji
        this.cursor.style.fontSize = `${fontSize}px`;
    }

    getGridCoords(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const mx = (clientX - rect.left) * scaleX;
        const my = (clientY - rect.top) * scaleY;
        const col = Math.floor(mx / this.fontW);
        const row = Math.floor(my / this.fontH);
        return { row, col };
    }

    initEvents() {
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
                this.cursor.style.left = `${e.clientX}px`;
                this.cursor.style.top = `${e.clientY}px`;
            }
            // Allow drag or hover shaving
            this.handlePointerMove(e.clientX, e.clientY);
        });

        // Touch Drag Support for Mobile
        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                const t = e.touches[0];
                if (this.cursor) {
                    this.cursor.style.left = `${t.clientX}px`;
                    this.cursor.style.top = `${t.clientY}px`;
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
        });

        this.canvas.addEventListener('mouseenter', () => {
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
