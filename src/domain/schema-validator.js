/**
 * Pure Domain Model: SchemaValidator
 * Validates StageDataDTO and SessionSnapshotDTO structural integrity and boundaries.
 * 0% DOM/Canvas dependency.
 */

export function validateStageData(stageData) {
    if (!stageData || typeof stageData !== 'object' || Array.isArray(stageData)) {
        throw new TypeError('StageData must be a non-null object');
    }

    const { rows, cols, totalHairCount, hairPositions, textGrid, colorGrid } = stageData;

    if (!Number.isInteger(rows) || rows <= 0) {
        throw new TypeError('StageData.rows must be a positive integer');
    }

    if (!Number.isInteger(cols) || cols <= 0) {
        throw new TypeError('StageData.cols must be a positive integer');
    }

    if (totalHairCount !== undefined && (!Number.isInteger(totalHairCount) || totalHairCount < 0)) {
        throw new TypeError('StageData.totalHairCount must be a non-negative integer');
    }

    if (!Array.isArray(hairPositions)) {
        throw new TypeError('StageData.hairPositions must be an array');
    }

    for (let i = 0; i < hairPositions.length; i++) {
        const p = hairPositions[i];
        if (!p || typeof p !== 'object' || typeof p.r !== 'number' || typeof p.c !== 'number') {
            throw new TypeError(`hairPosition at index ${i} must be an object with numeric r and c`);
        }
        if (p.r < 0 || p.r >= rows || p.c < 0 || p.c >= cols) {
            throw new RangeError(`hairPosition (${p.r}, ${p.c}) at index ${i} is out of bounds [0..${rows - 1}, 0..${cols - 1}]`);
        }
    }

    if (textGrid !== undefined && textGrid !== null) {
        if (!Array.isArray(textGrid)) {
            throw new TypeError('StageData.textGrid must be an array');
        }
        for (let r = 0; r < textGrid.length; r++) {
            if (typeof textGrid[r] !== 'string') {
                throw new TypeError(`textGrid[${r}] must be a string`);
            }
        }
    }

    if (colorGrid !== undefined && colorGrid !== null) {
        if (!Array.isArray(colorGrid)) {
            throw new TypeError('StageData.colorGrid must be an array or null');
        }
        for (let r = 0; r < colorGrid.length; r++) {
            const row = colorGrid[r];
            if (!Array.isArray(row)) {
                throw new TypeError(`colorGrid[${r}] must be an array`);
            }
            for (let c = 0; c < row.length; c++) {
                const cell = row[c];
                if (!Array.isArray(cell) || (cell.length !== 3 && cell.length !== 4)) {
                    throw new TypeError(`color cell at (${r}, ${c}) must be an array of 3 or 4 channel numbers`);
                }
                for (let ch = 0; ch < cell.length; ch++) {
                    const val = cell[ch];
                    if (typeof val !== 'number' || !Number.isFinite(val) || val < 0 || val > 255) {
                        throw new RangeError(`RGB channel value out of range [0..255] at (${r}, ${c}) channel ${ch}: ${val}`);
                    }
                }
            }
        }
    }

    return stageData;
}

/**
 * Validates SessionSnapshotDTO structure and invariants.
 * @param {any} snapshot 
 * @returns {any}
 */
export function validateSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
        throw new TypeError('Invalid snapshot: must be a non-null object');
    }

    const numericFields = [
        'score', 'shavedHair', 'totalHair', 'initialHairCount',
        'remainingHair', 'streak', 'multiplier', 'timeLeft', 'clearPercentage'
    ];

    for (const field of numericFields) {
        const val = snapshot[field];
        if (typeof val !== 'number' || !Number.isFinite(val) || val < 0) {
            throw new TypeError(`Invalid snapshot: field "${field}" must be a non-negative finite number`);
        }
    }

    const booleanFields = ['isRunning', 'isEnded', 'victory'];
    for (const field of booleanFields) {
        const val = snapshot[field];
        if (typeof val !== 'boolean') {
            throw new TypeError(`Invalid snapshot: field "${field}" must be a boolean`);
        }
    }

    return snapshot;
}
