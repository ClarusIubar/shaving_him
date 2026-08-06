/**
 * TSK-008-06: particles must animate independently of shave input (so they
 * don't freeze mid-flight the instant the user stops dragging) and must not
 * leave a trail - the cell a particle previously occupied has to be
 * repainted from the actual stage/hair data before the particle moves on.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { GridGeometry } from '../../src/domain/grid-geometry.js';
import { CanvasRenderer } from '../../src/ui/canvas-renderer.js';

/** Captures every fillRect/fillText call so tests can assert what got
 *  repainted, and lets the test drive frames on demand instead of relying
 *  on a real animation clock. */
const makeHarness = (geometry) => {
    const calls = [];
    const rafQueue = [];
    global.requestAnimationFrame = (cb) => { rafQueue.push(cb); return rafQueue.length; };

    const canvas = {
        width: geometry.width, height: geometry.height, style: {},
        getContext: () => ({
            scale() {},
            fillRect(x, y, w, h) { calls.push({ type: 'rect', x, y }); },
            fillText(ch, x, y) { calls.push({ type: 'text', x, y }); }
        })
    };

    const renderer = new CanvasRenderer(canvas, geometry);
    const stageData = {
        cols: geometry.cols, rows: geometry.rows,
        textGrid: Array.from({ length: geometry.rows }, () => '.'.repeat(geometry.cols)),
        colorGrid: null
    };
    const hairGrid = { has: () => false };

    const runFrames = (n) => {
        for (let i = 0; i < n; i++) {
            const cb = rafQueue.shift();
            if (!cb) break;
            cb();
        }
    };

    const cleanup = () => { delete global.requestAnimationFrame; };

    return { renderer, stageData, hairGrid, calls, rafQueue, runFrames, cleanup };
};

test('CanvasRenderer - particles keep animating on their own after shaving stops', () => {
    const geometry = new GridGeometry(10, 10, 6, 6);
    const { renderer, stageData, hairGrid, rafQueue, runFrames, cleanup } = makeHarness(geometry);

    // One shave spawns particles; nothing else ever calls render/requestRender again.
    renderer.render(stageData, hairGrid, [{ r: 2, c: 2 }]);
    assert.ok(renderer.particles.length > 0, 'a shave must spawn particles');
    assert.ok(rafQueue.length > 0, 'the particle loop must schedule its own animation frame');

    // Drive frames purely from the particle loop's own scheduling, with no
    // further shave/render input, until every particle has decayed.
    let guard = 0;
    while (renderer.particles.length > 0 && guard < 50) {
        runFrames(1);
        guard++;
    }

    assert.equal(renderer.particles.length, 0, 'particles must fully decay on their own without further input');
    assert.ok(guard > 1, 'sanity check: this took more than a single frame, i.e. the loop actually kept running');

    cleanup();
});

test('CanvasRenderer - particle loop stops scheduling frames once idle (no leaked rAF)', () => {
    const geometry = new GridGeometry(10, 10, 6, 6);
    const { renderer, stageData, hairGrid, rafQueue, runFrames, cleanup } = makeHarness(geometry);

    renderer.render(stageData, hairGrid, [{ r: 1, c: 1 }]);

    let guard = 0;
    while (renderer.particles.length > 0 && guard < 50) {
        runFrames(1);
        guard++;
    }

    assert.equal(rafQueue.length, 0, 'no animation frame should remain queued once particles are gone');
    cleanup();
});

test('CanvasRenderer - repaints the cell a particle leaves behind instead of trailing it', () => {
    const geometry = new GridGeometry(10, 10, 6, 6);
    const { renderer, stageData, hairGrid, calls, rafQueue, runFrames, cleanup } = makeHarness(geometry);

    renderer.render(stageData, hairGrid, [{ r: 2, c: 2 }]);
    const particle = renderer.particles[0];
    particle.x = 12; particle.y = 12; // cell (2,2)
    particle.vx = 0; particle.vy = 0; // stay put for the first frame
    particle.decay = 0; // stay alive across the assertions

    runFrames(1); // frame 1: particle actually gets painted at (12,12) for the first time

    // Now let it move into a new cell on the next frame.
    particle.vx = 6; particle.vy = 0; // -> lands in cell (2,3) at pixel (18,12)
    calls.length = 0;
    runFrames(1); // frame 2: must restore (12,12) before painting the new position

    const restoredOldCell = calls.some(c => c.type === 'rect' && c.x === 12 && c.y === 12);
    assert.ok(restoredOldCell, 'the cell the particle just left must be repainted from stage data');

    cleanup();
});
