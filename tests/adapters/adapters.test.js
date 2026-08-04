import test from 'node:test';
import assert from 'node:assert/strict';

import { StaticJsonStageAdapter } from '../../src/adapters/static-json-stage.js';
import { DeltaDiffEngineAdapter } from '../../src/adapters/delta-diff-engine.js';
import { CanvasAsciiConverterAdapter } from '../../src/adapters/canvas-ascii-converter.js';

test('StaticJsonStageAdapter - parses raw JSON into StageDataDTO', async () => {
    const mockJson = {
        rows: 2,
        cols: 2,
        hair: [{ r: 0, c: 1 }],
        text: ['AB', 'CD'],
        colors: [
            [[255, 255, 255], [0, 0, 0]],
            [[100, 100, 100], [200, 200, 200]]
        ]
    };

    const adapter = new StaticJsonStageAdapter();
    const stageDTO = await adapter.loadStage(mockJson);

    assert.equal(stageDTO.rows, 2);
    assert.equal(stageDTO.cols, 2);
    assert.equal(stageDTO.totalHairCount, 1);
    assert.deepEqual(stageDTO.hairPositions, [{ r: 0, c: 1 }]);
    assert.equal(stageDTO.textGrid.length, 2);
});

test('DeltaDiffEngineAdapter - extracts dark hair positions', () => {
    const originalColors = [
        [[200, 200, 200], [10, 10, 10]],
        [[200, 200, 200], [200, 200, 200]]
    ];

    const skinBaseColors = [
        [[200, 200, 200], [180, 180, 180]],
        [[200, 200, 200], [200, 200, 200]]
    ];

    const diffEngine = new DeltaDiffEngineAdapter();
    const hairPositions = diffEngine.computeHairCoordinates(originalColors, skinBaseColors, 25);

    assert.equal(hairPositions.length, 1);
    assert.deepEqual(hairPositions[0], { r: 0, c: 1 });
});

test('CanvasAsciiConverterAdapter - maps color matrix to ASCII grid', () => {
    const colors = [
        [[0, 0, 0], [255, 255, 255]]
    ];

    const converter = new CanvasAsciiConverterAdapter(' .@');
    const { textGrid, colorGrid } = converter.convertToAsciiGrid(colors);

    assert.equal(textGrid[0].length, 2);
    assert.equal(textGrid[0][0], ' ');
    assert.equal(textGrid[0][1], '@');
    assert.deepEqual(colorGrid[0][0], [0, 0, 0]);
});

test('StagePipeline - computes dynamic average skin tone correctly', async () => {
    const { StagePipeline } = await import('../../src/app/stage-pipeline.js');
    const pipeline = new StagePipeline();
    const mockColors = [
        [[10, 10, 10], [200, 180, 160]],
        [[220, 200, 180], [10, 10, 10]]
    ];
    const avgSkin = pipeline.calculateAverageSkinTone(mockColors, 80);
    assert.deepEqual(avgSkin, [210, 190, 170]);
});

test('StagePipeline - ignores transparent pixels (alpha < 128) in skin tone calculation', async () => {
    const { StagePipeline } = await import('../../src/app/stage-pipeline.js');
    const pipeline = new StagePipeline();
    const mockColorsWithAlpha = [
        [[255, 255, 255, 0], [200, 180, 160, 255]], // First pixel is transparent white (alpha=0)
        [[220, 200, 180, 255], [0, 0, 0, 0]]        // Fourth pixel is transparent black (alpha=0)
    ];
    const avgSkin = pipeline.calculateAverageSkinTone(mockColorsWithAlpha, 80);
    assert.deepEqual(avgSkin, [210, 190, 170]);
});

test('CanvasImageProcessorAdapter - rejects zero dimension or invalid image sources', async () => {
    const { CanvasImageProcessorAdapter } = await import('../../src/adapters/canvas-image-processor.js');
    const adapter = new CanvasImageProcessorAdapter();
    
    // Zero dimension mock image
    const zeroDimImg = { naturalWidth: 0, naturalHeight: 0 };
    await assert.rejects(
        () => adapter.processImageSource(zeroDimImg),
        { message: '이미지 해상도를 읽을 수 없습니다.' }
    );
});
