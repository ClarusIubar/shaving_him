import test from 'node:test';
import assert from 'node:assert/strict';

import { HairGrid } from '../../src/domain/hair-grid.js';
import { ScoreCalculator } from '../../src/domain/score-calculator.js';
import { ShaveSession, SessionStatus } from '../../src/domain/shave-session.js';

test('HairGrid - initializes and shaves correctly', () => {
    const hairPositions = [
        { r: 0, c: 0 },
        { r: 0, c: 1 },
        { r: 1, c: 1 },
        { r: 5, c: 5 }
    ];

    const grid = new HairGrid(hairPositions, 10, 10);
    assert.equal(grid.totalCount, 4);
    assert.equal(grid.remainingCount, 4);
    assert.equal(grid.has(0, 0), true);
    assert.equal(grid.has(2, 2), false);

    // Shave at (0, 0) with radius 1
    const removed = grid.shave(0, 0, 1);
    assert.equal(removed, 3); // (0,0), (0,1), (1,1) removed
    assert.equal(grid.remainingCount, 1);
    assert.equal(grid.has(5, 5), true);
});

test('ScoreCalculator - calculates streak and bonuses', () => {
    const calc = new ScoreCalculator();
    calc.addShave(5);
    assert.equal(calc.baseScore, 5);

    const finalResult = calc.calculateFinalScore(10, 0); // 10s left, 0 remaining
    assert.equal(finalResult.baseScore, 5);
    assert.equal(finalResult.timeBonus, 50);
    assert.equal(finalResult.allClearBonus, 500);
    assert.equal(finalResult.totalScore, 555);
});

test('ShaveSession - state transitions and timer ticks', () => {
    const stageData = {
        rows: 10,
        cols: 10,
        hairPositions: [{ r: 2, c: 2 }]
    };

    const session = new ShaveSession(stageData, 60);
    assert.equal(session.status, SessionStatus.INIT);

    session.start();
    assert.equal(session.status, SessionStatus.RUNNING);

    // Shave the hair
    const removed = session.shave(2, 2, 1);
    assert.equal(removed, 1);
    assert.equal(session.status, SessionStatus.WON);

    const snapshot = session.getSnapshot();
    assert.equal(snapshot.percentageCleared, 100);
    assert.equal(snapshot.status, SessionStatus.WON);
});
