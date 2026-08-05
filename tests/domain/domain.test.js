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

    const grid = new HairGrid(10, 10, hairPositions);
    assert.equal(grid.totalHairCount, 4);
    assert.equal(grid.getRemainingCount(), 4);
    assert.equal(grid.has(0, 0), true);
    assert.equal(grid.has(2, 2), false);

    // Shave at (0, 0) with radius 1
    const { count, dirtyCells } = grid.shave(0, 0, 1);
    assert.equal(count, 3); // (0,0), (0,1), (1,1) removed
    assert.equal(dirtyCells.length, 3);
    assert.equal(grid.getRemainingCount(), 1);
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
    const { removed } = session.shave(2, 2, 1);
    assert.equal(removed, 1);
    assert.equal(session.status, SessionStatus.WON);

    const snapshot = session.getSnapshot();
    assert.equal(snapshot.percentageCleared, 100);
    assert.equal(snapshot.status, SessionStatus.WON);
    assert.equal(snapshot.comboCount, 1, 'getSnapshot() must include comboCount property');

    // Fallback branch test when scoreCalculator is null
    session.scoreCalculator = null;
    const snapNullCalc = session.getSnapshot();
    assert.equal(snapNullCalc.comboCount, 0);
});

test('HairGrid - initializes and shaves correctly', async () => {
    const { GridGeometry } = await import('../../src/domain/grid-geometry.js');
    const grid1 = new HairGrid(new GridGeometry(5, 5), [{ r: 1, c: 1 }]);
    assert.equal(grid1.cols, 5);

    // Explicit (cols, rows) is honoured verbatim - no legacy value-pair coercion.
    const grid2 = new HairGrid(219, 280, []);
    assert.equal(grid2.cols, 219);
    assert.equal(grid2.rows, 280);

    assert.throws(() => new HairGrid(), /HairGrid requires/);

    const grid = new HairGrid(10, 10, [{ r: 1, c: 1 }, { r: 2, c: 2 }]);
    assert.equal(grid.totalHairCount, 2);
    assert.equal(grid.remainingHairs, 2);
    assert.equal(grid.has(10, 10), false);

    const emptyGrid = new HairGrid(5, 5, []);
    assert.equal(emptyGrid.getClearedPercentage(), 100);
});

test('ScoreCalculator - addShave zero count resets streak', () => {
    const calc = new ScoreCalculator();
    calc.addShave(5);
    assert.ok(calc.shaveStreak > 0);

    calc.addShave(0); // Resets streak
    assert.equal(calc.shaveStreak, 0);
});

test('ShaveSession - pause, resume, tick timeout, and uninitialized start error', () => {
    const uninitSession = new ShaveSession();
    assert.throws(() => uninitSession.start(), /Stage not initialized/);

    const snapshotEmpty = uninitSession.getSnapshot();
    assert.equal(snapshotEmpty.remainingHairs, 0);

    const stageData = { rows: 5, cols: 5, hairPositions: [{ r: 1, c: 1 }] };
    const session = new ShaveSession(stageData, 2);
    
    // Shave when IDLE returns 0
    const idleShave = session.shave(1, 1, 1);
    assert.equal(idleShave.removed, 0);

    // Tick when IDLE returns false
    assert.equal(session.tick(), false);

    session.start();
    session.pause();
    assert.equal(session.status, SessionStatus.PAUSED);
    session.resume();
    assert.equal(session.status, SessionStatus.RUNNING);

    // Tick down to 0
    assert.equal(session.tick(), false); // 1s remaining
    assert.equal(session.tick(), true);  // 0s remaining -> TIMEOUT
    assert.equal(session.status, SessionStatus.TIMEOUT);
});
