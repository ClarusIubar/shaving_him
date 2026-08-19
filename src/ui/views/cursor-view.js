/**
 * Interface Layer: CursorView
 * Encapsulates DOM rendering for razor cursor with GPU-accelerated transform translate3d.
 */
export class CursorView {
    constructor(cursorElement = null) {
        this.cursor = cursorElement;
    }

    setPosition(clientX, clientY) {
        if (!this.cursor || !this.cursor.style) return;
        this.cursor.style.transform = `translate3d(${clientX}px, ${clientY}px, 0) translate(-50%, -50%) rotate(-30deg)`;
    }

    setSize(radius) {
        if (!this.cursor || !this.cursor.style) return;
        const fontSize = 24 + (radius - 1) * 8;
        this.cursor.style.fontSize = `${fontSize}px`;
    }

    setVisibility(visible) {
        if (!this.cursor || !this.cursor.style) return;
        this.cursor.style.opacity = visible ? '1' : '0';
    }
}
