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

test('GridGeometry - default and fromStageData factories', () => {
    const defaultGeo = GridGeometry.default();
    assert.equal(defaultGeo.cols, 280);
    assert.equal(defaultGeo.rows, 219);

    const customGeo = GridGeometry.fromStageData({ cols: 100, rows: 50 });
    assert.equal(customGeo.cols, 100);
    assert.equal(customGeo.rows, 50);

    const emptyGeo = GridGeometry.fromStageData({});
    assert.equal(emptyGeo.cols, 280);
    assert.equal(emptyGeo.rows, 219);

    const nullGeo = GridGeometry.fromStageData(null);
    assert.equal(nullGeo.cols, 280);
    assert.equal(nullGeo.rows, 219);
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

    // Invalid rects -> (-1, -1)
    assert.deepEqual(geo.clientToGrid(100, 50, null), { row: -1, col: -1 });
    assert.deepEqual(geo.clientToGrid(100, 50, { left: 0, top: 0, width: 0, height: 100 }), { row: -1, col: -1 });
    assert.deepEqual(geo.clientToGrid(100, 50, { left: 0, top: 0, width: 100, height: 0 }), { row: -1, col: -1 });
});
