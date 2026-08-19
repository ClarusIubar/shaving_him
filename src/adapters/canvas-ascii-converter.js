/**
 * Concrete Adapter: CanvasAsciiConverterAdapter
 * Translates pixel data or color arrays into an ASCII character grid and RGB color matrix.
 */
import { AsciiConverterPort } from '../ports/ascii-converter.port.js';

export class CanvasAsciiConverterAdapter extends AsciiConverterPort {
    constructor(ramp = ' .:-=+*#%@') {
        super();
        this.ramp = ramp;
    }

    /**
     * Map brightness 0..255 to character
     */
    charFromBrightness(brightness) {
        const index = Math.floor((brightness / 255) * (this.ramp.length - 1));
        return this.ramp[Math.max(0, Math.min(this.ramp.length - 1, index))];
    }

    /**
     * Convert color grid to ASCII textGrid & colorGrid DTO
     * @param {Array<Array<[number, number, number]>>} colors
     * @param {number} targetCols
     * @param {number} targetRows
     */
    convertToAsciiGrid(colors, targetCols, targetRows) {
        let actualRows = 0;
        if (Array.isArray(colors)) {
            actualRows = colors.length;
        }
        let actualCols = 0;
        if (actualRows > 0 && Array.isArray(colors[0])) {
            actualCols = colors[0].length;
        }
        if (actualRows !== targetRows || actualCols !== targetCols) {
            throw new Error(
                `CanvasAsciiConverterAdapter: colors grid dimensions (${actualRows}x${actualCols}) do not match target dimensions (${targetRows}x${targetCols})`
            );
        }

        const textGrid = [];
        const colorGrid = [];

        for (let r = 0; r < colors.length; r++) {
            const row = colors[r];
            let lineStr = '';
            const rowColors = [];

            for (let c = 0; c < row.length; c++) {
                const [red, green, blue] = row[c];
                const brightness = (red + green + blue) / 3;
                lineStr += this.charFromBrightness(brightness);
                rowColors.push([red, green, blue]);
            }

            textGrid.push(lineStr);
            colorGrid.push(rowColors);
        }

        return { textGrid, colorGrid };
    }
}
