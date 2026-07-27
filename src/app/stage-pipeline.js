/**
 * Application Layer: StagePipeline
 * Orchestrates stage loading from static JSON sources or dynamic 1-Photo image processing adapters.
 */
import { StaticJsonStageAdapter } from '../adapters/static-json-stage.js';

export class StagePipeline {
    constructor(jsonAdapter = new StaticJsonStageAdapter()) {
        this.jsonAdapter = jsonAdapter;
    }

    /**
     * Load stage from preset JSON or dynamic image source
     * @param {string|Object} source 
     * @returns {Promise<Object>} StageDataDTO
     */
    async loadStage(source = 'game_data.json') {
        if (typeof source === 'string' || (typeof source === 'object' && source.text)) {
            return await this.jsonAdapter.loadStage(source);
        }
        
        throw new Error('Unsupported stage source format');
    }
}
