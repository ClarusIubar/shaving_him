import test from 'node:test';
import assert from 'node:assert/strict';

import { ParticleSystem } from '../../src/ui/particle-system.js';
import { CanvasRenderer } from '../../src/ui/canvas-renderer.js';

test('ParticleSystem - initializes with default and custom options', () => {
    const defaultPs = new ParticleSystem();
    assert.equal(defaultPs.particles.length, 0);
    assert.equal(defaultPs.count, 0);

    const customPs = new ParticleSystem({
        fontW: 6,
        fontH: 6,
        onRestoreCell: () => {},
        onRenderGlyph: () => {}
    });

    assert.equal(customPs.particles.length, 0);
    assert.equal(customPs.count, 0);
});

test('ParticleSystem - spawns particles capped at max limit and ignores empty inputs', () => {
    const ps = new ParticleSystem({
        fontW: 6,
        fontH: 6,
        maxParticles: 10,
        onRestoreCell: () => {},
        onRenderGlyph: () => {}
    });

    ps.spawn(null);
    ps.spawn([]);
    assert.equal(ps.count, 0);

    const cells = new Array(20).fill(null).map((_, i) => ({ r: i, c: i }));
    ps.spawn(cells);

    assert.ok(ps.particles.length <= 10);
    assert.ok(ps.particles.length > 0);
});

test('ParticleSystem - updateAndRender restores cells and renders alive glyphs', () => {
    const restoredCells = [];
    const renderedGlyphs = [];

    const ps = new ParticleSystem({
        fontW: 6,
        fontH: 6,
        onRestoreCell: (r, c) => restoredCells.push({ r, c }),
        onRenderGlyph: (char, x, y, alpha) => renderedGlyphs.push({ char, x, y, alpha })
    });

    // Empty list early return
    ps.updateAndRender();
    assert.equal(restoredCells.length, 0);

    ps.particles.push({
        x: 10,
        y: 10,
        vx: 1,
        vy: 1,
        life: 0.5,
        decay: 0.1,
        char: '*',
        lastCellR: 1,
        lastCellC: 1
    });

    ps.updateAndRender();

    assert.equal(restoredCells.length, 1);
    assert.deepEqual(restoredCells[0], { r: 1, c: 1 });
    assert.equal(renderedGlyphs.length, 1);
    assert.equal(renderedGlyphs[0].char, '*');
});

test('ParticleSystem - removes dead particles when life reaches zero', () => {
    const ps = new ParticleSystem({
        fontW: 6,
        fontH: 6,
        onRestoreCell: () => {},
        onRenderGlyph: () => {}
    });

    ps.particles.push({
        x: 10,
        y: 10,
        vx: 0,
        vy: 0,
        life: 0.05,
        decay: 0.1,
        char: '.',
        lastCellR: null,
        lastCellC: null
    });

    ps.updateAndRender();
    assert.equal(ps.particles.length, 0);
});

test('ParticleSystem - ensureLoop schedules rAF until all particles decay', () => {
    let rafCallbacks = [];
    global.requestAnimationFrame = (cb) => {
        rafCallbacks.push(cb);
        return rafCallbacks.length;
    };

    try {
        const ps = new ParticleSystem({
            fontW: 6,
            fontH: 6,
            onRestoreCell: () => {},
            onRenderGlyph: () => {}
        });

        ps.particles.push({
            x: 0, y: 0, vx: 0, vy: 0, life: 1, decay: 0.5, char: '*', lastCellR: null, lastCellC: null
        });

        ps.ensureLoop();
        assert.equal(rafCallbacks.length, 1);

        // Run frame 1
        const cb1 = rafCallbacks.pop();
        cb1();
        assert.equal(ps.particles[0].life, 0.5);
        assert.equal(rafCallbacks.length, 1);

        // Run frame 2 (particle dies)
        const cb2 = rafCallbacks.pop();
        cb2();
        assert.equal(ps.particles.length, 0);
        assert.equal(rafCallbacks.length, 0, 'Loop must stop when no particles remain');
    } finally {
        delete global.requestAnimationFrame;
    }
});

test('ParticleSystem - clear empties particle array and resets timer id', () => {
    const ps = new ParticleSystem();
    ps.particles = [{ x: 1, y: 1 }];
    ps.rafId = 123;

    ps.clear();
    assert.equal(ps.particles.length, 0);
    assert.equal(ps.rafId, null);
});

test('CanvasRenderer - delegates particle operations to ParticleSystem', () => {
    const mockCanvas = {
        width: 100, height: 100, style: {},
        getContext: () => ({ scale: () => {}, font: '', textBaseline: '', fillStyle: '', fillText: () => {} })
    };
    const renderer = new CanvasRenderer(mockCanvas);

    assert.ok(renderer.particleSystem instanceof ParticleSystem);
    assert.deepEqual(renderer.particles, []);

    renderer.particles = [{ x: 5, y: 5, vx: 0, vy: 0, life: 1, decay: 0.1, char: '*', lastCellR: null, lastCellC: null }];
    assert.equal(renderer.particles.length, 1);

    renderer.particleRafId = 99;
    assert.equal(renderer.particleRafId, 99);

    renderer.updateAndRenderParticles();
    assert.ok(renderer.particles.length >= 0);

    renderer.ensureParticleLoop();
});
