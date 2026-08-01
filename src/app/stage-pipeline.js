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
     * Compute average skin color from brighter non-hair pixels in the image
     * @param {Array<Array<[number, number, number]>>} colors 
     * @param {number} threshold 
     * @returns {[number, number, number]}
     */
    calculateAverageSkinTone(colors, threshold = 80) {
        let sumR = 0, sumG = 0, sumB = 0, count = 0;
        for (let r = 0; r < colors.length; r++) {
            const row = colors[r];
            for (let c = 0; c < row.length; c++) {
                const pixel = row[c];
                const cr = pixel[0], cg = pixel[1], cb = pixel[2], ca = pixel.length > 3 ? pixel[3] : 255;
                if (ca < 128) continue; // Skip transparent pixels
                const lum = (cr + cg + cb) / 3;
                if (lum >= threshold) {
                    sumR += cr;
                    sumG += cg;
                    sumB += cb;
                    count++;
                }
            }
        }
        if (count === 0) return [210, 180, 150]; // Fallback default
        return [
            Math.round(sumR / count),
            Math.round(sumG / count),
            Math.round(sumB / count)
        ];
    }

    /**
     * Load stage from preset JSON, File, or Image Element
     * @param {string|Object|File|HTMLImageElement} source 
     * @param {number} targetCols 
     * @param {number} targetRows 
     * @param {Object} options - { hairThreshold: number, skinLumThreshold: number }
     * @returns {Promise<Object>} StageDataDTO
     */
    async loadStage(source = 'game_data.json', targetCols = 280, targetRows = 219, options = {}) {
        const { hairThreshold = 25, skinLumThreshold = 80 } = options;

        // Option 1: Preset JSON or JSON Object
        if (typeof source === 'string' || (typeof source === 'object' && source.text && !source.name)) {
            return await this.jsonAdapter.loadStage(source);
        }

        // Option 2: Custom Image File or HTMLImageElement
        if ((typeof File !== 'undefined' && source instanceof File) || (typeof HTMLImageElement !== 'undefined' && source instanceof HTMLImageElement)) {
            const { colors } = await this.imageProcessor.processImageSource(source, targetCols, targetRows);

            // Dynamically sample skin color from non-hair pixels
            const avgSkinColor = this.calculateAverageSkinTone(colors, skinLumThreshold);

            // Generate skin base colors (smoothed out dark pixels with sampled skin color)
            const skinBaseColors = colors.map(row =>
                row.map(([r, g, b]) => {
                    const lum = (r + g + b) / 3;
                    return lum < skinLumThreshold ? avgSkinColor : [r, g, b];
                })
            );

            // Extract hair coordinates via diff engine
            const hairPositions = this.diffEngine.computeHairCoordinates(colors, skinBaseColors, hairThreshold);

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
