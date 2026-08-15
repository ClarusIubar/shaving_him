/**
 * Application Layer: Stage Source Strategy Handlers (OCP & SRP Compliance)
 * Implements StageSourcePort strategy handlers for JSON presets and 1-Photo Image processing.
 */
import { StageSourcePort } from '../ports/stage-source.port.js';
import { validateStageData } from '../domain/schema-validator.js';

export class JsonSourceHandler extends StageSourcePort {
    constructor(jsonAdapter) {
        super();
        if (!jsonAdapter || typeof jsonAdapter.loadStage !== 'function') {
            throw new Error('JsonSourceHandler requires a stage source adapter exposing loadStage()');
        }
        this.jsonAdapter = jsonAdapter;
    }

    canHandle(source) {
        return typeof source === 'string' || (typeof source === 'object' && source !== null && source.text && !source.name);
    }

    async loadStage(source, targetCols, targetRows, options = {}, onProgress = null) {
        if (typeof onProgress === 'function') onProgress('🎮 프리셋 아스키 스테이지 로드 중...', 50);
        const data = await this.jsonAdapter.loadStage(source, targetCols, targetRows);
        if (typeof onProgress === 'function') onProgress('✨ 스테이지 준비 완료!', 100);
        return validateStageData(data);
    }
}

export class ImageSourceHandler extends StageSourcePort {
    constructor(imageProcessor, diffEngine, asciiConverter) {
        super();
        if (!imageProcessor || typeof imageProcessor.processImageSource !== 'function') {
            throw new Error('ImageSourceHandler requires an image processor exposing processImageSource()');
        }
        if (!diffEngine || typeof diffEngine.computeHairCoordinates !== 'function') {
            throw new Error('ImageSourceHandler requires a diff engine exposing computeHairCoordinates()');
        }
        if (!asciiConverter || typeof asciiConverter.convertToAsciiGrid !== 'function') {
            throw new Error('ImageSourceHandler requires an ascii converter exposing convertToAsciiGrid()');
        }
        this.imageProcessor = imageProcessor;
        this.diffEngine = diffEngine;
        this.asciiConverter = asciiConverter;
    }

    canHandle(source) {
        return (typeof File !== 'undefined' && source instanceof File) ||
               (typeof HTMLImageElement !== 'undefined' && source instanceof HTMLImageElement);
    }

    async loadStage(source, targetCols = 280, targetRows = 219, options = {}, onProgress = null) {
        const { hairThreshold = 25, skinLumThreshold = 80 } = options;
        const report = (msg, pct) => { if (typeof onProgress === 'function') onProgress(msg, pct); };
        const yieldThread = () => new Promise(r => setTimeout(r, 16));

        report('📷 1/4: 이미지 디코딩 및 그리드 리사이징 중...', 25);
        await yieldThread();
        const { colors } = await this.imageProcessor.processImageSource(source, targetCols, targetRows);

        report('🎨 2/4: 동적 피부 톤 감지 및 모공 샘플링 중...', 50);
        await yieldThread();

        report('🪒 3/4: 털 영역 비트맵 디프(Diff) 추출 중...', 75);
        await yieldThread();
        const { hairPositions, skinBaseColors } = this.diffEngine.computeHairCoordinates(colors, null, hairThreshold, skinLumThreshold);

        report('✨ 4/4: 아스키(ASCII) 캔버스 파이프라인 합성 중...', 95);
        await yieldThread();
        const { textGrid, colorGrid } = this.asciiConverter.convertToAsciiGrid(colors, targetCols, targetRows);

        report('✅ 스테이지 로드 완료!', 100);
        return validateStageData({
            rows: targetRows,
            cols: targetCols,
            totalHairCount: hairPositions.length,
            hairPositions,
            textGrid,
            colorGrid
        });
    }
}

export class StageSourceRegistry {
    constructor(handlers = []) {
        this.handlers = handlers;
    }

    register(handler) {
        this.handlers.push(handler);
    }

    findHandler(source) {
        return this.handlers.find(h => h.canHandle(source));
    }
}
