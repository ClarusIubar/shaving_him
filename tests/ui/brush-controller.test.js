import test from 'node:test';
import assert from 'node:assert/strict';

import { BrushController } from '../../src/ui/brush-controller.js';
import { GridGeometry } from '../../src/domain/grid-geometry.js';
import { createMockCanvasElement, createMockWindow } from '../helpers/dom-mock-harness.js';

test('BrushController - clamps brush radius and calculates grid coords correctly', () => {
    const canvas = createMockCanvasElement(800, 600);
    const cursor = { style: {} };
    let shavedPoint = null;

    const controller = new BrushController(canvas, cursor, (r, c, rad) => {
        shavedPoint = { r, c, rad };
    }, new GridGeometry(100, 100, 8, 6));

    controller.setRadius(1);
    assert.equal(controller.brushRadius, 1);

    controller.setRadius(5);
    assert.equal(controller.brushRadius, 5);

    // Clamp out-of-range radius
    controller.setRadius(0);
    assert.equal(controller.brushRadius, 1);

    controller.setRadius(10);
    assert.equal(controller.brushRadius, 7);

    // Pointer down and drag
    controller.isMouseDown = true;
    controller.handlePointerMove(16, 12);
    assert.ok(shavedPoint);
    assert.equal(shavedPoint.r, 2);
    assert.equal(shavedPoint.c, 2);
});

test('BrushController - full event listeners coverage (mouse, touch, wheel, window)', () => {
    const canvasListeners = {};
    const winListeners = {};

    const mockCanvas = {
        width: 800,
        height: 600,
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
        addEventListener: (evt, fn) => { canvasListeners[evt] = fn; },
        removeEventListener: (evt, fn) => { delete canvasListeners[evt]; }
    };

    const mockCursor = { style: { transform: '', opacity: '', fontSize: '' } };

    let shaveLog = [];
    global.window = {
        addEventListener: (evt, fn) => { winListeners[evt] = fn; },
        removeEventListener: (evt, fn) => { delete winListeners[evt]; }
    };

    try {
        const controller = new BrushController(mockCanvas, mockCursor, (r, c) => {
            shaveLog.push({ r, c });
        });

        // Mouse events
        if (canvasListeners['mousedown']) canvasListeners['mousedown']({ clientX: 10, clientY: 10 });
        if (canvasListeners['mousemove']) canvasListeners['mousemove']({ clientX: 20, clientY: 20 });
        if (canvasListeners['mouseenter']) canvasListeners['mouseenter']();
        if (canvasListeners['mouseleave']) canvasListeners['mouseleave']();

        // Wheel events
        if (canvasListeners['wheel']) canvasListeners['wheel']({ preventDefault: () => {}, deltaY: -10 });
        if (canvasListeners['wheel']) canvasListeners['wheel']({ preventDefault: () => {}, deltaY: 10 });

        // Touch events
        if (canvasListeners['touchstart']) canvasListeners['touchstart']({ cancelable: true, preventDefault: () => {}, touches: [{ clientX: 5, clientY: 5 }] });
        if (canvasListeners['touchmove']) canvasListeners['touchmove']({ cancelable: true, preventDefault: () => {}, touches: [{ clientX: 15, clientY: 15 }] });
        if (canvasListeners['touchend']) canvasListeners['touchend']();

        // Window events
        if (winListeners['resize']) winListeners['resize']();
        if (winListeners['scroll']) winListeners['scroll']();
        if (winListeners['mouseup']) winListeners['mouseup']();

        assert.ok(shaveLog.length > 0);
    } finally {
        delete global.window;
    }
});

test('BrushController - null canvas/cursor and out-of-bounds guards', () => {
    const emptyController = new BrushController(null, null, () => {});
    assert.equal(emptyController.brushRadius, 1);
    emptyController.updateCursorSize();
    emptyController.setRadius(2);

    // Test cursor getter and setter
    const dummyEl = { style: {} };
    emptyController.cursor = dummyEl;
    assert.equal(emptyController.cursor, dummyEl);

    const canvas = createMockCanvasElement(800, 600);
    const controller = new BrushController(canvas, null, () => {});
    controller.isMouseDown = true;
    controller.lastR = 50;
    controller.lastC = 50;
    controller.handlePointerMove(-100, -100); // Out of bounds move
});
