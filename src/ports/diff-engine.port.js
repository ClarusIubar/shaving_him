/**
 * Abstract Port Interface: DiffEnginePort
 * Defines contract for calculating hair coordinates from Before vs After / Hair Mask deltas.
 */
export class DiffEnginePort {
    /**
     * @param {Object} originalData 
     * @param {Object} skinBaseData 
     * @param {number} rows 
     * @param {number} cols 
     * @returns {Array<{ r: number, c: number }>}
     */
    computeHairCoordinates(originalData, skinBaseData, rows, cols) {
        throw new Error('DiffEnginePort method not implemented');
    }
}
