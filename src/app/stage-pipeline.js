/**
 * Application Layer: StagePipeline
 * Orchestrates stage loading from static JSON sources or dynamic 1-Photo image processing adapters.
 */
import { StaticJsonStageAdapter } from '../adapters/static-json-stage.js';
import { CanvasImageProcessorAdapter } from '../adapters/canvas-image-processor.js';
import { DeltaDiffEngineAdapter } from '../adapters/delta-diff-engine.js';
import { CanvasAsciiConverterAdapter } from '../adapters/canvas-ascii-converter.js';

export class StagePipeline {
    constructor(
        jsonAdapter = new StaticJsonStageAdapter(),
        imageProcessor = new CanvasImageProcessorAdapter(),
        diffEngine = new DeltaDiffEngineAdapter(),
        asciiConverter = new CanvasAsciiConverterAdapter()
    ) {
        this.jsonAdapter = jsonAdapter;
        this.imageProcessor = imageProcessor;
        this.diffEngine = diffEngine;
        this.asciiConverter = asciiConverter;
    }

    /**
     * Load stage from preset JSON, File, or Image Element
     * @param {string|Object|File|HTMLImageElement} source 
     * @param {number} targetCols 
     * @param {number} targetRows 
     * @returns {Promise<Object>} StageDataDTO
     */
    async loadStage(source = 'game_data.json', targetCols = 280, targetRows = 219) {
        // Option 1: Preset JSON or JSON Object
        if (typeof source === 'string' || (typeof source === 'object' && source.text && !source.name)) {
            return await this.jsonAdapter.loadStage(source);
        }

        // Option 2: Custom Image File or HTMLImageElement
        if ((typeof File !== 'undefined' && source instanceof File) || (typeof HTMLImageElement !== 'undefined' && source instanceof HTMLImageElement)) {
            const { colors } = await this.imageProcessor.processImageSource(source, targetCols, targetRows);

            // Generate skin base colors (smoothed out dark pixels)
            const skinBaseColors = colors.map(row =>
                row.map(([r, g, b]) => {
                    const lum = (r + g + b) / 3;
                    return lum < 80 ? [210, 180, 150] : [r, g, b];
                })
            );

            // Extract hair coordinates via diff engine
            const hairPositions = this.diffEngine.computeHairCoordinates(colors, skinBaseColors, 25);

            // Convert original image to ASCII textGrid & colorGrid DTO
            const { textGrid, colorGrid } = this.asciiConverter.convertToAsciiGrid(colors);

            return {
                rows: targetRows,
                cols: targetCols,
                totalHairCount: hairPositions.length,
                hairPositions,
                textGrid,
                colorGrid
            };
        }

        throw new Error('Unsupported stage source format');
    }
}
