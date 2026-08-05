/**
 * Application Layer: StagePipeline
 * Orchestrates stage loading from static JSON sources or dynamic 1-Photo image processing adapters.
 * Implements Open-Closed Principle (OCP) via Source Handlers and Single Responsibility Principle (SRP).
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
     * Delegate skin tone calculation to DiffEngine (SRP compliance)
     */
    calculateAverageSkinTone(colors, threshold = 80) {
        return this.diffEngine.calculateAverageSkinTone(colors, threshold);
    }

    /**
     * Load stage from preset JSON, File, or Image Element
     * @param {string|Object|File|HTMLImageElement} source 
     * @param {number} targetCols 
     * @param {number} targetRows 
     * @param {Object} options - { hairThreshold: number, skinLumThreshold: number }
     * @returns {Promise<Object>} StageDataDTO
     */
    async loadStage(source = 'game_data.json', targetCols = 280, targetRows = 219, options = {}, onProgress = null) {
        const { hairThreshold = 25, skinLumThreshold = 80 } = options;
        const report = (msg, pct) => {
            if (typeof onProgress === 'function') onProgress(msg, pct);
        };
        const yieldThread = () => new Promise(r => setTimeout(r, 16));

        // Strategy 1: Preset JSON or JSON Object
        if (typeof source === 'string' || (typeof source === 'object' && source.text && !source.name)) {
            report('🎮 프리셋 아스키 스테이지 로드 중...', 50);
            const data = await this.jsonAdapter.loadStage(source);
            report('✨ 스테이지 준비 완료!', 100);
            return data;
        }

        // Strategy 2: Custom Image File or HTMLImageElement
        if ((typeof File !== 'undefined' && source instanceof File) || (typeof HTMLImageElement !== 'undefined' && source instanceof HTMLImageElement)) {
            report('📷 1/4: 이미지 디코딩 및 그리드 리사이징 중...', 25);
            await yieldThread();
            const { colors } = await this.imageProcessor.processImageSource(source, targetCols, targetRows);

            report('🎨 2/4: 동적 피부 톤 감지 및 모공 샘플링 중...', 50);
            await yieldThread();
            const avgSkinColor = this.calculateAverageSkinTone(colors, skinLumThreshold);

            const skinBaseColors = colors.map(row =>
                row.map(([r, g, b]) => {
                    const lum = (r + g + b) / 3;
                    return lum < skinLumThreshold ? avgSkinColor : [r, g, b];
                })
            );

            report('🪒 3/4: 털 영역 비트맵 디프(Diff) 추출 중...', 75);
            await yieldThread();
            const hairPositions = this.diffEngine.computeHairCoordinates(colors, skinBaseColors, hairThreshold);

            report('✨ 4/4: 아스키(ASCII) 캔버스 파이프라인 합성 중...', 95);
            await yieldThread();
            const { textGrid, colorGrid } = this.asciiConverter.convertToAsciiGrid(colors);

            report('✅ 스테이지 로드 완료!', 100);
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
