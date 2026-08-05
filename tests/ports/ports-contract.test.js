import test from 'node:test';
import assert from 'node:assert/strict';

import { createCompositionRoot } from '../../src/app/composition-root.js';
import { ImageProcessorPort } from '../../src/ports/image-processor.port.js';
import { DiffEnginePort } from '../../src/ports/diff-engine.port.js';
import { AsciiConverterPort } from '../../src/ports/ascii-converter.port.js';

import { StaticJsonStageAdapter } from '../../src/adapters/static-json-stage.js';
import { CanvasImageProcessorAdapter } from '../../src/adapters/canvas-image-processor.js';
import { DeltaDiffEngineAdapter } from '../../src/adapters/delta-diff-engine.js';
import { CanvasAsciiConverterAdapter } from '../../src/adapters/canvas-ascii-converter.js';

test('CompositionRoot - builds StagePipeline with fully injected adapter dependencies', () => {
    const root = createCompositionRoot();
    assert.ok(root !== null);
    assert.ok(root.stagePipeline !== undefined);
    assert.ok(root.jsonAdapter instanceof StaticJsonStageAdapter);
    assert.ok(root.imageProcessor instanceof ImageProcessorPort || root.imageProcessor instanceof CanvasImageProcessorAdapter);
    assert.ok(root.diffEngine instanceof DiffEnginePort || root.diffEngine instanceof DeltaDiffEngineAdapter);
    assert.ok(root.asciiConverter instanceof AsciiConverterPort || root.asciiConverter instanceof CanvasAsciiConverterAdapter);
});

test('LSP Contract Suite - Adapters fulfill abstract Port interface contracts', async () => {
    const jsonAdapter = new StaticJsonStageAdapter();
    assert.equal(typeof jsonAdapter.loadStage, 'function');

    const imageProcessor = new CanvasImageProcessorAdapter();
    assert.ok(imageProcessor instanceof ImageProcessorPort);
    assert.equal(typeof imageProcessor.processImageSource, 'function');
    assert.equal(typeof imageProcessor.processSkinSmoothing, 'function');

    const diffEngine = new DeltaDiffEngineAdapter();
    assert.ok(diffEngine instanceof DiffEnginePort);
    assert.equal(typeof diffEngine.computeHairCoordinates, 'function');

    const asciiConverter = new CanvasAsciiConverterAdapter();
    assert.ok(asciiConverter instanceof AsciiConverterPort);
    assert.equal(typeof asciiConverter.convertToAsciiGrid, 'function');
});
