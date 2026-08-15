import test from 'node:test';
import assert from 'node:assert/strict';

import { CanvasRenderer } from '../../src/ui/canvas-renderer.js';
import { HairGrid } from '../../src/domain/hair-grid.js';
import { createMockCanvasElement } from '../helpers/dom-mock-harness.js';

test('CanvasRenderer - renders full grid, dirty cells, and handles empty dirty list without redraw', () => {
    const canvas = createMockCanvasElement(600, 600);
    const renderer = new CanvasRenderer(canvas);

    const stageData = {
        cols: 10,
        rows: 10,
        textGrid: ['..........', '..........'],
        colorGrid: null
    };
    const hairGrid = new HairGrid(10, 10, [{ r: 0, c: 0 }]);

    // Full render
    renderer.render(stageData, hairGrid);

    // Partial dirty render
    renderer.render(stageData, hairGrid, [{ r: 0, c: 0 }]);

    // Empty dirty array (no-op)
    renderer.render(stageData, hairGrid, []);
});

test('CanvasRenderer - requestRender batches with rAF', () => {
    let rafCb = null;
    global.requestAnimationFrame = (cb) => {
        rafCb = cb;
        return 1;
    };

    try {
        const canvas = createMockCanvasElement(600, 600);
        const renderer = new CanvasRenderer(canvas);

        const stageData = { cols: 5, rows: 5, textGrid: [] };
        const hairGrid = new HairGrid(5, 5, []);

        renderer.requestRender(stageData, hairGrid, [{ r: 1, c: 1 }]);
        assert.ok(rafCb);

        rafCb();
        assert.equal(renderer.rafId, null);
    } finally {
        delete global.requestAnimationFrame;
    }
});
