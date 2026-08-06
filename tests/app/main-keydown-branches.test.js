/**
 * TSK-008-07: covers the keydown shortcut branches that require an unmapped
 * key and a contentEditable-focused element - both previously unexercised.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

const makeCanvas = () => ({
    width: 1680, height: 1314, style: {},
    getContext: () => ({ scale() {}, fillRect() {}, fillText() {} }),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1680, height: 1314 }),
    addEventListener() {}
});

test('bootstrapApp - keydown ignores unmapped keys and contentEditable focus', async () => {
    const winListeners = {};
    const win = { addEventListener: (evt, fn) => { winListeners[evt] = fn; } };
    const doc = {
        readyState: 'complete',
        body: { appendChild() {} },
        activeElement: { tagName: 'div', isContentEditable: false },
        querySelectorAll: () => [],
        addEventListener() {},
        getElementById: (id) => (id === 'gameCanvas' ? makeCanvas() : null)
    };

    global.document = doc;
    global.window = win;
    const { bootstrapApp } = await import('../../src/main.js');
    const app = bootstrapApp(doc, win);

    assert.equal(typeof winListeners.keydown, 'function');
    let restarted = false;
    app.orchestrator.restart = () => { restarted = true; };

    winListeners.keydown({ key: 'x' }); // unmapped, not r/R
    assert.equal(restarted, false, 'an unmapped key must not restart the game');

    doc.activeElement = { tagName: 'DIV', isContentEditable: true };
    winListeners.keydown({ key: 'r' });
    assert.equal(restarted, false, 'contentEditable focus must suppress the R-to-restart shortcut');

    doc.activeElement = { tagName: 'div', isContentEditable: false };
    winListeners.keydown({ key: 'R' });
    assert.equal(restarted, true, 'uppercase R must still restart once focus is no longer contentEditable');

    delete global.document;
    delete global.window;
});
