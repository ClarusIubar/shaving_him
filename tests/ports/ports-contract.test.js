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

test('LSP Signature Contract Suite - Adapters fulfill abstract Port method signatures and return contracts', async () => {
    // Every assertion below exercises the real method and inspects what it
    // actually returns. `fn.length` (leading-parameter count) proves nothing
    // about a return value - it stays green even if a method starts
    // returning a self-referencing array instead of the documented object.

    // 1. DiffEnginePort
    const diffEngine = new DeltaDiffEngineAdapter();
    assert.ok(diffEngine instanceof DiffEnginePort);

    const diffResult = diffEngine.computeHairCoordinates(
        [[[10, 10, 10, 255], [200, 180, 160, 255]]],
        null,
        25,
        80
    );
    assert.equal(Array.isArray(diffResult), false, 'computeHairCoordinates must return a plain object, not an array');
    assert.ok(Array.isArray(diffResult.hairPositions));
    assert.ok(Array.isArray(diffResult.skinBaseColors));

    const skinTone = diffEngine.calculateAverageSkinTone([[[200, 200, 200, 255]]], 80);
    assert.ok(Array.isArray(skinTone));
    assert.equal(skinTone.length, 3);

    // 2. ImageProcessorPort
    const imgProcessor = new CanvasImageProcessorAdapter();
    assert.ok(imgProcessor instanceof ImageProcessorPort);

    const imgResult = await imgProcessor.processImageSource({ naturalWidth: 2, naturalHeight: 1, src: 'x' }, 2, 1);
    assert.ok(Array.isArray(imgResult.colors));
    assert.equal(imgResult.colors.length, 1);
    assert.equal(imgResult.colors[0].length, 2);

    // 3. AsciiConverterPort
    const asciiConverter = new CanvasAsciiConverterAdapter();
    assert.ok(asciiConverter instanceof AsciiConverterPort);

    const asciiColors = [[[0, 0, 0], [255, 255, 255]]];
    const asciiResult = asciiConverter.convertToAsciiGrid(asciiColors, 2, 1);
    assert.equal(asciiResult.textGrid.length, 1);
    assert.equal(asciiResult.textGrid[0].length, 2);
    assert.ok(Array.isArray(asciiResult.colorGrid));

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

test('DiffEnginePort - declares the skinLumThreshold parameter the adapter actually uses', () => {
    // The adapter accepts a 4th parameter (skinLumThreshold) that the port's
    // documented signature omitted entirely. A caller who only read the port
    // contract had no way to know it existed, even though it changes results.
    const diffEngine = new DeltaDiffEngineAdapter();
    const originalColors = [[[90, 90, 90, 255], [90, 90, 90, 255]]];

    // Low threshold: the row's own brightness (90) qualifies as "skin", so it
    // becomes its own baseline and nothing looks like hair.
    const lowThreshold = diffEngine.computeHairCoordinates(originalColors, null, 25, 10);
    // High threshold: the same row is judged too dark to be skin, so the
    // baseline falls back to the brighter global average - which now differs
    // enough from the original to register as hair.
    const highThreshold = diffEngine.computeHairCoordinates(originalColors, null, 25, 200);

    assert.notDeepEqual(lowThreshold.hairPositions, highThreshold.hairPositions);
});

test('AsciiConverterPort - convertToAsciiGrid honors the targetCols/targetRows the port declares', () => {
    // The port declares (colors, targetCols, targetRows), but the adapter
    // used to accept only `colors` and silently ignore the other two -
    // it happened to work only because CanvasImageProcessorAdapter always
    // hands back colors already sized to the target. A caller that builds
    // colors from a different source with mismatched dimensions must be
    // told loudly, not handed a textGrid whose size the caller can't predict
    // from the parameters they passed.
    const converter = new CanvasAsciiConverterAdapter(' .@');
    const colors = [[[0, 0, 0], [255, 255, 255]]]; // 1 row x 2 cols

    const result = converter.convertToAsciiGrid(colors, 2, 1);
    assert.equal(result.textGrid.length, 1);
    assert.equal(result.textGrid[0].length, 2);

    assert.throws(() => converter.convertToAsciiGrid(colors, 999, 999), /dimension/i);
});
