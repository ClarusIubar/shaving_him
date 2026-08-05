import test from 'node:test';
import assert from 'node:assert/strict';
import { GridGeometry } from '../../src/domain/grid-geometry.js';

test('GridGeometry - value object immutability and dimension properties', () => {
    const geo = new GridGeometry(280, 219, 8, 8);
    assert.equal(geo.cols, 280);
    assert.equal(geo.rows, 219);
    assert.equal(geo.cellWidth, 8);
    assert.equal(geo.cellHeight, 8);
    assert.equal(geo.width, 2240);
    assert.equal(geo.height, 1752);

    assert.equal(geo.contains(0, 0), true);
    assert.equal(geo.contains(218, 279), true);
    assert.equal(geo.contains(-1, 0), false);
    assert.equal(geo.contains(0, 280), false);
});

test('GridGeometry - clientToGrid maps client coordinates to row col correctly across high-DPI scaling', () => {
    const geo = new GridGeometry(280, 219, 8, 8);
    const rect = { left: 100, top: 50, width: 560, height: 438 }; // 2x CSS scaling

    // Top-left pixel (100, 50) -> row: 0, col: 0
    const p1 = geo.clientToGrid(100, 50, rect);
    assert.deepEqual(p1, { row: 0, col: 0 });

    // Midpoint pixel (380, 269) -> row: 109, col: 140
    const p2 = geo.clientToGrid(380, 269, rect);
    assert.equal(p2.col, 140);
    assert.equal(p2.row, 109);

    // Out of bounds -> (-1, -1)
    const pOut = geo.clientToGrid(10, 10, rect);
    assert.deepEqual(pOut, { row: -1, col: -1 });

    // Invalid rect -> (-1, -1)
    const pBad = geo.clientToGrid(100, 50, null);
    assert.deepEqual(pBad, { row: -1, col: -1 });
});
