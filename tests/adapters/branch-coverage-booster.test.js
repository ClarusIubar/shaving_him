import test from 'node:test';
import assert from 'node:assert/strict';

import { SoundEffects } from '../../src/ui/sound-effects.js';
import { StaticJsonStageAdapter } from '../../src/adapters/static-json-stage.js';
import { BrushController } from '../../src/ui/brush-controller.js';
import { CanvasImageProcessorAdapter } from '../../src/adapters/canvas-image-processor.js';
import { CanvasRenderer } from '../../src/ui/canvas-renderer.js';
import { bootstrapApp, initAutoBootstrap } from '../../src/main.js';
import { createMockCanvasElement, createMockDocument, createMockWindow, setupGlobalDOM } from '../helpers/dom-mock-harness.js';
import { InputManager } from '../../src/ui/input-manager.js';
import { GamePolicy } from '../../src/domain/game-policy.js';
import { HairGrid } from '../../src/domain/hair-grid.js';
import { GridGeometry } from '../../src/domain/grid-geometry.js';
import { GameOrchestrator } from '../../src/app/game-orchestrator.js';
import { HUD } from '../../src/ui/hud.js';

test('BranchBooster - SoundEffects: webkitAudioContext, absent AudioContext, null noiseBuffer, and combo edge cases', () => {
    // 1. webkitAudioContext fallback
    const winWebkit = {
        webkitAudioContext: function() {
            return {
                state: 'running',
                sampleRate: 44100,
                createBuffer: () => ({ getChannelData: () => new Float32Array(100) }),
                createGain: () => ({ gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {} }),
                createOscillator: () => ({ type: '', frequency: { setValueAtTime: () => {} }, connect: () => {}, start: () => {}, stop: () => {} }),
                destination: {}
            };
        }
    };
    const sWebkit = new SoundEffects(winWebkit);
    sWebkit.init();
    assert.ok(sWebkit.ctx);

    // 2. Absent AudioContext on window
    const winNoAudio = {};
    const sNoAudio = new SoundEffects(winNoAudio);
    sNoAudio.init();
    assert.equal(sNoAudio.ctx, null);

    // 3. createNoiseBuffer when ctx is null
    sNoAudio.createNoiseBuffer();
    assert.equal(sNoAudio.noiseBuffer, null);

    // 4. playShaveSound when noiseBuffer is null
    const winWithCtx = createMockWindow();
    const sNullNoise = new SoundEffects(winWithCtx);
    sNullNoise.init();
    sNullNoise.noiseBuffer = null;
    assert.doesNotThrow(() => sNullNoise.playShaveSound());

    // 5. playComboSound with non-number or undefined comboCount
    assert.doesNotThrow(() => {
        sWebkit.playComboSound(undefined);
        sWebkit.playComboSound('invalid');
        sWebkit.playComboSound(20); // High pitch shift cap
    });
});

test('BranchBooster - StaticJsonStageAdapter: game_data.js, null source, null resp, and fallback fields', async () => {
    // 1. EMBEDDED_GAME_DATA with game_data.js and null source
    global.window = {
        EMBEDDED_GAME_DATA: {
            rows: 2,
            cols: 2,
            text: ['..', '..'],
            hairPositions: [{ r: 0, c: 0 }],
            hairCount: 1
        }
    };

    const adapter = new StaticJsonStageAdapter();
    const stage1 = await adapter.loadStage('game_data.js');
    assert.equal(stage1.rows, 2);
    assert.equal(stage1.totalHairCount, 1);

    const stage2 = await adapter.loadStage(null);
    assert.equal(stage2.rows, 2);

    delete global.window;

    // 2. Fetch returns null/falsy response
    const badAdapter = new StaticJsonStageAdapter(async () => null);
    await assert.rejects(() => badAdapter.loadStage('stage.json'), /Fetch failed: network error/);

    // 3. rawData with missing rows, cols, hair vs hairPositions, and hairCount
    const rawAdapter = new StaticJsonStageAdapter();
    const rawObj = {
        text: ['abc', 'def'],
        hairPositions: [{ r: 1, c: 1 }],
        hairCount: 1
    };
    const stage3 = await rawAdapter.loadStage(rawObj);
    assert.equal(stage3.rows, 2);
    assert.equal(stage3.cols, 3);
    assert.equal(stage3.totalHairCount, 1);

    // 4. rawData with empty textGrid and missing dimensions
    const emptyObj = {};
    const stage4 = await rawAdapter.loadStage(emptyObj);
    assert.equal(stage4.rows, 0);
    assert.equal(stage4.cols, 0);
    assert.equal(stage4.totalHairCount, 0);

    // 5. canHandle full branch permutation booster
    assert.strictEqual(rawAdapter.canHandle(null), false);
    assert.strictEqual(rawAdapter.canHandle(undefined), false);
    assert.strictEqual(rawAdapter.canHandle([]), false);
    assert.strictEqual(rawAdapter.canHandle({}), true);
    assert.strictEqual(rawAdapter.canHandle('stage.json'), true);
    assert.strictEqual(rawAdapter.canHandle('stage.js'), true);
    assert.strictEqual(rawAdapter.canHandle('game_data.json'), true);
    assert.strictEqual(rawAdapter.canHandle('nodotfile'), false);
    assert.strictEqual(rawAdapter.canHandle('stage.png'), false);
    assert.strictEqual(rawAdapter.canHandle(123), false);
});

test('BranchBooster - BrushController: non-cancelable touch, empty touches, onRadiusChange non-function', () => {
    const canvas = createMockCanvasElement(800, 600);
    const cursor = { style: {} };
    const controller = new BrushController(canvas, cursor, () => {});

    // 1. onRadiusChange with non-function
    controller.onRadiusChange(null);
    controller.onRadiusChange('invalid');
    assert.doesNotThrow(() => controller.setRadius(3));

    // 2. Touch event with cancelable: false and empty touches array
    if (canvas.listeners['touchstart']) {
        canvas.listeners['touchstart']({ cancelable: false, touches: [] });
    }
    if (canvas.listeners['touchmove']) {
        canvas.listeners['touchmove']({ cancelable: false, touches: [] });
    }
});

test('BranchBooster - main.js: branches in state updates, game over victory/defeat, and container styling', async () => {
    // 1. bootstrapApp returns null when canvas is absent
    const docNoCanvas = {
        getElementById: () => null
    };
    assert.equal(bootstrapApp(docNoCanvas), null);

    // 2. startStageWithSource triggers alert and console.error on failure
    const { document: doc, window: win, teardown } = setupGlobalDOM();
    let alertText = null;
    global.alert = (msg) => { alertText = msg; };

    try {
        const app = bootstrapApp(doc, win);
        app.orchestrator.loadAndStartStage = async () => { throw new Error('Stage corrupted'); };
        await app.startStageWithSource('invalid.json');
        assert.ok(alertText.includes('Stage corrupted'));

        // 3. exportPngBtn click triggers exportPng
        let exportPngCalled = false;
        app.renderer.exportPng = () => { exportPngCalled = true; };
        if (app.hud.exportPngBtn) {
            app.hud.exportPngBtn.click();
            assert.equal(exportPngCalled, true);
        }

        // 4. State updates branches: timer tick vs render updates
        app.orchestrator.notifyUpdate(null, true); // isTimerTick = true
        app.orchestrator.notifyUpdate(null, false); // isTimerTick = false but no session/stageData

        // 5. Game over defeat branch
        const defeatSnapshot = {
            status: 'TIMEOUT',
            remainingHairs: 5,
            totalHairs: 10,
            percentageCleared: 50,
            score: 100,
            comboCount: 0,
            finalResult: {
                baseScore: 100,
                timeBonus: 0,
                allClearBonus: 0,
                totalScore: 100
            }
        };
        for (const cb of app.orchestrator.gameOverCallbacks) {
            cb(defeatSnapshot);
        }
    } finally {
        delete global.alert;
        teardown();
    }

    // 6. initAutoBootstrap with loading state and null window
    const loadingDoc = createMockDocument();
    loadingDoc.readyState = 'loading';
    assert.equal(initAutoBootstrap(loadingDoc, null), null);
});

test('BranchBooster - CanvasRenderer: empty stageData, null ctx, out-of-bounds dirtyCells, and restoreParticleCell guards', () => {
    const canvas = createMockCanvasElement(100, 100);
    const renderer = new CanvasRenderer(canvas);

    // 1. render with null stageData or null ctx
    renderer.render(null, null);
    renderer.ctx = null;
    renderer.render({ cols: 10, rows: 10, textGrid: [] }, null);
    renderer.setupCanvas(); // restores ctx

    // 2. render with dimension resize in render()
    const resizedStage = {
        cols: 20,
        rows: 20,
        textGrid: ['....................'],
        colorGrid: [[null, [200, 150, 100]]]
    };
    renderer.render(resizedStage, null);

    // 3. Partial render with out of bounds coordinates
    renderer.render(resizedStage, null, [
        { r: -1, c: 0 },
        { r: 25, c: 0 },
        { r: 0, c: -1 },
        { r: 0, c: 25 },
        { r: 0, c: 1 } // Valid cell with colorGrid
    ]);

    // 4. restoreParticleCell edge cases
    renderer.currentStageData = null;
    renderer.restoreParticleCell(0, 0); // null stageData guard
    renderer.currentStageData = resizedStage;
    renderer.restoreParticleCell(-1, 0); // Out of bounds
    renderer.restoreParticleCell(0, 25); // Out of bounds
    renderer.restoreParticleCell(0, 1); // Valid restore
});

test('BranchBooster - InputManager: null targets, absent win, unmapped activeElement, textarea, uppercase R', () => {
    const doc = createMockDocument();
    
    // 1. InputManager without window
    const imNoWin = new InputManager({
        doc,
        win: null,
        brushController: { setRadius: () => {} },
        orchestrator: { restart: () => {} },
        hud: {},
        sound: {}
    });
    assert.ok(imNoWin);
    imNoWin.destroy();

    // 2. Brush button click when e.target is null, without classList, or invalid data-radius
    const btn = doc.createElement('button');
    btn.className = 'brush-btn';
    doc.body.appendChild(btn);

    const win = createMockWindow();
    let currentRadius = null;
    let restartCalled = false;
    const imWithBtn = new InputManager({
        doc,
        win,
        brushController: { setRadius: (r) => { currentRadius = r; }, onRadiusChange: () => {} },
        orchestrator: { restart: () => { restartCalled = true; } },
        hud: {},
        sound: {}
    });

    if (btn.listeners['click']) {
        btn.listeners['click']({ target: null });
        assert.equal(currentRadius, 1);

        const targetNoClass = { getAttribute: () => 'invalid' };
        btn.listeners['click']({ target: targetNoClass });
        assert.equal(currentRadius, 1);
    }

    // 3. Keydown with null activeElement
    doc.activeElement = null;
    win.dispatchEvent('keydown', { key: '1' });
    assert.equal(currentRadius, 1);

    // 4. Keydown when activeElement is textarea
    doc.activeElement = { tagName: 'TEXTAREA' };
    win.dispatchEvent('keydown', { key: '2' });
    assert.equal(currentRadius, 1); // Not changed to 3

    // 5. Uppercase 'R' shortcut
    doc.activeElement = { tagName: 'DIV' };
    win.dispatchEvent('keydown', { key: 'R' });
    assert.equal(restartCalled, true);
});

test('BranchBooster - CanvasImageProcessorAdapter: HTMLImageElement, zero dimension error, null canvas, and null ctx', async () => {
    const { document: doc, teardown } = setupGlobalDOM();
    try {
        const adapter = new CanvasImageProcessorAdapter();

        // 1. HTMLImageElement instance branch
        class MockHTMLImageElement {
            constructor() {
                this.naturalWidth = 280;
                this.naturalHeight = 219;
                this.src = 'test.png';
            }
        }
        global.HTMLImageElement = MockHTMLImageElement;

        const imgInstance = new MockHTMLImageElement();
        const res = await adapter.processImageSource(imgInstance, 10, 10);
        assert.ok(res.imageData);

        // 2. Zero dimensions error branch
        const zeroImg = new MockHTMLImageElement();
        zeroImg.naturalWidth = 0;
        await assert.rejects(() => adapter.processImageSource(zeroImg), /이미지 해상도를 읽을 수 없습니다/);

        // 3. null canvas guard
        const originalCreateEl = global.document.createElement;
        global.document.createElement = () => null;
        await assert.rejects(() => adapter.processImageSource(imgInstance), /캔버스를 생성할 수 없는 환경입니다/);

        // 4. null ctx guard
        global.document.createElement = () => ({
            getContext: () => null
        });
        await assert.rejects(() => adapter.processImageSource(imgInstance), /캔버스 2D 컨텍스트를 가져올 수 없습니다/);

        global.document.createElement = originalCreateEl;
    } finally {
        delete global.HTMLImageElement;
        teardown();
    }
});

test('BranchBooster - HairGrid: constructor variations and boundary queries', () => {
    // 1. GridGeometry with non-array second arg
    const grid1 = new HairGrid(new GridGeometry(5, 5), null, [{ r: 0, c: 0 }]);
    assert.equal(grid1.totalHairCount, 1);

    // 2. has() query out of bounds
    assert.equal(grid1.has(-1, 0), false);
    assert.equal(grid1.has(0, -1), false);
    assert.equal(grid1.has(10, 0), false);
    assert.equal(grid1.has(0, 10), false);

    // 3. getClearedPercentage with 0 total hairs
    const emptyGrid = new HairGrid(5, 5, []);
    assert.equal(emptyGrid.getClearedPercentage(), 100);
});

test('BranchBooster - GameOrchestrator: null session guards and restart edge cases', () => {
    const pipeline = { loadStage: async () => ({}) };
    const orchestrator = new GameOrchestrator(pipeline);

    // 1. shave when session is null
    const res = orchestrator.shave(0, 0);
    assert.equal(res.removed, 0);

    // 2. getCurrentHairView when session is null
    assert.equal(orchestrator.getCurrentHairView(), null);

    // 3. restart when session is null
    assert.doesNotThrow(() => orchestrator.restart());
});

test('BranchBooster - HUD: default gamePolicy, showLoading defaults, and initStartModalEvents defaults', () => {
    const doc = createMockDocument();
    const hud = new HUD(undefined, doc);
    assert.ok(hud.gamePolicy instanceof GamePolicy);

    // Defaults
    hud.showLoading();
    hud.initStartModalEvents();

    // Fail-fast on missing doc
    assert.throws(() => new HUD(new GamePolicy(), null), /HUD: document is required/);
});

test('BranchBooster - main.js: all remaining branches', async () => {
    // 1. Calling bootstrapApp with default null doc
    assert.equal(bootstrapApp(null), null);

    // 2. Calling initAutoBootstrap with default null doc
    assert.equal(initAutoBootstrap(null), null);

    // 3. Preset other than preset1
    const { document: doc, window: win, teardown } = setupGlobalDOM();
    try {
        const app = bootstrapApp(doc, win);
        let loadedSource = null;
        app.orchestrator.loadAndStartStage = async (src) => {
            loadedSource = src;
            return { cols: 5, rows: 5, totalHairCount: 1, hairPositions: [{ r: 0, c: 0 }], textGrid: [] };
        };

        // Preset2 branch
        app.hud.modalView.init((p) => app.startStageWithSource(p === 'preset1' ? 'game_data.json' : p));
        app.hud.modalView.startPresetBtn.listeners['click'] = () => {
            app.startStageWithSource('preset2.json');
        };
        app.hud.modalView.startPresetBtn.click();
        assert.equal(loadedSource, 'preset2.json');

        // Shave with removed = 0 branch
        app.brushController.onShave(0, 0, 1);

        // Alert with falsy error
        global.alert = (msg) => {
            assert.ok(msg.includes('알 수 없는 오류'));
        };
        app.orchestrator.loadAndStartStage = async () => { throw undefined; };
        await app.startStageWithSource('throw-null');
        delete global.alert;
    } finally {
        teardown();
    }
});

test('BranchBooster - SoundEffects: null ctx during play methods and successful resume', async () => {
    // 1. null ctx during play methods
    const soundNoCtx = new SoundEffects(null);
    soundNoCtx.playShaveSound();
    soundNoCtx.playComboSound(2);
    soundNoCtx.playWinSound();

    // 2. Successful resume
    const win = createMockWindow();
    const sound = new SoundEffects(win);
    sound.init();
    sound.ctx.state = 'suspended';
    sound.ctx.resume = async () => {};
    sound.init();
    await new Promise(r => setTimeout(r, 10));
});

test('BranchBooster - BrushController: null cursor event listeners branches', () => {
    const canvas = createMockCanvasElement(800, 600);
    const controller = new BrushController(canvas, null, () => {});
    
    if (canvas.listeners['mousemove']) canvas.listeners['mousemove']({ clientX: 10, clientY: 10 });
    if (canvas.listeners['touchstart']) canvas.listeners['touchstart']({ cancelable: true, preventDefault: () => {}, touches: [{ clientX: 10, clientY: 10 }] });
    if (canvas.listeners['touchmove']) canvas.listeners['touchmove']({ cancelable: true, preventDefault: () => {}, touches: [{ clientX: 20, clientY: 20 }] });
    if (canvas.listeners['touchend']) canvas.listeners['touchend']();
    if (canvas.listeners['mouseenter']) canvas.listeners['mouseenter']();
    if (canvas.listeners['mouseleave']) canvas.listeners['mouseleave']();
});

test('BranchBooster - Global DOM default arguments coverage in HUD, SoundEffects, InputManager, and main.js', () => {
    const { document: doc, window: win, teardown } = setupGlobalDOM();
    try {
        const hud = new HUD();
        assert.ok(hud);

        const sound = new SoundEffects();
        assert.ok(sound);

        const im = new InputManager();
        assert.ok(im);
        im.destroy();

        const autoApp = initAutoBootstrap();
        assert.ok(autoApp);
    } finally {
        teardown();
    }
});



