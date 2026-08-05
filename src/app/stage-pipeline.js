/**
 * Application Layer: StagePipeline
 * Orchestrates stage loading from static JSON sources or dynamic 1-Photo image processing adapters.
 * Implements Open-Closed Principle (OCP) via Strategy Handlers and Dependency Inversion Principle (DIP).
 * ZERO imports from concrete adapters layer.
 */
import { JsonSourceHandler, ImageSourceHandler, StageSourceRegistry } from './stage-source-handlers.js';

export class StagePipeline {
    constructor(jsonAdapter, imageProcessor, diffEngine, asciiConverter, registry = null) {
        if (registry) {
            this.registry = registry;
            return;
        }
        if (!jsonAdapter || !imageProcessor || !diffEngine || !asciiConverter) {
            throw new Error('StagePipeline requires a source registry or a full adapter set (json, image, diff, ascii)');
        }
        this.registry = new StageSourceRegistry([
            new JsonSourceHandler(jsonAdapter),
            new ImageSourceHandler(imageProcessor, diffEngine, asciiConverter)
        ]);
    }

    /**
     * Load stage from preset JSON, File, or Image Element
     * @param {string|Object|File|HTMLImageElement} source 
     * @param {number} targetCols 
     * @param {number} targetRows 
     * @param {Object} options 
     * @param {Function} onProgress 
     * @returns {Promise<Object>} StageDataDTO
     */
    async loadStage(source = 'game_data.json', targetCols = 280, targetRows = 219, options = {}, onProgress = null) {
        const handler = this.registry.findHandler(source);
        if (handler) {
            return handler.loadStage(source, targetCols, targetRows, options, onProgress);
        }
        throw new Error('Unsupported stage source format');
    }
}
