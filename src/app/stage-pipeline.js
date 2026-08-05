/**
 * Application Layer: StagePipeline
 * Orchestrates stage loading from static JSON sources or dynamic 1-Photo image processing adapters.
 * Implements Open-Closed Principle (OCP) via Strategy Handlers and Dependency Inversion Principle (DIP).
 * ZERO imports from concrete adapters layer.
 */
import { JsonSourceHandler, ImageSourceHandler, StageSourceRegistry } from './stage-source-handlers.js';

export class StagePipeline {
    constructor(jsonAdapter, imageProcessor, diffEngine, asciiConverter, registry = null) {
        this.jsonAdapter = jsonAdapter;
        this.imageProcessor = imageProcessor;
        this.diffEngine = diffEngine;
        this.asciiConverter = asciiConverter;

        if (registry) {
            this.registry = registry;
        } else {
            this.registry = new StageSourceRegistry([
                new JsonSourceHandler(jsonAdapter),
                new ImageSourceHandler(imageProcessor, diffEngine, asciiConverter)
            ]);
        }
    }

    /**
     * Delegate skin tone calculation to DiffEngine (SRP compliance)
     */
    calculateAverageSkinTone(colors, threshold = 80) {
        if (this.diffEngine && typeof this.diffEngine.calculateAverageSkinTone === 'function') {
            return this.diffEngine.calculateAverageSkinTone(colors, threshold);
        }
        return [210, 180, 150];
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
