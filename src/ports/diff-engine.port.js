/**
 * Abstract Port Interface: DiffEnginePort
 * Defines contract for calculating hair coordinates from Before vs After / Hair Mask deltas.
 */
export class DiffEnginePort {
    /**
     * @param {Array<Array<[number, number, number]>>} originalColors
     * @param {Array<Array<[number, number, number]>>} skinBaseColors
     * @param {number} threshold
     * @returns {{ hairPositions: Array<{ r: number, c: number }>, skinBaseColors: Array<Array<[number, number, number]>> }}
     */
    computeHairCoordinates(originalColors, skinBaseColors, threshold = 25) {
        throw new Error('DiffEnginePort method not implemented');
    }

    /**
     * @param {Array<Array<[number, number, number]>>} colors 
     * @param {number} threshold 
     * @returns {[number, number, number]}
     */
    calculateAverageSkinTone(colors, threshold = 80) {
        throw new Error('DiffEnginePort calculateAverageSkinTone method not implemented');
    }
}
