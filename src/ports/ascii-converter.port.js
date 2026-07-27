/**
 * Abstract Port Interface: AsciiConverterPort
 * Defines contract for converting an image bitmap into an ASCII character & color grid.
 */
export class AsciiConverterPort {
    /**
     * @param {Object} imageData 
     * @param {number} targetCols 
     * @param {number} targetRows 
     * @returns {{ textGrid: string[], colorGrid: Array<Array<[number, number, number]>> }}
     */
    convertToAsciiGrid(imageData, targetCols = 280, targetRows = 219) {
        throw new Error('AsciiConverterPort method not implemented');
    }
}
