/**
 * Abstract Port Interface: DiffEnginePort
 * Defines contract for calculating hair coordinates from Before vs After / Hair Mask deltas.
 */
export class DiffEnginePort {
    /**
     * @param {Array<Array<[number, number, number]>>} originalColors 
     * @param {Array<Array<[number, number, number]>>} skinBaseColors 
     * @param {number} threshold 
     * @returns {Array<{ r: number, c: number }>}
     */
    computeHairCoordinates(originalColors, skinBaseColors, threshold = 25) {
        throw new Error('DiffEnginePort method not implemented');
    }
}
