import test from 'node:test';
import assert from 'node:assert/strict';

import { HairGrid } from '../../src/domain/hair-grid.js';
import { ScoreCalculator } from '../../src/domain/score-calculator.js';
import { GamePolicy } from '../../src/domain/game-policy.js';
import { GridGeometry } from '../../src/domain/grid-geometry.js';

test('ScoreCalculator - high combo multipliers and consecutive streak scaling', () => {
    const calc = new ScoreCalculator();

    // 10 consecutive non-empty shaves
    for (let i = 0; i < 10; i++) {
        calc.addShave(2);
    }
    assert.equal(calc.shaveStreak, 10);
    assert.ok(calc.baseScore > 20);

    // Final score with 0 remaining vs 1 remaining
    const winScore = calc.calculateFinalScore(15, 0);
    assert.equal(winScore.timeBonus, 75);
    assert.equal(winScore.allClearBonus, 500);
    assert.equal(winScore.totalScore, calc.baseScore + 75 + 500);

    const loseScore = calc.calculateFinalScore(0, 5);
    assert.equal(loseScore.timeBonus, 0);
    assert.equal(loseScore.allClearBonus, 0);
    assert.equal(loseScore.totalScore, calc.baseScore);
});

test('HairGrid - 1x1 minimal grid edge conditions', () => {
    const grid = new HairGrid(1, 1, [{ r: 0, c: 0 }]);
    assert.equal(grid.totalHairCount, 1);
    assert.equal(grid.remainingHairs, 1);
    assert.equal(grid.has(0, 0), true);
    assert.equal(grid.has(0, 1), false);
    assert.equal(grid.has(1, 0), false);

    // Shave radius 0 (center only)
    const { count, dirtyCells } = grid.shave(0, 0, 0);
    assert.equal(count, 1);
    assert.deepEqual(dirtyCells, [{ r: 0, c: 0 }]);
    assert.equal(grid.remainingHairs, 0);
    assert.equal(grid.getClearedPercentage(), 100);

    // Repeated shave on empty 1x1 grid
    const secondShave = grid.shave(0, 0, 0);
    assert.equal(secondShave.count, 0);
    assert.equal(secondShave.dirtyCells.length, 0);
});

test('HairGrid - massive radius exceeding grid bounds and out-of-bounds centers', () => {
    const grid = new HairGrid(5, 5, [
        { r: 0, c: 0 },
        { r: 4, c: 4 },
        { r: 2, c: 2 }
    ]);

    // Shave outside grid: (-10, -10) with radius 1
    const oobShave = grid.shave(-10, -10, 1);
    assert.equal(oobShave.count, 0);
    assert.equal(oobShave.dirtyCells.length, 0);

    // Massive radius 100 shaves all remaining cells cleanly without index errors
    const massShave = grid.shave(2, 2, 100);
    assert.equal(massShave.count, 3);
    assert.equal(grid.remainingHairs, 0);
    assert.equal(grid.getClearedPercentage(), 100);
});

test('HairGrid - large dense grid stress test', () => {
    const rows = 100;
    const cols = 100;
    const hairPositions = [];
    for (let r = 0; r < rows; r += 2) {
        for (let c = 0; c < cols; c += 2) {
            hairPositions.push({ r, c });
        }
    }

    const grid = new HairGrid(cols, rows, hairPositions);
    assert.equal(grid.totalHairCount, 2500);
    assert.equal(grid.remainingHairs, 2500);

    // Shave 10x10 patch in the middle
    const res = grid.shave(50, 50, 5);
    assert.ok(res.count > 0);
    assert.ok(res.dirtyCells.length > 0);
    assert.equal(grid.remainingHairs, 2500 - res.count);
});

test('GamePolicy - boundary evaluations for victory status and clear ratios', () => {
    const policy = new GamePolicy();

    // 0 remaining hairs -> victory
    assert.equal(policy.isVictory({ remainingHairs: 0, percentageCleared: 100 }), true);

    // 1 remaining hair with 99.9% cleared -> not victory
    assert.equal(policy.isVictory({ remainingHairs: 1, percentageCleared: 99.9 }), false);

    // Null or undefined snapshot
    assert.equal(policy.isVictory(null), false);
    assert.equal(policy.isVictory({}), false);
});
