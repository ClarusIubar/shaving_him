/**
 * Verifies that bootstrapApp's start-modal callbacks are reachable from the
 * real HUD button wiring - the path that previously left the game unstartable.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

const makeEl = (sink, name) => ({
    style: {},
    disabled: false,
    classList: { add: () => {}, remove: () => {} },
    textContent: '',
    querySelector: () => ({ style: {}, textContent: '' }),
    addEventListener: (evt, fn) => { sink[`${name}_${evt}`] = fn; }
});

test('main.js - preset and custom photo buttons reach startStageWithSource', async () => {
    const handlers = {};
    const canvas = {
        width: 1680, height: 1314, style: {},
        getContext: () => ({ scale: () => {}, fillRect: () => {}, fillText: () => {} }),
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 1680, height: 1314 }),
        addEventListener: (evt, fn) => { handlers[`canvas_${evt}`] = fn; }
    };

    const presetBtn = makeEl(handlers, 'preset');
    const customBtn = makeEl(handlers, 'custom');

    const doc = {
        readyState: 'complete',
        body: { appendChild: () => {} },
        activeElement: { tagName: 'div', isContentEditable: false },
        getElementById: (id) => {
            if (id === 'gameCanvas') return canvas;
            if (id === 'startPresetBtn') return presetBtn;
            if (id === 'startCustomBtn') return customBtn;
            if (id === 'gameContainer' || id === 'razorCursor' || id === 'startModal') return { style: {} };
            return null;
        },
        querySelectorAll: () => [],
        createElement: () => makeEl({}, 'tmp'),
        addEventListener: () => {}
    };
    const win = { requestAnimationFrame: (cb) => { cb(); return 1; }, addEventListener: () => {} };

    global.document = doc;
    global.window = win;
    global.requestAnimationFrame = win.requestAnimationFrame;

    const { bootstrapApp } = await import('../../src/main.js');
    const app = bootstrapApp(doc, win);
    assert.ok(app);

    const requested = [];
    app.orchestrator.loadAndStartStage = async (source) => {
        requested.push(source);
        app.orchestrator.currentStageData = { cols: 4, rows: 4, textGrid: [], colorGrid: [] };
        return app.orchestrator.currentStageData;
    };
    app.renderer.render = () => {};

    // Preset button must resolve 'preset1' to the bundled stage file.
    assert.equal(typeof handlers.preset_click, 'function');
    await handlers.preset_click();
    assert.deepEqual(requested, ['game_data.json']);

    // Custom photo button must forward the selected File.
    const file = { name: 'face.png' };
    app.hud.selectedFile = file;
    assert.equal(typeof handlers.custom_click, 'function');
    await handlers.custom_click();
    assert.equal(requested[1], file);

    // A rejected load must surface through the error path without throwing.
    app.orchestrator.loadAndStartStage = async () => { throw new Error('boom'); };
    global.alert = () => {};
    await handlers.preset_click();
    delete global.alert;

    delete global.document;
    delete global.window;
    delete global.requestAnimationFrame;
});
