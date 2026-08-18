import test from 'node:test';
import assert from 'node:assert/strict';

import { rasterizeLine } from '../../src/domain/line-rasterizer.js';
import { GridGeometry } from '../../src/domain/grid-geometry.js';

test('Fuzzing - rasterizeLine mathematical invariant verification (1000 random line vectors)', () => {
    // Seeded/pseudo-random deterministic sequence generator for reproducible fuzzing
    let seed = 42;
    function nextRandomInt(min, max) {
        seed = (seed * 9301 + 49297) % 233280;
        const rnd = seed / 233280;
        return Math.floor(min + rnd * (max - min + 1));
    }

    const ITERATIONS = 1000;

    for (let i = 0; i < ITERATIONS; i++) {
        const r0 = nextRandomInt(-100, 100);
        const c0 = nextRandomInt(-100, 100);
        const r1 = nextRandomInt(-100, 100);
        const c1 = nextRandomInt(-100, 100);

        const points = rasterizeLine(r0, c0, r1, c1);

        // Invariant 1: points must not be empty
        assert.ok(points.length > 0, `Line from (${r0}, ${c0}) to (${r1}, ${c1}) produced empty points`);

        // Invariant 2: Start point and End point match
        assert.equal(points[0].r, r0);
        assert.equal(points[0].c, c0);
        assert.equal(points[points.length - 1].r, r1);
        assert.equal(points[points.length - 1].c, c1);

        // Invariant 3: Expected Chebyshev length
        const expectedLength = Math.max(Math.abs(r1 - r0), Math.abs(c1 - c0)) + 1;
        assert.equal(points.length, expectedLength, `Length mismatch for line (${r0}, ${c0}) -> (${r1}, ${c1})`);

        // Invariant 4: 8-connected Bresenham continuity
        for (let j = 0; j < points.length - 1; j++) {
            const dr = Math.abs(points[j + 1].r - points[j].r);
            const dc = Math.abs(points[j + 1].c - points[j].c);
            const chebyshevDist = Math.max(dr, dc);
            assert.equal(chebyshevDist, 1, `Discontinuity detected at index ${j}: step dist was ${chebyshevDist}`);
        }
    }
});

test('Fuzzing - GridGeometry.clientToGrid robustness under 500 randomized coordinates and canvas scales', () => {
    let seed = 1337;
    function nextRandomFloat(min, max) {
        seed = (seed * 9301 + 49297) % 233280;
        const rnd = seed / 233280;
        return min + rnd * (max - min);
    }

    const geometry = new GridGeometry(280, 219, 6, 6);
    const ITERATIONS = 500;

    for (let i = 0; i < ITERATIONS; i++) {
        const clientX = nextRandomFloat(-500, 2500);
        const clientY = nextRandomFloat(-500, 2000);
        const rectWidth = nextRandomFloat(100, 1920);
        const rectHeight = nextRandomFloat(100, 1080);
        const rectLeft = nextRandomFloat(0, 500);
        const rectTop = nextRandomFloat(0, 500);

        const rect = {
            left: rectLeft,
            top: rectTop,
            width: rectWidth,
            height: rectHeight,
            right: rectLeft + rectWidth,
            bottom: rectTop + rectHeight
        };

        const result = geometry.clientToGrid(clientX, clientY, rect);

        // Invariant 1: Returns object with integer row and col
        assert.ok(typeof result.row === 'number' && Number.isFinite(result.row));
        assert.ok(typeof result.col === 'number' && Number.isFinite(result.col));
        assert.ok(!Number.isNaN(result.row));
        assert.ok(!Number.isNaN(result.col));

        // Invariant 2: Coordinates inside the bounding box map into valid grid cells
        if (clientX >= rect.left && clientX < rect.right && clientY >= rect.top && clientY < rect.bottom) {
            assert.ok(result.col >= 0 && result.col < geometry.cols);
            assert.ok(result.row >= 0 && result.row < geometry.rows);
        } else {
            assert.equal(result.row, -1);
            assert.equal(result.col, -1);
        }
    }
});
