/**
 * Abstract Port Interface: DiffEnginePort
 * Defines contract for calculating hair coordinates from Before vs After / Hair Mask deltas.
 */
export class DiffEnginePort {
    /**
     * @param {Array<Array<[number, number, number]>>} originalColors
     * @param {Array<Array<[number, number, number]>>} skinBaseColors - pass null/undefined to derive it internally from skinLumThreshold
     * @param {number} threshold
     * @param {number} skinLumThreshold - luminance floor used when deriving skinBaseColors internally
     * @returns {{ hairPositions: Array<{ r: number, c: number }>, skinBaseColors: Array<Array<[number, number, number]>> }}
     */
    computeHairCoordinates(originalColors, skinBaseColors, threshold = 25, skinLumThreshold = 80) {
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
