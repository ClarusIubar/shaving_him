/**
 * TSK-008-07: bootstrapApp must tolerate any combination of optional DOM
 * elements being absent. Each of these `if (el) {...}` guards was previously
 * only ever exercised on the "element present" side, which is exactly the
 * unmeasured territory three separate user-facing defects came from this
 * cycle (see #35, #36, #39).
 */
import test from 'node:test';
import assert from 'node:assert/strict';

const makeCanvas = () => ({
    width: 1680, height: 1314, style: {},
    getContext: () => ({ scale() {}, fillRect() {}, fillText() {} }),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1680, height: 1314 }),
    addEventListener() {}
});

test('bootstrapApp - runs without a sound toggle, brush buttons, change-stage, or export button', async () => {
    const doc = {
        readyState: 'complete',
        body: { appendChild() {} },
        activeElement: { tagName: 'div', isContentEditable: false },
        querySelectorAll: () => [], // no .brush-btn elements
        addEventListener() {},
        getElementById: (id) => (id === 'gameCanvas' ? makeCanvas() : null) // every optional id is absent
    };

    global.document = doc;
    global.window = { addEventListener() {} };
    const { bootstrapApp } = await import('../../src/main.js');

    const app = bootstrapApp(doc, { addEventListener() {} });
    assert.ok(app, 'bootstrapApp must still succeed with every optional element missing');
    assert.equal(app.hud.soundToggleBtn, null);
    assert.equal(app.hud.exportPngBtn, null);

    delete global.document;
    delete global.window;
});
