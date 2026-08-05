import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { DiffEnginePort } from '../../src/ports/diff-engine.port.js';
import { ImageProcessorPort } from '../../src/ports/image-processor.port.js';
import { AsciiConverterPort } from '../../src/ports/ascii-converter.port.js';
import { StageSourcePort } from '../../src/ports/stage-source.port.js';

import { DeltaDiffEngineAdapter } from '../../src/adapters/delta-diff-engine.js';
import { CanvasImageProcessorAdapter } from '../../src/adapters/canvas-image-processor.js';
import { CanvasAsciiConverterAdapter } from '../../src/adapters/canvas-ascii-converter.js';
import { StaticJsonStageAdapter } from '../../src/adapters/static-json-stage.js';
import { JsonSourceHandler, ImageSourceHandler } from '../../src/app/stage-source-handlers.js';

test('DIP Compliance - StagePipeline imports 0 concrete adapters from ../adapters/', () => {
    const pipelinePath = path.resolve('src/app/stage-pipeline.js');
    const content = fs.readFileSync(pipelinePath, 'utf8');

    const adapterImports = (content.match(/from\s+['"]\.\.\/adapters\/[^'"]+['"]/g) || []);
    assert.equal(adapterImports.length, 0, `StagePipeline must NOT import concrete adapters directly! Found: ${adapterImports.join(', ')}`);
});

test('Abstract Ports - throw unfulfilled contract errors for all default implementations', async () => {
    const diffPort = new DiffEnginePort();
    assert.throws(() => diffPort.computeHairCoordinates(null, null), /not implemented/);
    assert.throws(() => diffPort.calculateAverageSkinTone(null), /not implemented/);

    const imgPort = new ImageProcessorPort();
    await assert.rejects(() => imgPort.processImageSource(null), /not implemented/);

    const asciiPort = new AsciiConverterPort();
    assert.throws(() => asciiPort.convertToAsciiGrid(null), /not implemented/);

    const stagePort = new StageSourcePort();
    assert.throws(() => stagePort.canHandle(null), /not implemented/);
    await assert.rejects(() => stagePort.loadStage(null, 10, 10), /not implemented/);
});

test('LSP Signature Contract Suite - Adapters fulfill abstract Port method signatures and return contracts', () => {
    // 1. DiffEnginePort
    const diffEngine = new DeltaDiffEngineAdapter();
    assert.ok(diffEngine instanceof DiffEnginePort);
    assert.equal(typeof diffEngine.computeHairCoordinates, 'function');
    assert.equal(diffEngine.computeHairCoordinates.length, 1); // (originalColors, skinBaseColors = null, threshold = 25)
    assert.equal(typeof diffEngine.calculateAverageSkinTone, 'function');
    assert.equal(diffEngine.calculateAverageSkinTone.length, 1);

    // 2. ImageProcessorPort
    const imgProcessor = new CanvasImageProcessorAdapter();
    assert.ok(imgProcessor instanceof ImageProcessorPort);
    assert.equal(typeof imgProcessor.processImageSource, 'function');
    assert.equal(imgProcessor.processImageSource.length, 1); // (source, targetWidth, targetHeight)

    // 3. AsciiConverterPort
    const asciiConverter = new CanvasAsciiConverterAdapter();
    assert.ok(asciiConverter instanceof AsciiConverterPort);
    assert.equal(typeof asciiConverter.convertToAsciiGrid, 'function');
    assert.equal(asciiConverter.convertToAsciiGrid.length, 1); // (colors, targetCols, targetRows)

    // 4. StageSourcePort strategies
    const jsonHandler = new JsonSourceHandler(new StaticJsonStageAdapter());
    assert.ok(jsonHandler instanceof StageSourcePort);
    assert.equal(typeof jsonHandler.canHandle, 'function');
    assert.equal(typeof jsonHandler.loadStage, 'function');

    const imageHandler = new ImageSourceHandler(imgProcessor, diffEngine, asciiConverter);
    assert.ok(imageHandler instanceof StageSourcePort);
    assert.equal(typeof imageHandler.canHandle, 'function');
    assert.equal(typeof imageHandler.loadStage, 'function');
});
