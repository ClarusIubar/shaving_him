/**
 * Interface Layer: CanvasRenderer
 * Handles high-performance ASCII grid drawing on HTML5 Canvas.
 */
export class CanvasRenderer {
    constructor(canvasElement, cols = 280, rows = 219, fontW = 6, fontH = 6) {
        this.canvas = canvasElement;
        this.cols = cols;
        this.rows = rows;
        this.fontW = fontW;
        this.fontH = fontH;

        this.canvas.width = cols * fontW;
        this.canvas.height = rows * fontH;
        this.ctx = this.canvas.getContext('2d');
        this.ctx.font = '900 6px "Courier New", monospace';
        this.ctx.textBaseline = 'top';
    }

    /**
     * Render full stage and hair grid
     * @param {Object} stageData - Stage DTO { textGrid, colorGrid }
     * @param {Object} hairGrid - HairGrid instance
     */
    render(stageData, hairGrid) {
        if (!stageData || !this.ctx) return;
        const { textGrid, colorGrid } = stageData;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let r = 0; r < this.rows && r < textGrid.length; r++) {
            const rowText = textGrid[r];
            const rowColors = colorGrid[r];
            const yOff = r * this.fontH;

            for (let c = 0; c < this.cols && c < rowText.length; c++) {
                const ch = rowText[c];
                const xOff = c * this.fontH;
                const isHair = hairGrid ? hairGrid.has(r, c) : false;

                if (isHair) {
                    // Hair overlay (darkened)
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                } else if (rowColors && rowColors[c]) {
                    const [cr, cg, cb] = rowColors[c];
                    this.ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
                } else {
                    this.ctx.fillStyle = '#000';
                }

                this.ctx.fillText(ch, xOff, yOff);
            }
        }
    }
}
