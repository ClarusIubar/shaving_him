/**
 * Abstract Port Interface: StageSourcePort
 * Defines contract for loading stages from various sources (JSON, Image, etc.)
 */
export class StageSourcePort {
    /**
     * Check if this strategy can handle the given stage source
     * @param {*} source 
     * @returns {boolean}
     */
    canHandle(source) {
        throw new Error('StageSourcePort method not implemented');
    }

    /**
     * Load stage data DTO from source
     * @param {*} source 
     * @param {number} targetCols 
     * @param {number} targetRows 
     * @param {Object} options 
     * @returns {Promise<Object>} StageDataDTO
     */
    async loadStage(source, targetCols, targetRows, options = {}, onProgress = null) {
        throw new Error('StageSourcePort method not implemented');
    }
}
