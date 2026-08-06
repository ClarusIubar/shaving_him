/**
 * TSK-008-07: bootstrapApp must run without a window object at all (no
 * keyboard shortcuts wired), and the top-level auto-bootstrap must not throw
 * when the ambient global `window` is genuinely undefined.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

const makeCanvas = () => ({
    width: 1680, height: 1314, style: {},
    getContext: () => ({ scale() {}, fillRect() {}, fillText() {} }),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1680, height: 1314 }),
    addEventListener() {}
});

test('bootstrapApp - runs without a window object; top-level auto-bootstrap does not throw', async () => {
    const doc = {
        readyState: 'complete',
        body: { appendChild() {} },
        activeElement: { tagName: 'div', isContentEditable: false },
        querySelectorAll: () => [],
        addEventListener() {},
        getElementById: (id) => (id === 'gameCanvas' ? makeCanvas() : null)
    };

    global.document = doc;
    delete global.window; // no ambient window at all

    const { bootstrapApp } = await import('../../src/main.js');
    const app = bootstrapApp(doc, null);
    assert.ok(app, 'bootstrapApp must succeed with win=null');

    delete global.document;
});
