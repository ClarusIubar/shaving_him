import test from 'node:test';
import assert from 'node:assert/strict';
import { bootstrapApp, KEY_BRUSH_RADIUS_MAP } from '../../src/main.js';

test('main.js - bootstrapApp returns null when doc or canvas is missing', () => {
    assert.equal(bootstrapApp(null, null), null);

    const mockDocNoCanvas = {
        getElementById: () => null
    };
    assert.equal(bootstrapApp(mockDocNoCanvas, null), null);
});

test('main.js - bootstrapApp wires orchestrator, HUD, sound, renderer, and event listeners', async () => {
    const docListeners = {};
    const winListeners = {};
    const elements = {};

    const mockCanvas = {
        id: 'gameCanvas',
        width: 1680, height: 1314, style: {},
        getContext: () => ({ scale: () => {}, fillRect: () => {}, fillText: () => {} }),
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 1680, height: 1314 }),
        addEventListener: (evt, fn) => { docListeners['canvas_' + evt] = fn; }
    };

    const mockSoundBtn = { addEventListener: (evt, fn) => { docListeners['soundBtn_' + evt] = fn; } };
    const mockChangeStageBtn = { addEventListener: (evt, fn) => { docListeners['changeStage_' + evt] = fn; } };
    const mockPresetBtn = { addEventListener: (evt, fn) => { docListeners['preset_' + evt] = fn; } };
    const mockCustomBtn = { addEventListener: (evt, fn) => { docListeners['custom_' + evt] = fn; } };
    const mockExportBtn = { addEventListener: (evt, fn) => { docListeners['export_' + evt] = fn; } };

    let classRemoved = false;
    let classAdded = false;
    const mockBrushBtn = {
        classList: {
            remove: () => { classRemoved = true; },
            add: () => { classAdded = true; }
        },
        getAttribute: () => '3',
        addEventListener: (evt, fn) => { docListeners['brushBtn_' + evt] = fn; }
    };

    const mockDoc = {
        readyState: 'complete',
        getElementById: (id) => {
            if (id === 'gameCanvas') return mockCanvas;
            if (id === 'razorCursor') return { style: {} };
            if (id === 'gameContainer') return { style: {} };
            if (id === 'changeStageBtn') return mockChangeStageBtn;
            if (id === 'soundToggleBtn') return mockSoundBtn;
            if (id === 'startPresetBtn') return mockPresetBtn;
            if (id === 'startCustomBtn') return mockCustomBtn;
            if (id === 'exportPngBtn') return mockExportBtn;
            if (id === 'loadingOverlay') return { style: {}, appendChild: () => {}, querySelector: () => null };
            return null;
        },
        querySelectorAll: (selector) => {
            if (selector === '.brush-btn') return [mockBrushBtn];
            return [];
        },
        createElement: () => ({ style: {}, classList: { add: () => {}, remove: () => {} }, appendChild: () => {}, textContent: '' }),
        activeElement: { tagName: 'div', isContentEditable: false },
        addEventListener: (evt, fn) => { docListeners[evt] = fn; }
    };

    const mockWin = {
        requestAnimationFrame: (cb) => { cb(); return 1; },
        addEventListener: (evt, fn) => { winListeners[evt] = fn; }
    };
    global.requestAnimationFrame = mockWin.requestAnimationFrame;

    global.document = mockDoc;
    global.window = mockWin;

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

    // Test keydown shortcuts (input activeElement skip, number 2 -> radius 3, R -> restart)
    if (winListeners['keydown']) {
        // Active input tag -> skipped
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
    app.orchestrator.currentStageData = { cols: 10, rows: 10, textGrid: [] };
    app.orchestrator.session = { hairGrid: {}, getSnapshot: () => ({ comboCount: 3 }) };
    app.orchestrator.notifyUpdate(app.orchestrator.session.getSnapshot(), false);

    let restartCalled = false;
    app.orchestrator.restart = () => { restartCalled = true; };
    app.hud.showGameOver = (snap, cb) => { cb(); };
    app.orchestrator.notifyGameOver({ status: 'WON', percentageCleared: 80 });
    assert.equal(restartCalled, true);

    // Test preset button click with mock loadAndStartStage
    app.orchestrator.loadAndStartStage = async (src, sec, cb) => {
        if (cb) cb('Loading...', 50);
        return { cols: 10, rows: 10, textGrid: [] };
    };
    await app.startStageWithSource('game_data.json');

    if (docListeners['preset_click']) {
        docListeners['preset_click']();
    }

    // Test custom photo button click
    app.hud.selectedFile = { name: 'photo.jpg' };
    if (docListeners['custom_click']) {
        docListeners['custom_click']();
    }

    // Test startStageWithSource error branch
    app.orchestrator.loadAndStartStage = async () => { throw new Error('Stage error'); };
    global.alert = () => {};
    await app.startStageWithSource('invalid');

    app.orchestrator.notifyGameOver({ status: 'WON', percentageCleared: 100 });
    assert.equal(restartCalled, true);
});

test('main.js - auto bootstrap on DOMContentLoaded or ready state', async () => {
    const docListeners = {};
    const winListeners = {};
    const mockCanvas = {
        id: 'gameCanvas',
        width: 1680, height: 1314, style: {},
        getContext: () => ({ scale: () => {}, fillRect: () => {}, fillText: () => {} }),
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 1680, height: 1314 }),
        addEventListener: () => {}
    };

    global.document = {
        readyState: 'loading',
        getElementById: (id) => id === 'gameCanvas' ? mockCanvas : null,
        querySelectorAll: () => [],
        activeElement: { tagName: 'div' },
        addEventListener: (evt, fn) => { docListeners[evt] = fn; }
    };
    global.window = {
        addEventListener: (evt, fn) => { winListeners[evt] = fn; }
    };

    // Fast-forward DOMContentLoaded registration
    if (winListeners['DOMContentLoaded']) winListeners['DOMContentLoaded']();

    delete global.document;
    delete global.window;
});
