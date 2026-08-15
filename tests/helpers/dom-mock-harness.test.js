import test from 'node:test';
import assert from 'node:assert/strict';

import {
    createMockDocument,
    createMockWindow,
    createMockAudioContext,
    createMockCanvasElement,
    setupGlobalDOM
} from './dom-mock-harness.js';

test('createMockDocument - provides element lookup, creation, and event delegation', () => {
    const doc = createMockDocument();
    const el = doc.getElementById('customId');
    assert.equal(el.id, 'customId');
    assert.equal(el.textContent, '');

    let clicked = false;
    el.addEventListener('click', () => { clicked = true; });
    el.click();
    assert.equal(clicked, true);

    const div = doc.createElement('div');
    assert.equal(div.tagName, 'div');
    doc.body.appendChild(div);

    const queried = doc.querySelectorAll('.test-class');
    assert.ok(Array.isArray(queried));
});

test('createMockWindow - provides requestAnimationFrame, devicePixelRatio, and audio context', () => {
    const win = createMockWindow();
    assert.equal(win.devicePixelRatio, 1);
    assert.ok(typeof win.requestAnimationFrame === 'function');
    assert.ok(typeof win.AudioContext === 'function');

    const audioCtx = new win.AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    assert.ok(osc);
    assert.ok(gain);
    assert.ok(typeof audioCtx.resume === 'function');
});

test('createMockCanvasElement - creates 2D context with measuring and export support', () => {
    const canvas = createMockCanvasElement(800, 600);
    assert.equal(canvas.width, 800);
    assert.equal(canvas.height, 600);
    assert.equal(canvas.toDataURL(), 'data:image/png;base64,mock');

    const rect = canvas.getBoundingClientRect();
    assert.deepEqual(rect, { left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600 });

    const ctx = canvas.getContext('2d');
    assert.ok(ctx);
    assert.doesNotThrow(() => {
        ctx.scale(2, 2);
        ctx.fillRect(0, 0, 10, 10);
        ctx.fillText('A', 0, 0);
    });
});

test('setupGlobalDOM - sets up globals and tears down cleanly', () => {
    const { document, window, teardown } = setupGlobalDOM();

    assert.equal(global.document, document);
    assert.equal(global.window, window);

    teardown();

    assert.equal(global.document, undefined);
    assert.equal(global.window, undefined);
});
