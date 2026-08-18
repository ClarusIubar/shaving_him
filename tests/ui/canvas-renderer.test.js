import test from 'node:test';
import assert from 'node:assert/strict';

import { CanvasRenderer } from '../../src/ui/canvas-renderer.js';
import { HairGrid } from '../../src/domain/hair-grid.js';
import { createMockCanvasElement } from '../helpers/dom-mock-harness.js';
import { GridGeometry } from '../../src/domain/grid-geometry.js';

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

test('CanvasRenderer - constructor variations and particle accessors', () => {
    const canvas = createMockCanvasElement(600, 600);
    const mockParticle = {
        particles: [{ life: 1 }],
        rafId: 123,
        spawn: () => {}
    };

    // 1. null geometry fallback
    const r1 = new CanvasRenderer(canvas, null);
    assert.equal(r1.cols, 280);
    assert.equal(r1.rows, 219);

    // 2. (cols, rows, customParticleSystem)
    const r2 = new CanvasRenderer(canvas, 50, 40, mockParticle);
    assert.equal(r2.cols, 50);
    assert.equal(r2.rows, 40);
    assert.equal(r2.particleSystem, mockParticle);

    // 3. particles and particleRafId getters/setters
    assert.equal(r2.particleRafId, 123);
    r2.particleRafId = 456;
    assert.equal(mockParticle.rafId, 456);

    assert.equal(r2.particles.length, 1);
    r2.particles = [];
    assert.equal(mockParticle.particles.length, 0);

    // 4. (cols, rows, particleSystem) where 3rd arg is particleSystem
    const r3 = new CanvasRenderer(canvas, 10, 10, mockParticle);
    assert.equal(r3.particleSystem, mockParticle);
});
