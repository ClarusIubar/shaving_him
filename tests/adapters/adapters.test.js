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
