/**
 * TSK-008-07: bootstrapApp/initAutoBootstrap default their doc/win parameters
 * from the ambient `document`/`window` globals via
 * `typeof x !== 'undefined' ? x : null`. Every other test in this suite
 * passes doc/win explicitly, which bypasses default-parameter evaluation
 * entirely - these branches only run when a caller omits the argument, as
 * the real auto-bootstrap entry point at the bottom of main.js does.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

const makeCanvas = () => ({
    width: 1680, height: 1314, style: {},
    getContext: () => ({ scale() {}, fillRect() {}, fillText() {} }),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1680, height: 1314 }),
    addEventListener() {}
});

const makeDoc = () => ({
    readyState: 'complete',
    body: { appendChild() {} },
    activeElement: { tagName: 'div', isContentEditable: false },
    querySelectorAll: () => [],
    addEventListener() {},
    getElementById: (id) => (id === 'gameCanvas' ? makeCanvas() : null)
});

test('bootstrapApp() with no arguments defaults doc from a present document global and win from an absent window global', async () => {
    global.document = makeDoc();
    delete global.window;

    const { bootstrapApp } = await import('../../src/main.js');
    assert.ok(bootstrapApp(), 'must default doc to the ambient document and win to null');

    delete global.document;
});

test('bootstrapApp() with no arguments defaults win from a present window global while document is absent', async () => {
    delete global.document;
    global.window = { addEventListener() {} };

    const { bootstrapApp } = await import('../../src/main.js');
    assert.equal(bootstrapApp(), null, 'doc defaults to null when document is undefined, so bootstrapApp bails out');

    delete global.window;
});

test('initAutoBootstrap() with no arguments defaults doc from a present document global and win from an absent window global', async () => {
    global.document = makeDoc();
    delete global.window;

    const { initAutoBootstrap } = await import('../../src/main.js');
    assert.ok(initAutoBootstrap(), 'must default doc to the ambient document and win to null');

    delete global.document;
});

test('initAutoBootstrap() with no arguments defaults win from a present window global while document is absent', async () => {
    delete global.document;
    global.window = { addEventListener() {} };

    const { initAutoBootstrap } = await import('../../src/main.js');
    assert.equal(initAutoBootstrap(), null, 'doc defaults to null when document is undefined');

    delete global.window;
});
