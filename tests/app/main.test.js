import test from 'node:test';
import assert from 'node:assert/strict';

import { ShaveSession } from '../../src/domain/shave-session.js';
import { GamePolicy } from '../../src/domain/game-policy.js';
import {
    createMockDocument,
    createMockWindow,
    setupGlobalDOM
} from '../helpers/dom-mock-harness.js';

test('main.js - bootstrapApp full execution and 100% coverage test', async () => {
    const docListeners = {};
    const winListeners = {};

    const mockCanvas = {
        id: 'gameCanvas',
        width: 1680, height: 1314, style: {},
        getContext: () => ({ scale: () => {}, fillRect: () => {}, fillText: () => {} }),
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 1680, height: 1314 }),
        addEventListener: (evt, fn) => { docListeners['canvas_' + evt] = fn; }
    };

    const mockSoundBtn = { addEventListener: (evt, fn) => { docListeners['soundBtn_' + evt] = fn; } };
    const mockChangeStageBtn = { addEventListener: (evt, fn) => { docListeners['changeStage_' + evt] = fn; } };
    const mockExportBtn = { addEventListener: (evt, fn) => { docListeners['export_' + evt] = fn; } };
    const mockBrushBtn = {
        classList: { remove: () => {}, add: () => {} },
        getAttribute: () => '3',
        addEventListener: (evt, fn) => { docListeners['brushBtn_' + evt] = fn; }
    };
    const mockPresetCard = { getAttribute: () => 'preset1', addEventListener: (evt, fn) => { docListeners['preset_' + evt] = fn; } };
    const mockPhotoInput = { addEventListener: (evt, fn) => { docListeners['photo_' + evt] = fn; } };

    const mockDoc = {
        readyState: 'loading',
        body: { appendChild: () => {} },
        getElementById: (id) => {
            if (id === 'gameCanvas') return mockCanvas;
            if (id === 'razorCursor') return { style: {} };
            if (id === 'gameContainer') return { style: {} };
            if (id === 'changeStageBtn') return mockChangeStageBtn;
            if (id === 'soundToggleBtn') return mockSoundBtn;
            if (id === 'startModal') return { style: {} };
            if (id === 'photoInput') return mockPhotoInput;
            if (id === 'exportPngBtn') return mockExportBtn;
            if (id === 'loadingOverlay') return { style: {}, appendChild: () => {}, querySelector: () => ({ style: {}, textContent: '' }) };
            return null;
        },
        querySelectorAll: (selector) => {
            if (selector === '.brush-btn') return [mockBrushBtn];
            if (selector === '.preset-card') return [mockPresetCard];
            return [];
        },
        createElement: () => ({ style: {}, classList: { add: () => {}, remove: () => {} }, appendChild: () => {}, textContent: '' }),
        activeElement: { tagName: 'div', isContentEditable: false },
        addEventListener: (evt, fn) => { docListeners[evt] = fn; }
    };

    const mockWin = {
        requestAnimationFrame: (cb) => { cb(); return 1; },
        addEventListener: (evt, fn) => {
            winListeners[evt] = fn;
            if (evt === 'DOMContentLoaded') fn();
        }
    };
    global.requestAnimationFrame = mockWin.requestAnimationFrame;
    global.document = mockDoc;
    global.window = mockWin;

    const { bootstrapApp, initAutoBootstrap } = await import('../../src/main.js');

    // Test null doc or missing canvas
    assert.equal(bootstrapApp(null, null), null);
    assert.equal(bootstrapApp({ getElementById: () => null }, null), null);
    assert.equal(initAutoBootstrap(null, null), null);

    // Test full bootstrapApp initialization
    const app = bootstrapApp(mockDoc, mockWin);
    assert.ok(app !== null);

    // Test brush button click
    if (docListeners['brushBtn_click']) {
        docListeners['brushBtn_click']({ target: mockBrushBtn });
        assert.equal(app.brushController.brushRadius, 3);
    }

    // Test sound button click
    if (docListeners['soundBtn_click']) {
        docListeners['soundBtn_click']();
    }

    // Test change stage button click
    if (docListeners['changeStage_click']) {
        docListeners['changeStage_click']();
    }

    // Test export PNG button click
    if (docListeners['export_click']) {
        let exportCalled = false;
        app.renderer.exportPng = () => { exportCalled = true; };
        docListeners['export_click']();
        assert.equal(exportCalled, true);
    }

    // Test keydown shortcuts
    if (winListeners['keydown']) {
        mockDoc.activeElement = { tagName: 'input' };
        winListeners['keydown']({ key: '2' });

        mockDoc.activeElement = { tagName: 'div' };
        winListeners['keydown']({ key: '2' });
        assert.equal(app.brushController.brushRadius, 3);

        winListeners['keydown']({ key: 'r' });
        winListeners['keydown']({ key: 'R' });
    }

    // Test brush controller shave callback
    app.orchestrator.shave = () => ({ removed: 5, dirtyCells: [] });
    app.brushController.onShave(0, 0, 1);

    // Test orchestrator update notification & combo sound
    let comboSoundPlayed = false;
    app.sound.playComboSound = () => { comboSoundPlayed = true; };
    const dummyStageData = { cols: 10, rows: 10, hairPositions: [{ r: 0, c: 0 }], textGrid: [] };
    app.orchestrator.currentStageData = dummyStageData;
    app.orchestrator.session = new ShaveSession(dummyStageData, 60);
    app.orchestrator.session.start();
    app.orchestrator.notifyUpdate(null, false);

    // Trigger update with comboCount > 1 via scoreCalculator.shaveStreak
    app.orchestrator.session.scoreCalculator.shaveStreak = 3;
    app.orchestrator.notifyUpdate(null, false);
    assert.equal(comboSoundPlayed, true);

    // Test successful startStageWithSource
    let winSoundPlayed = false;
    app.sound.playWinSound = () => { winSoundPlayed = true; };
    app.orchestrator.loadAndStartStage = async (src, sec, cb) => {
        if (cb) cb('Loading...', 50);
        const stageData = { cols: 10, rows: 10, hairPositions: [{ r: 0, c: 0 }], textGrid: [] };
        app.orchestrator.currentStageData = stageData;
        app.orchestrator.session = new ShaveSession(stageData, 60);
        app.orchestrator.session.start();
        return stageData;
    };
    await app.startStageWithSource('game_data.json');

    // Test Game Over victory branch
    let restartCalled = false;
    app.orchestrator.restart = () => { restartCalled = true; };
    app.hud.showGameOver = (snap, cb) => { if (cb) cb(); };

    // Shave the only hair cell to achieve WON status
    app.orchestrator.session.shave(0, 0, 1);
    app.orchestrator.notifyGameOver();
    assert.equal(winSoundPlayed, true);
    assert.equal(restartCalled, true);

    // Test preset card click & photo input change
    if (docListeners['preset_click']) {
        docListeners['preset_click']({ currentTarget: mockPresetCard });
    }

    if (docListeners['photo_change']) {
        docListeners['photo_change']({ target: { files: [{ name: 'test.png' }] } });
    }

    // Test startStageWithSource error branch
    app.orchestrator.loadAndStartStage = async () => { throw new Error('Stage error'); };
    global.alert = () => {};
    await app.startStageWithSource('invalid');

    // Test initAutoBootstrap with readyState complete
    mockDoc.readyState = 'complete';
    const appComplete = initAutoBootstrap(mockDoc, mockWin);
    assert.ok(appComplete !== null);

    delete global.document;
    delete global.window;
    delete global.requestAnimationFrame;
    delete global.alert;
});

test('bootstrapApp - combo sound plays once per rising edge, not on every update at the same streak', async () => {
    const { document, window, teardown } = setupGlobalDOM();
    const { bootstrapApp } = await import('../../src/main.js');
    try {
        const app = bootstrapApp(document, window);
        let comboPlays = 0;
        app.sound.playComboSound = () => { comboPlays++; };

        const stageData = { cols: 5, rows: 5, hairPositions: [{ r: 0, c: 0 }], textGrid: [] };
        app.orchestrator.currentStageData = stageData;
        app.orchestrator.session = new ShaveSession(stageData, 60);
        app.orchestrator.session.start();

        // Streak 1 -> no combo sound
        app.orchestrator.session.scoreCalculator.shaveStreak = 1;
        app.orchestrator.notifyUpdate(null, false);
        assert.equal(comboPlays, 0);

        // Streak 2 (rising edge) -> combo sound plays
        app.orchestrator.session.scoreCalculator.shaveStreak = 2;
        app.orchestrator.notifyUpdate(null, false);
        assert.equal(comboPlays, 1);

        // Streak 2 again (steady state) -> combo sound does NOT play again
        app.orchestrator.notifyUpdate(null, false);
        assert.equal(comboPlays, 1);

        // Streak 3 (rising edge) -> combo sound plays
        app.orchestrator.session.scoreCalculator.shaveStreak = 3;
        app.orchestrator.notifyUpdate(null, false);
        assert.equal(comboPlays, 2);
    } finally {
        teardown();
    }
});

test('bootstrapApp / initAutoBootstrap - handles absent document and window gracefully', async () => {
    delete global.document;
    delete global.window;

    const { bootstrapApp, initAutoBootstrap } = await import('../../src/main.js');

    assert.equal(bootstrapApp(), null);
    assert.equal(initAutoBootstrap(), null);

    global.window = { addEventListener: () => {} };
    assert.equal(bootstrapApp(), null);
    assert.equal(initAutoBootstrap(), null);
    delete global.window;
});

test('initAutoBootstrap - DOMContentLoaded and readyState loading branch', async () => {
    const { initAutoBootstrap } = await import('../../src/main.js');
    const doc = createMockDocument();
    doc.readyState = 'loading';
    let domContentLoadedCb = null;
    const win = {
        addEventListener: (evt, fn) => {
            if (evt === 'DOMContentLoaded') domContentLoadedCb = fn;
        }
    };

    const res = initAutoBootstrap(doc, win);
    assert.equal(res, null);
    assert.ok(domContentLoadedCb);
    const bootstrapped = domContentLoadedCb();
    assert.ok(bootstrapped !== null);
});

test('bootstrapApp - DI boundary verification for GamePolicy and injected doc/win', async () => {
    const { bootstrapApp } = await import('../../src/main.js');
    const { document, window, teardown } = setupGlobalDOM();
    try {
        const customPolicy = new GamePolicy();
        const app = bootstrapApp(document, window, { gamePolicy: customPolicy });
        assert.equal(app.hud.gamePolicy, customPolicy);
    } finally {
        teardown();
    }
});

test('bootstrapApp - keydown ignores unmapped keys and contentEditable focus', async () => {
    const { bootstrapApp } = await import('../../src/main.js');
    const { document, window, teardown } = setupGlobalDOM();
    try {
        let keydownHandler = null;
        window.addEventListener = (evt, fn) => {
            if (evt === 'keydown') keydownHandler = fn;
        };

        const app = bootstrapApp(document, window);
        assert.ok(keydownHandler);

        // Ignored unmapped key
        keydownHandler({ key: 'F12', target: {} });

        // Ignored when contentEditable
        document.activeElement = { tagName: 'DIV', isContentEditable: true };
        keydownHandler({ key: '1', target: document.activeElement });
    } finally {
        teardown();
    }
});

test('bootstrapApp - runs without a window object; top-level auto-bootstrap does not throw', async () => {
    const { bootstrapApp } = await import('../../src/main.js');
    const { document, teardown } = setupGlobalDOM();
    delete global.window;
    try {
        const app = bootstrapApp(document, null);
        assert.ok(app !== null);
    } finally {
        teardown();
    }
});

test('main.js - preset and custom photo buttons reach startStageWithSource', async () => {
    const { bootstrapApp } = await import('../../src/main.js');
    const { document, window, teardown } = setupGlobalDOM();
    try {
        const app = bootstrapApp(document, window);
        let startedSource = null;
        app.orchestrator.loadAndStartStage = async (src) => {
            startedSource = src;
            return { cols: 5, rows: 5, totalHairCount: 1, hairPositions: [{ r: 0, c: 0 }], textGrid: [] };
        };

        // Trigger preset
        app.hud.modalView.startPresetBtn.click();
        assert.equal(startedSource, 'game_data.json');

        // Trigger custom
        const file = { name: 'face.jpg' };
        app.hud.modalView.handleFileSelected(file);
        app.hud.modalView.startCustomBtn.click();
        assert.deepEqual(startedSource, file);
    } finally {
        teardown();
    }
});
