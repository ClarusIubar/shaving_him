/**
 * TSK-008-08: BrushController must not use a canvas bounding rect that was
 * cached while the canvas sat inside a display:none container.
 *
 * BrushController is constructed by main.js before the stage loads, while
 * #gameContainer is display:none. Its constructor caches
 * canvas.getBoundingClientRect() immediately, which is all-zero at that
 * point. The cache is only refreshed on 'resize', 'scroll', or 'mouseenter'
 * - none of which fire when a container flips from display:none to flex.
 * touchstart never fires 'mouseenter' at all, so on mobile the very first
 * touch-shave after starting a stage was silently dropped.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { GridGeometry } from '../../src/domain/grid-geometry.js';
import { BrushController } from '../../src/ui/brush-controller.js';

/** A canvas double whose bounding rect starts zeroed (display:none) and can
 *  later be switched to a real, laid-out rect (container made visible). */
const makeHideableCanvas = () => {
    const listeners = {};
    let rect = { left: 0, top: 0, width: 0, height: 0 }; // display:none
    return {
        addEventListener: (evt, fn) => { (listeners[evt] ||= []).push(fn); },
        getBoundingClientRect: () => rect,
        reveal(realRect) { rect = realRect; },
        dispatch(evt, payload = {}) {
            (listeners[evt] || []).forEach(fn => fn(payload));
        }
    };
};

test('BrushController - touchstart refreshes a stale rect on its own (no mouseenter on touch devices)', () => {
    const canvas = makeHideableCanvas();
    const shaves = [];
    const controller = new BrushController(canvas, null, (r, c, radius) => shaves.push({ r, c, radius }), GridGeometry.default());

    // Container becomes visible (display:none -> flex) after construction,
    // exactly as main.js's startStageWithSource does. No resize/scroll/mouseenter fires.
    canvas.reveal({ left: 0, top: 0, width: 1680, height: 1314 });

    canvas.dispatch('touchstart', {
        cancelable: false,
        touches: [{ clientX: 3, clientY: 3 }] // -> grid (0,0): 3/1680*280 = 0.5, floors to 0
    });

    assert.equal(shaves.length, 1, 'the first touch after the container becomes visible must shave, not be silently dropped');
    assert.deepEqual(shaves[0], { r: 0, c: 0, radius: 1 });
});

test('BrushController - invalidateRect() forces a fresh rect read for the next pointer event', () => {
    const canvas = makeHideableCanvas();
    const shaves = [];
    const controller = new BrushController(canvas, null, (r, c, radius) => shaves.push({ r, c, radius }), GridGeometry.default());

    canvas.reveal({ left: 0, top: 0, width: 1680, height: 1314 });
    controller.invalidateRect();

    canvas.dispatch('mousedown', { clientX: 3, clientY: 3 });

    assert.equal(shaves.length, 1, 'a mousedown after invalidateRect() must use the current (visible) layout, not the stale one cached at construction');
    assert.deepEqual(shaves[0], { r: 0, c: 0, radius: 1 });
});

test('BrushController - without any refresh trigger, a stale zero-size rect silently drops the pointer event', () => {
    // Documents the underlying mechanism the fix relies on: clientToGrid()
    // correctly refuses to guess at a zero-size rect (this part is intended
    // behavior from #37/TSK-007-03) - the bug was that nothing ever told
    // BrushController the rect had gone stale.
    const canvas = makeHideableCanvas();
    const shaves = [];
    new BrushController(canvas, null, (r, c, radius) => shaves.push({ r, c, radius }), GridGeometry.default());

    canvas.reveal({ left: 0, top: 0, width: 1680, height: 1314 });
    canvas.dispatch('mousedown', { clientX: 3, clientY: 3 }); // no mouseenter, no invalidateRect

    assert.equal(shaves.length, 0, 'sanity check: without any refresh trigger the stale rect is still in play');
});
