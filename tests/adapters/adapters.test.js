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

test('StagePipeline - computes dynamic average skin tone and loads custom HTMLImageElement source', async () => {
    const { StagePipeline } = await import('../../src/app/stage-pipeline.js');
    const pipeline = new StagePipeline();
    const mockColors = [
        [[10, 10, 10], [200, 180, 160]],
        [[220, 200, 180], [10, 10, 10]]
    ];
    const avgSkin = pipeline.calculateAverageSkinTone(mockColors, 80);
    assert.deepEqual(avgSkin, [210, 190, 170]);

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
    const { AsciiConverterPort } = await import('../../src/ports/ascii-converter.port.js');
    const { DiffEnginePort } = await import('../../src/ports/diff-engine.port.js');
    const { ImageProcessorPort } = await import('../../src/ports/image-processor.port.js');

    const asciiPort = new AsciiConverterPort();
    assert.throws(() => asciiPort.convertToAsciiGrid(), /not implemented/);

    const diffPort = new DiffEnginePort();
    assert.throws(() => diffPort.computeHairCoordinates(), /not implemented/);

    const imgPort = new ImageProcessorPort();
    await assert.rejects(() => imgPort.processImageSource(), /not implemented/);
    assert.throws(() => imgPort.processSkinSmoothing(), /not implemented/);
});

test('CanvasImageProcessorAdapter - tests skin smoothing and image loading error guards', async () => {
    const { CanvasImageProcessorAdapter } = await import('../../src/adapters/canvas-image-processor.js');
    const processor = new CanvasImageProcessorAdapter();

    // Invalid source type
    await assert.rejects(() => processor.processImageSource(123), /Invalid image source type/);

    // Mock ImageData skin smoothing
    const mockData = {
        width: 3, height: 3,
        data: new Uint8ClampedArray([
            200, 180, 160, 255,   200, 180, 160, 255,   200, 180, 160, 255,
            200, 180, 160, 255,    10,  10,  10, 255,   200, 180, 160, 255,
            200, 180, 160, 255,   200, 180, 160, 255,   200, 180, 160, 255
        ])
    };
    const smoothed = processor.processSkinSmoothing(mockData, 80);
    assert.ok(smoothed.data[12] > 50);

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

test('StaticJsonStageAdapter - window.EMBEDDED_GAME_DATA priority 1 line 19 execution', async () => {
    const adapter = new StaticJsonStageAdapter();
    global.window = { EMBEDDED_GAME_DATA: { rows: 2, cols: 2, text: ['HI'], colors: [] } };
    const stage = await adapter.loadStage('game_data.json');
    assert.equal(stage.rows, 2);
    delete global.window;
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

    global.requestAnimationFrame = (cb) => { cb(); return 1; };

    // Dynamic dimension resize in requestRender & render (lines 77-80)
    const newStage = { cols: 10, rows: 10, textGrid: ['          '], colorGrid: null };
    renderer.requestRender(newStage, null, null);

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
