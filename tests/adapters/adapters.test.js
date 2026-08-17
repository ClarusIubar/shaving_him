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

test('StaticJsonStageAdapter - default fetch preserves its receiver (no Illegal invocation in real browsers)', async () => {
    // Native fetch requires its receiver to be the global object (window /
    // WorkerGlobalScope). Assigning globalThis.fetch straight to an instance
    // property and calling it as `this.fetch(...)` changes the receiver to
    // the adapter instance, which real browsers reject with
    // "TypeError: Illegal invocation". Node's own fetch doesn't enforce this,
    // which is exactly why this bug went undetected - simulate the
    // enforcement with a stub that checks its receiver.
    const receiverCheckingFetch = function (url) {
        if (this !== globalThis) {
            throw new TypeError('Illegal invocation');
        }
        return Promise.resolve({ ok: true, json: async () => ({ rows: 1, cols: 1, text: ['A'], colors: [] }) });
    };
    const originalFetch = globalThis.fetch;
    globalThis.fetch = receiverCheckingFetch;

    try {
        const adapter = new StaticJsonStageAdapter();
        const stage = await adapter.loadStage('some-other-stage.json');
        assert.equal(stage.rows, 1);
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test('StaticJsonStageAdapter - logs the original error before falling back to window.EMBEDDED_GAME_DATA', async () => {
    const loggedArgs = [];
    const originalConsoleError = console.error;
    console.error = (...args) => { loggedArgs.push(args); };

    global.window = { EMBEDDED_GAME_DATA: { rows: 3, cols: 3, text: ['XYZ'], colors: [] } };
    const boomError = new Error('boom');
    const adapter = new StaticJsonStageAdapter(async () => { throw boomError; });

    try {
        const stage = await adapter.loadStage('some.json');
        assert.equal(stage.rows, 3);
        assert.ok(
            loggedArgs.some(args => args.includes(boomError)),
            'the original fetch error must be logged before the fallback silently replaces it'
        );
    } finally {
        console.error = originalConsoleError;
        delete global.window;
    }
});

test('DeltaDiffEngineAdapter - extracts dark hair positions and calculates skin tone', async () => {
    const { DeltaDiffEngineAdapter } = await import('../../src/adapters/delta-diff-engine.js');
    const engine = new DeltaDiffEngineAdapter();
    assert.equal(typeof engine.calculateAverageSkinTone, 'function');
    const colors = [[[200, 150, 100, 255]], [[10, 10, 10, 255]]];
    const avg = engine.calculateAverageSkinTone(colors, 80);
    assert.deepEqual(avg, [200, 150, 100]);
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
    const { hairPositions } = diffEngine.computeHairCoordinates(originalColors, skinBaseColors, 25);

    assert.equal(hairPositions.length, 1);
    assert.deepEqual(hairPositions[0], { r: 0, c: 1 });
});

test('DeltaDiffEngineAdapter - excludes transparent pixels (alpha < 128) from hair detection', () => {
    // Transparent regions read back as [0,0,0,alpha] from canvas ImageData; without an
    // alpha check they look identical to genuine dark hair pixels (lum 0 vs a bright
    // skin base), so every transparent pixel would otherwise be misdetected as hair.
    const originalColors = [
        [[10, 10, 10, 255], [10, 10, 10, 0]],
        [[10, 10, 10, 0], [10, 10, 10, 0]]
    ];
    const skinBaseColors = [
        [[200, 200, 200, 255], [200, 200, 200, 0]],
        [[200, 200, 200, 0], [200, 200, 200, 0]]
    ];

    const diffEngine = new DeltaDiffEngineAdapter();
    const { hairPositions } = diffEngine.computeHairCoordinates(originalColors, skinBaseColors, 25);

    assert.equal(hairPositions.length, 1);
    assert.deepEqual(hairPositions[0], { r: 0, c: 0 });
});

test('DeltaDiffEngineAdapter - alpha-less (3-channel) input is treated as fully opaque', () => {
    // Preset-stage colors carry no alpha channel at all; the alpha skip must not
    // misfire on them, or every preset hair pixel would silently disappear.
    const originalColors = [
        [[200, 200, 200], [10, 10, 10]],
        [[200, 200, 200], [200, 200, 200]]
    ];
    const skinBaseColors = [
        [[200, 200, 200], [180, 180, 180]],
        [[200, 200, 200], [200, 200, 200]]
    ];

    const diffEngine = new DeltaDiffEngineAdapter();
    const { hairPositions } = diffEngine.computeHairCoordinates(originalColors, skinBaseColors, 25);

    assert.equal(hairPositions.length, 1);
    assert.deepEqual(hairPositions[0], { r: 0, c: 1 });
});

test('DeltaDiffEngineAdapter - dynamic skin-base generation also excludes transparent pixels from hair detection', () => {
    // Same failure mode as above but through the skinBaseColors=null path, where the
    // adapter derives its own skin baseline internally (delta-diff-engine.js:17-25).
    const originalColors = [
        [[10, 10, 10, 255], [200, 180, 160, 255]],
        [[0, 0, 0, 0], [0, 0, 0, 0]]
    ];

    const diffEngine = new DeltaDiffEngineAdapter();
    const { hairPositions } = diffEngine.computeHairCoordinates(originalColors, null, 25, 80);

    assert.equal(hairPositions.length, 1);
    assert.deepEqual(hairPositions[0], { r: 0, c: 0 });
});

test('DeltaDiffEngineAdapter - computeHairCoordinates returns a plain, non-self-referential object on every path', () => {
    // The port declares an Array<{r,c}> return, but the only caller
    // (ImageSourceHandler) destructures { hairPositions, skinBaseColors }.
    // The adapter used to satisfy both by bolting properties onto the
    // array itself, which produced a self-referencing structure on the
    // happy path and a genuinely different (plain-object) shape on the
    // defensive null-input path. Both must return the same plain shape.
    const diffEngine = new DeltaDiffEngineAdapter();

    const originalColors = [
        [[200, 200, 200], [10, 10, 10]],
        [[200, 200, 200], [200, 200, 200]]
    ];
    const skinBaseColors = [
        [[200, 200, 200], [180, 180, 180]],
        [[200, 200, 200], [200, 200, 200]]
    ];

    const normal = diffEngine.computeHairCoordinates(originalColors, skinBaseColors, 25);
    assert.equal(Array.isArray(normal), false);
    assert.notEqual(normal.hairPositions, normal);
    assert.deepEqual(normal.hairPositions, [{ r: 0, c: 1 }]);
    assert.ok(Array.isArray(normal.skinBaseColors));

    const defensive = diffEngine.computeHairCoordinates(null, null);
    assert.equal(Array.isArray(defensive), false);
    assert.deepEqual(Object.keys(defensive).sort(), Object.keys(normal).sort());

    // A circular reference (result.hairPositions === result) would throw here.
    assert.doesNotThrow(() => JSON.stringify(normal));
});

test('CanvasAsciiConverterAdapter - maps color matrix to ASCII grid with custom and default ramp', () => {
    const colors = [
        [[0, 0, 0], [255, 255, 255]]
    ];

    const converterCustom = new CanvasAsciiConverterAdapter(' .@');
    const { textGrid, colorGrid } = converterCustom.convertToAsciiGrid(colors, 2, 1);

    assert.equal(textGrid[0].length, 2);
    assert.equal(textGrid[0][0], ' ');
    assert.equal(textGrid[0][1], '@');
    assert.deepEqual(colorGrid[0][0], [0, 0, 0]);

    // Default ramp
    const converterDefault = new CanvasAsciiConverterAdapter();
    const resDefault = converterDefault.convertToAsciiGrid(colors, 2, 1);
    assert.equal(resDefault.textGrid[0].length, 2);

    // Dimension mismatch errors
    assert.throws(() => converterDefault.convertToAsciiGrid(null, 2, 1), /dimensions/);
    assert.throws(() => converterDefault.convertToAsciiGrid([], 2, 1), /dimensions/);
    assert.throws(() => converterDefault.convertToAsciiGrid([[]], 2, 1), /dimensions/);
    assert.throws(() => converterDefault.convertToAsciiGrid(colors, 5, 5), /dimensions/);
});

test('StagePipeline - computes dynamic average skin tone and loads custom HTMLImageElement source', async () => {
    const { StagePipeline } = await import('../../src/app/stage-pipeline.js');
    const { StaticJsonStageAdapter } = await import('../../src/adapters/static-json-stage.js');
    const { DeltaDiffEngineAdapter } = await import('../../src/adapters/delta-diff-engine.js');
    const { CanvasAsciiConverterAdapter } = await import('../../src/adapters/canvas-ascii-converter.js');
    const diffEngine = new DeltaDiffEngineAdapter();
    // A fake image processor stands in for CanvasImageProcessorAdapter here -
    // this test exercises pipeline wiring, not real canvas decoding, and a
    // fake keeps that independent of whether a DOM canvas is available in
    // this test environment. It returns the same RGBA shape as the real
    // adapter so this test doesn't mask a shape mismatch.
    const fakeImageProcessor = {
        async processImageSource(source, targetWidth, targetHeight) {
            const colors = [];
            for (let y = 0; y < targetHeight; y++) {
                const row = [];
                for (let x = 0; x < targetWidth; x++) row.push([200, 180, 160, 255]);
                colors.push(row);
            }
            return { imageData: { width: targetWidth, height: targetHeight }, colors };
        }
    };
    const pipeline = new StagePipeline(new StaticJsonStageAdapter(), fakeImageProcessor, diffEngine, new CanvasAsciiConverterAdapter());
    const mockColors = [
        [[10, 10, 10], [200, 180, 160]],
        [[220, 200, 180], [10, 10, 10]]
    ];
    // Skin tone is a DiffEngine responsibility (SRP) - the pipeline exposes no pixel operations.
    assert.equal(pipeline.calculateAverageSkinTone, undefined);
    assert.deepEqual(diffEngine.calculateAverageSkinTone(mockColors, 80), [210, 190, 170]);

    // HTMLImageElement custom image load
    global.HTMLImageElement = class {};
    const mockImg = new global.HTMLImageElement();
    mockImg.naturalWidth = 10;
    mockImg.naturalHeight = 10;

    let reportedPct = 0;
    const stage = await pipeline.loadStage(mockImg, 5, 5, {}, (msg, pct) => {
        reportedPct = pct;
    });

    assert.equal(stage.rows, 5);
    assert.equal(stage.cols, 5);
    assert.equal(reportedPct, 100);

    // Unsupported format error guard
    await assert.rejects(() => pipeline.loadStage(12345), /Unsupported stage source format/);

    delete global.HTMLImageElement;
});

test('StagePipeline - ignores transparent pixels (alpha < 128) in skin tone calculation', async () => {
    const { StagePipeline } = await import('../../src/app/stage-pipeline.js');
    const { DeltaDiffEngineAdapter } = await import('../../src/adapters/delta-diff-engine.js');
    const diffEngine = new DeltaDiffEngineAdapter();
    const mockColorsWithAlpha = [
        [[255, 255, 255, 0], [200, 180, 160, 255]], // First pixel is transparent white (alpha=0)
        [[220, 200, 180, 255], [0, 0, 0, 0]]        // Fourth pixel is transparent black (alpha=0)
    ];
    const avgSkin = diffEngine.calculateAverageSkinTone(mockColorsWithAlpha, 80);
    assert.deepEqual(avgSkin, [210, 190, 170]);
});

test('CanvasImageProcessorAdapter - accepts an HTMLImageElement source directly and decodes it via canvas', async () => {
    const { CanvasImageProcessorAdapter } = await import('../../src/adapters/canvas-image-processor.js');
    const processor = new CanvasImageProcessorAdapter();

    global.HTMLImageElement = class {};
    global.document = {
        createElement: (tag) => tag === 'canvas' ? {
            width: 0, height: 0,
            getContext: () => ({
                drawImage: () => {},
                getImageData: (x, y, w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) })
            })
        } : null
    };

    const img = new global.HTMLImageElement();
    img.naturalWidth = 3;
    img.naturalHeight = 3;

    const result = await processor.processImageSource(img, 3, 3);
    assert.equal(result.colors.length, 3);
    assert.equal(result.colors[0].length, 3);

    delete global.document;
    delete global.HTMLImageElement;
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

test('CanvasImageProcessorAdapter - rejects explicitly when no canvas is available, instead of returning fabricated data', async () => {
    const { CanvasImageProcessorAdapter } = await import('../../src/adapters/canvas-image-processor.js');
    const processor = new CanvasImageProcessorAdapter();

    // No global.document here - production code must fail loudly, not fall
    // back to a fabricated single-color stage that hides the real cause
    // (e.g. a canvas 2D context genuinely unavailable in the browser).
    await assert.rejects(
        () => processor.processImageSource({ naturalWidth: 5, naturalHeight: 5, src: 'x' }, 5, 5),
        /캔버스/
    );
});

test('CanvasImageProcessorAdapter - rejects explicitly when a 2D context cannot be obtained', async () => {
    const { CanvasImageProcessorAdapter } = await import('../../src/adapters/canvas-image-processor.js');
    const processor = new CanvasImageProcessorAdapter();

    global.document = {
        createElement: () => ({ width: 0, height: 0, getContext: () => null })
    };
    await assert.rejects(
        () => processor.processImageSource({ naturalWidth: 5, naturalHeight: 5, src: 'x' }, 5, 5),
        /캔버스/
    );
    delete global.document;
});

test('CanvasRenderer - provides exportPng method for PNG snapshot download', async () => {
    const { CanvasRenderer } = await import('../../src/ui/canvas-renderer.js');
    let dataUrlCalled = false;
    const mockCanvas = {
        width: 100, height: 100,
        style: {},
        getContext: () => ({ scale: () => {}, fillRect: () => {}, fillText: () => {} }),
        toDataURL: (type) => {
            dataUrlCalled = true;
            return `data:${type};base64,mockdata`;
        }
    };
    const renderer = new CanvasRenderer(mockCanvas, 10, 10);
    assert.equal(typeof renderer.exportPng, 'function');
    
    renderer.exportPng('test.png'); // Triggers exportPng gracefully without DOM errors in Node
});

test('StaticJsonStageAdapter - handles fetch status non-ok and falls back to window.EMBEDDED_GAME_DATA', async () => {
    const adapter = new StaticJsonStageAdapter(async (url) => {
        return { ok: false, status: 404 };
    });

    global.window = { EMBEDDED_GAME_DATA: { rows: 1, cols: 1, text: ['X'], colors: [] } };
    const stage = await adapter.loadStage('nonexistent.json');
    assert.equal(stage.rows, 1);
    assert.equal(stage.textGrid[0], 'X');
    delete global.window;
});

test('CanvasRenderer - renders full grid and partial dirty region with particles', async () => {
    const { CanvasRenderer } = await import('../../src/ui/canvas-renderer.js');
    let fillTextCount = 0;
    const mockCanvas = {
        width: 20, height: 20,
        style: {},
        getContext: () => ({
            scale: () => {},
            fillRect: () => {},
            fillText: () => { fillTextCount++; }
        })
    };

    const renderer = new CanvasRenderer(mockCanvas, 2, 2);
    const mockStage = {
        cols: 2, rows: 2,
        textGrid: ['AB', 'CD'],
        colorGrid: [[ [255, 255, 255], [0, 0, 0] ], [ [100, 100, 100], [200, 200, 200] ]]
    };
    const mockHairSet = { has: (r, c) => r === 0 && c === 1 };

    // Full render
    renderer.render(mockStage, mockHairSet, null);
    assert.ok(fillTextCount >= 4);

    // Dirty partial render
    fillTextCount = 0;
    renderer.render(mockStage, mockHairSet, [{ r: 0, c: 1 }]);
    assert.ok(fillTextCount >= 1);

    // Test requestRender batching
    global.requestAnimationFrame = (cb) => { cb(); return 1; };
    renderer.requestRender(mockStage, mockHairSet, [{ r: 0, c: 0 }]);
    delete global.requestAnimationFrame;
});

test('Abstract Ports - throw unfulfilled contract errors', async () => {
    const { ImageProcessorPort } = await import('../../src/ports/image-processor.port.js');
    const { DiffEnginePort } = await import('../../src/ports/diff-engine.port.js');
    const { AsciiConverterPort } = await import('../../src/ports/ascii-converter.port.js');

    const imgPort = new ImageProcessorPort();
    await assert.rejects(() => imgPort.processImageSource(null), /not implemented/);

    const diffPort = new DiffEnginePort();
    assert.throws(() => diffPort.computeHairCoordinates(null, null), /not implemented/);
    assert.throws(() => diffPort.calculateAverageSkinTone(null), /not implemented/);

    const asciiPort = new AsciiConverterPort();
    assert.throws(() => asciiPort.convertToAsciiGrid(null), /not implemented/);
});

test('CanvasImageProcessorAdapter - tests skin smoothing and image loading error guards', async () => {
    const { CanvasImageProcessorAdapter } = await import('../../src/adapters/canvas-image-processor.js');
    const processor = new CanvasImageProcessorAdapter();

    // Invalid source type
    await assert.rejects(() => processor.processImageSource(123), /Invalid image source type/);

    // Mock ImageData skin smoothing
    // loadImageFile file null guard
    await assert.rejects(() => processor.loadImageFile(null), /파일이 지정되지 않았습니다/);

    // FileReader mock
    class MockFileReader {
        readAsDataURL() {
            setTimeout(() => { if (this.onload) this.onload({ target: { result: 'data:image/png;base64,mock' } }); }, 5);
        }
    }
    class MockFile {}
    class MockImage {
        constructor() {
            setTimeout(() => {
                this.naturalWidth = 10;
                this.naturalHeight = 10;
                if (this.onload) this.onload();
            }, 5);
        }
    }

    global.FileReader = MockFileReader;
    global.File = MockFile;
    global.Image = MockImage;

    const loadedImg = await processor.loadImageFile(new MockFile());
    assert.equal(loadedImg.naturalWidth, 10);

    // Canvas 2D ImageData processing branch with File instance (line 20)
    global.document = {
        createElement: (tag) => {
            if (tag === 'canvas') {
                return {
                    width: 0, height: 0,
                    getContext: () => ({
                        drawImage: () => {},
                        getImageData: (x, y, w, h) => ({
                            width: w, height: h,
                            data: new Uint8ClampedArray(w * h * 4)
                        })
                    })
                };
            }
            return null;
        }
    };
    const imgObj = new MockFile();
    imgObj.naturalWidth = 4;
    imgObj.naturalHeight = 4;

    const procRes = await processor.processImageSource(imgObj, 4, 4);
    assert.equal(procRes.colors.length, 4);

    delete global.document;
    delete global.FileReader;
    delete global.File;
    delete global.Image;
});

test('StaticJsonStageAdapter - window.EMBEDDED_GAME_DATA priority 1 line 19 execution and error branches', async () => {
    const adapter = new StaticJsonStageAdapter();
    global.window = { EMBEDDED_GAME_DATA: { rows: 2, cols: 2, text: ['HI'], colors: [], hairCount: 1 } };
    const stage = await adapter.loadStage('game_data.json');
    assert.equal(stage.rows, 2);

    const stage2 = await adapter.loadStage('game_data.js');
    assert.equal(stage2.cols, 2);

    const stage3 = await adapter.loadStage('');
    assert.equal(stage3.totalHairCount, 1);

    delete global.window;

    // Fetch non-ok without window.EMBEDDED_GAME_DATA -> throws
    const adapterErr = new StaticJsonStageAdapter(async () => ({ ok: false, status: 500 }));
    await assert.rejects(() => adapterErr.loadStage('fail.json'), /Fetch failed: 500/);

    // Fetch network throw without window.EMBEDDED_GAME_DATA -> re-throws
    const adapterNetErr = new StaticJsonStageAdapter(async () => { throw new Error('Network error'); });
    await assert.rejects(() => adapterNetErr.loadStage('fail.json'), /Network error/);
});

test('CanvasImageProcessorAdapter - tests FileReader onerror, Image onerror, and Image undefined fallback', async () => {
    const { CanvasImageProcessorAdapter } = await import('../../src/adapters/canvas-image-processor.js');
    const processor = new CanvasImageProcessorAdapter();

    // Test FileReader onerror
    global.FileReader = class {
        readAsDataURL() {
            setTimeout(() => { if (this.onerror) this.onerror(); }, 5);
        }
    };
    global.File = class {};
    await assert.rejects(() => processor.loadImageFile(new global.File()), /파일 읽기 과정에서 오류가 발생했습니다/);

    // Test Image onerror
    global.FileReader = class {
        readAsDataURL() {
            setTimeout(() => { if (this.onload) this.onload({ target: { result: 'data:image/png;base64,mock' } }); }, 5);
        }
    };
    global.Image = class {
        constructor() {
            setTimeout(() => { if (this.onerror) this.onerror(); }, 5);
        }
    };
    await assert.rejects(() => processor.loadImageFile(new global.File()), /유효하지 않거나 손상된 이미지 파일입니다/);

    // Test Image zero dimension error
    global.Image = class {
        constructor() {
            setTimeout(() => {
                this.naturalWidth = 0;
                this.naturalHeight = 0;
                if (this.onload) this.onload();
            }, 5);
        }
    };
    await assert.rejects(() => processor.loadImageFile(new global.File()), /이미지 크기가 0px이거나 손상된 파일입니다/);

    // Test Image undefined
    delete global.Image;
    const resNoImg = await processor.loadImageFile(new global.File());
    assert.deepEqual(resNoImg, {});

    delete global.FileReader;
    delete global.File;
});

test('CanvasRenderer - tests resize setupCanvas, empty cell background fill, particle decay limit, and exportPng exception handling', async () => {
    const { CanvasRenderer } = await import('../../src/ui/canvas-renderer.js');
    const mockCanvas = {
        width: 10, height: 10, style: {},
        getContext: () => ({ scale: () => {}, fillRect: () => {}, fillText: () => {} }),
        toDataURL: () => { throw new Error('Canvas security error'); }
    };
    const renderer = new CanvasRenderer(mockCanvas, 2, 2);

    let rafCb = null;
    global.requestAnimationFrame = (cb) => { rafCb = cb; return 1; };

    let capturedDirty = undefined;
    renderer.render = (sd, hg, dirty) => { capturedDirty = dirty; };

    const newStage = { cols: 10, rows: 10, textGrid: ['          '], colorGrid: null };
    renderer.requestRender(newStage, null, null); // Full redraw requested (needsFullRedraw = true)
    renderer.requestRender(newStage, null, [{ r: 1, c: 1 }]); // Partial dirty cell request in same frame

    // Execute rAF callback
    rafCb();
    assert.equal(capturedDirty, null, 'Full redraw signal (null) must NOT be overwritten by subsequent dirty cells before rAF');

    const resizeStage = { cols: 5, rows: 5, textGrid: ['     ', '     ', '     ', '     ', '     '], colorGrid: null };
    renderer.render(resizeStage, null, null);

    // Particle cap > 40 (lines 158-159) and decay <= 0 (lines 174-176)
    renderer.particles = new Array(39).fill({ x: 0, y: 0, vx: 0, vy: 0, life: 1, decay: 0.1, char: '*' });
    const dirty50 = [{ r: 0, c: 0 }, { r: 1, c: 1 }, { r: 2, c: 2 }];
    renderer.spawnParticles(dirty50);
    assert.ok(renderer.particles.length <= 40);

    renderer.particles.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0.05, decay: 0.1, char: '*' });
    renderer.updateAndRenderParticles(); // Triggers particle splice (life <= 0)

    // Empty cell background fill
    renderer.renderSingleCell(0, 0, [' '], null, null);

    // exportPng error catch block
    global.document = { body: { appendChild: () => {} } };
    renderer.exportPng();
    delete global.document;
    delete global.requestAnimationFrame;
});

test('CanvasImageProcessorAdapter - tests FileReader undefined error', async () => {
    const { CanvasImageProcessorAdapter } = await import('../../src/adapters/canvas-image-processor.js');
    const processor = new CanvasImageProcessorAdapter();
    const origFileReader = global.FileReader;
    delete global.FileReader;
    global.File = class {};
    await assert.rejects(() => processor.loadImageFile(new global.File()), /FileReader API가 지원되지 않는 환경입니다/);
    delete global.File;
    global.FileReader = origFileReader;
});
