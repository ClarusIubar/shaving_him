import test from 'node:test';
import assert from 'node:assert/strict';

import { rasterizeLine } from '../../src/domain/line-rasterizer.js';

test('rasterizeLine - single point when start equals end', () => {
    const points = [];
    rasterizeLine(2, 3, 2, 3, (r, c) => points.push({ r, c }));
    assert.deepEqual(points, [{ r: 2, c: 3 }]);
});

test('rasterizeLine - returns array when callback is omitted', () => {
    const points = rasterizeLine(0, 0, 0, 3);
    assert.deepEqual(points, [
        { r: 0, c: 0 },
        { r: 0, c: 1 },
        { r: 0, c: 2 },
        { r: 0, c: 3 }
    ]);
});

test('rasterizeLine - vertical line (top to bottom and bottom to top)', () => {
    const pointsDown = rasterizeLine(1, 2, 4, 2);
    assert.deepEqual(pointsDown, [
        { r: 1, c: 2 },
        { r: 2, c: 2 },
        { r: 3, c: 2 },
        { r: 4, c: 2 }
    ]);

    const pointsUp = rasterizeLine(4, 2, 1, 2);
    assert.deepEqual(pointsUp, [
        { r: 4, c: 2 },
        { r: 3, c: 2 },
        { r: 2, c: 2 },
        { r: 1, c: 2 }
    ]);
});

test('rasterizeLine - horizontal line (left to right and right to left)', () => {
    const pointsRight = rasterizeLine(3, 1, 3, 4);
    assert.deepEqual(pointsRight, [
        { r: 3, c: 1 },
        { r: 3, c: 2 },
        { r: 3, c: 3 },
        { r: 3, c: 4 }
    ]);

    const pointsLeft = rasterizeLine(3, 4, 3, 1);
    assert.deepEqual(pointsLeft, [
        { r: 3, c: 4 },
        { r: 3, c: 3 },
        { r: 3, c: 2 },
        { r: 3, c: 1 }
    ]);
});

test('rasterizeLine - diagonal line in all four quadrants', () => {
    // Quadrant 1: dx > 0, dy > 0
    assert.deepEqual(rasterizeLine(0, 0, 2, 2), [
        { r: 0, c: 0 },
        { r: 1, c: 1 },
        { r: 2, c: 2 }
    ]);

    // Quadrant 2: dx < 0, dy > 0
    assert.deepEqual(rasterizeLine(0, 2, 2, 0), [
        { r: 0, c: 2 },
        { r: 1, c: 1 },
        { r: 2, c: 0 }
    ]);

    // Quadrant 3: dx < 0, dy < 0
    assert.deepEqual(rasterizeLine(2, 2, 0, 0), [
        { r: 2, c: 2 },
        { r: 1, c: 1 },
        { r: 0, c: 0 }
    ]);

    // Quadrant 4: dx > 0, dy < 0
    assert.deepEqual(rasterizeLine(2, 0, 0, 2), [
        { r: 2, c: 0 },
        { r: 1, c: 1 },
        { r: 0, c: 2 }
    ]);
});

test('rasterizeLine - non-integer or NaN inputs guard', () => {
    assert.throws(() => rasterizeLine('a', 0, 1, 1), /Coordinates must be finite numbers/);
    assert.throws(() => rasterizeLine(0, null, 1, 1), /Coordinates must be finite numbers/);
    assert.throws(() => rasterizeLine(0, 0, NaN, 1), /Coordinates must be finite numbers/);
});
