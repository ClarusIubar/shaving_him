import test from 'node:test';
import assert from 'node:assert/strict';

import { StagePipeline } from '../../src/app/stage-pipeline.js';
import {
    JsonSourceHandler,
    ImageSourceHandler,
    StageSourceRegistry
} from '../../src/app/stage-source-handlers.js';

test('StagePipeline - loads JSON stage and Image stage via registered handlers', async () => {
    const jsonAdapter = {
        loadStage: async (source) => ({
            cols: 10,
            rows: 10,
            totalHairCount: 1,
            hairPositions: [{ r: 2, c: 2 }],
            textGrid: []
        })
    };

    const imageProcessor = {
        processImageSource: async (src, cols, rows) => ({
            colors: []
        })
    };

    const diffEngine = {
        computeHairCoordinates: () => ({
            hairPositions: [{ r: 1, c: 1 }],
            skinBaseColors: []
        })
    };

    const asciiConverter = {
        convertToAsciiGrid: () => ({
            textGrid: [],
            colorGrid: []
        })
    };

    const pipeline = new StagePipeline(jsonAdapter, imageProcessor, diffEngine, asciiConverter);

    // Test JSON stage source
    let progressCount = 0;
    const stage1 = await pipeline.loadStage('preset1.json', 10, 10, {}, (msg, pct) => {
        progressCount++;
    });
    assert.equal(stage1.cols, 10);
    assert.equal(stage1.totalHairCount, 1);
    assert.ok(progressCount > 0);

    // Test Image source handler directly with mock
    const imgHandler = new ImageSourceHandler(imageProcessor, diffEngine, asciiConverter);
    const mockFile = { name: 'photo.jpg' };
    const stage2 = await imgHandler.loadStage(mockFile, 10, 10, {}, (msg, pct) => {});
    assert.equal(stage2.cols, 10);
    assert.equal(stage2.totalHairCount, 1);
});

test('StagePipeline / StageSourceRegistry - error guards and unsupported sources', async () => {
    // Missing dependencies
    assert.throws(() => new StagePipeline(), /StagePipeline requires/);
    assert.throws(() => new JsonSourceHandler(null), /JsonSourceHandler requires/);
    assert.throws(() => new ImageSourceHandler(null, null, null), /ImageSourceHandler requires/);
    assert.throws(() => new ImageSourceHandler({ processImageSource: () => {} }, null, null), /ImageSourceHandler requires/);
    assert.throws(() => new ImageSourceHandler({ processImageSource: () => {} }, { computeHairCoordinates: () => {} }, null), /ImageSourceHandler requires/);

    const registry = new StageSourceRegistry();
    const pipeline = new StagePipeline(null, null, null, null, registry);

    await assert.rejects(async () => {
        await pipeline.loadStage(12345);
    }, /Unsupported stage source format/);

    // Custom handler registration
    const dummyHandler = {
        canHandle: (s) => s === 'custom-key',
        loadStage: async () => ({
            cols: 5,
            rows: 5,
            totalHairCount: 0,
            hairPositions: [],
            textGrid: []
        })
    };
    registry.register(dummyHandler);
    const customStage = await pipeline.loadStage('custom-key');
    assert.equal(customStage.cols, 5);
});
