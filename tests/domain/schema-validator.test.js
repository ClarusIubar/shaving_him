import test from 'node:test';
import assert from 'node:assert/strict';

import { validateStageData } from '../../src/domain/schema-validator.js';

test('validateStageData - accepts a valid StageDataDTO', () => {
    const validDTO = {
        rows: 2,
        cols: 3,
        totalHairCount: 1,
        hairPositions: [{ r: 0, c: 1 }],
        textGrid: ['abc', 'def'],
        colorGrid: [
            [[255, 0, 0], [0, 255, 0], [0, 0, 255]],
            [[100, 100, 100, 255], [200, 200, 200, 255], [50, 50, 50, 255]]
        ]
    };

    const validated = validateStageData(validDTO);
    assert.equal(validated, validDTO);
});

test('validateStageData - accepts minimal valid StageDataDTO with null colorGrid and empty textGrid', () => {
    const minimalDTO = {
        rows: 1,
        cols: 1,
        totalHairCount: 0,
        hairPositions: [],
        textGrid: [' '],
        colorGrid: null
    };

    assert.equal(validateStageData(minimalDTO), minimalDTO);
});

test('validateStageData - accepts valid DTO with omitted textGrid/colorGrid/totalHairCount', () => {
    const partialDTO = {
        rows: 5,
        cols: 5,
        hairPositions: [{ r: 1, c: 1 }]
    };

    assert.equal(validateStageData(partialDTO), partialDTO);
});

test('validateStageData - rejects non-object or null stageData', () => {
    assert.throws(() => validateStageData(null), /StageData must be a non-null object/);
    assert.throws(() => validateStageData(undefined), /StageData must be a non-null object/);
    assert.throws(() => validateStageData('string'), /StageData must be a non-null object/);
    assert.throws(() => validateStageData(123), /StageData must be a non-null object/);
    assert.throws(() => validateStageData([]), /StageData must be a non-null object/);
});

test('validateStageData - rejects invalid rows or cols', () => {
    assert.throws(() => validateStageData({ rows: 0, cols: 5 }), /rows must be a positive integer/);
    assert.throws(() => validateStageData({ rows: -1, cols: 5 }), /rows must be a positive integer/);
    assert.throws(() => validateStageData({ rows: 1.5, cols: 5 }), /rows must be a positive integer/);
    assert.throws(() => validateStageData({ rows: '2', cols: 5 }), /rows must be a positive integer/);

    assert.throws(() => validateStageData({ rows: 5, cols: 0 }), /cols must be a positive integer/);
    assert.throws(() => validateStageData({ rows: 5, cols: -2 }), /cols must be a positive integer/);
    assert.throws(() => validateStageData({ rows: 5, cols: null }), /cols must be a positive integer/);
});

test('validateStageData - rejects invalid totalHairCount', () => {
    const base = { rows: 2, cols: 2, hairPositions: [], textGrid: ['..', '..'] };
    assert.throws(() => validateStageData({ ...base, totalHairCount: -1 }), /totalHairCount must be a non-negative integer/);
    assert.throws(() => validateStageData({ ...base, totalHairCount: 1.2 }), /totalHairCount must be a non-negative integer/);
    assert.throws(() => validateStageData({ ...base, totalHairCount: '0' }), /totalHairCount must be a non-negative integer/);
});

test('validateStageData - rejects invalid or out-of-bounds hairPositions', () => {
    const base = { rows: 2, cols: 2, totalHairCount: 1, textGrid: ['..', '..'] };
    assert.throws(() => validateStageData({ ...base, hairPositions: null }), /hairPositions must be an array/);
    assert.throws(() => validateStageData({ ...base, hairPositions: 'invalid' }), /hairPositions must be an array/);

    assert.throws(() => validateStageData({ ...base, hairPositions: [{ r: 2, c: 0 }] }), /out of bounds/);
    assert.throws(() => validateStageData({ ...base, hairPositions: [{ r: 0, c: 2 }] }), /out of bounds/);
    assert.throws(() => validateStageData({ ...base, hairPositions: [{ r: -1, c: 0 }] }), /out of bounds/);
    assert.throws(() => validateStageData({ ...base, hairPositions: [{ r: 0, c: -1 }] }), /out of bounds/);
    assert.throws(() => validateStageData({ ...base, hairPositions: [null] }), /hairPosition at index 0 must be an object with numeric r and c/);
    assert.throws(() => validateStageData({ ...base, hairPositions: [{ r: '1', c: 1 }] }), /hairPosition at index 0 must be an object with numeric r and c/);
});

test('validateStageData - rejects invalid textGrid format', () => {
    const base = { rows: 2, cols: 2, totalHairCount: 0, hairPositions: [] };
    assert.throws(() => validateStageData({ ...base, textGrid: 'invalid' }), /textGrid must be an array/);
    assert.throws(() => validateStageData({ ...base, textGrid: ['..', 123] }), /textGrid\[1\] must be a string/);
});

test('validateStageData - rejects invalid colorGrid dimensions and channel values', () => {
    const base = { rows: 2, cols: 2, totalHairCount: 0, hairPositions: [], textGrid: ['..', '..'] };
    assert.throws(() => validateStageData({ ...base, colorGrid: 'invalid' }), /colorGrid must be an array or null/);
    assert.throws(() => validateStageData({ ...base, colorGrid: ['invalid'] }), /colorGrid\[0\] must be an array/);
    assert.throws(() => validateStageData({ ...base, colorGrid: [[[256, 0, 0], [0, 0, 0]], [[0, 0, 0], [0, 0, 0]]] }), /RGB channel value out of range/);
    assert.throws(() => validateStageData({ ...base, colorGrid: [[[-1, 0, 0], [0, 0, 0]], [[0, 0, 0], [0, 0, 0]]] }), /RGB channel value out of range/);
    assert.throws(() => validateStageData({ ...base, colorGrid: [['invalid', [0, 0, 0]], [[0, 0, 0], [0, 0, 0]]] }), /color cell at \(0, 0\) must be an array of 3 or 4 channel numbers/);
    assert.throws(() => validateStageData({ ...base, colorGrid: [[[1, 2], [0, 0, 0]], [[0, 0, 0], [0, 0, 0]]] }), /color cell at \(0, 0\) must be an array of 3 or 4 channel numbers/);
    assert.throws(() => validateStageData({ ...base, colorGrid: [[[1, 2, 'NaN'], [0, 0, 0]], [[0, 0, 0], [0, 0, 0]]] }), /RGB channel value out of range/);
});
