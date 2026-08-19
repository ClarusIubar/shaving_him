import test from 'node:test';
import assert from 'node:assert/strict';

import { GameOrchestrator } from '../../src/app/game-orchestrator.js';
import { ShaveSession, SessionStatus } from '../../src/domain/shave-session.js';

function createMockPipeline() {
    return {
        loadStage: async (source, onProgress) => {
            if (typeof onProgress === 'function') onProgress('Loading mock stage...', 50);
            return {
                cols: 5,
                rows: 5,
                totalHairCount: 1,
                hairPositions: [{ r: 1, c: 1 }],
                textGrid: []
            };
        }
    };
}

test('GameOrchestrator - fails closed without pipeline', () => {
    assert.throws(() => new GameOrchestrator(null), /GameOrchestrator requires a stage pipeline/);
});

test('GameOrchestrator - registers and unregisters update and game over listeners cleanly', async () => {
    const pipeline = createMockPipeline();
    const orchestrator = new GameOrchestrator(pipeline);

    // Initial null session safety
    assert.equal(orchestrator.getCurrentHairView(), null);
    assert.equal(orchestrator.timerId, null);
    orchestrator.timerId = 123;
    assert.equal(orchestrator.timerId, 123);
    orchestrator.timerId = null;

    orchestrator.notifyUpdate();
    orchestrator.notifyGameOver();
    orchestrator.restart();

    let updateCount1 = 0;
    let updateCount2 = 0;
    const l1 = () => { updateCount1++; };
    const l2 = () => { updateCount2++; };

    orchestrator.onUpdate(l1);
    orchestrator.onUpdate(l2);

    await orchestrator.loadAndStartStage('mock', 60);
    assert.equal(updateCount1, 1);
    assert.equal(updateCount2, 1);

    // Unregister l1
    orchestrator.offUpdate(l1);
    orchestrator.notifyUpdate(null, false);
    assert.equal(updateCount1, 1);
    assert.equal(updateCount2, 2);

    // Unregister non-existent listener is a harmless no-op
    orchestrator.offUpdate(() => {});

    // GameOver listeners
    let overCount = 0;
    const overListener = () => { overCount++; };
    orchestrator.onGameOver(overListener);
    orchestrator.notifyGameOver();
    assert.equal(overCount, 1);

    orchestrator.offGameOver(overListener);
    orchestrator.notifyGameOver();
    assert.equal(overCount, 1);
});

test('GameOrchestrator - onUpdate event payload exposes read-only hair view', async () => {
    const pipeline = createMockPipeline();
    const orchestrator = new GameOrchestrator(pipeline);

    let eventPayload = null;
    orchestrator.onUpdate((evt) => {
        eventPayload = evt;
    });

    await orchestrator.loadAndStartStage('mock', 60);
    assert.ok(eventPayload);
    assert.ok(typeof eventPayload.hairView.has === 'function');
    assert.equal(eventPayload.hairView.has(1, 1), true);
    assert.equal(eventPayload.hairView.has(0, 0), false);

    const hairView = orchestrator.getCurrentHairView();
    assert.equal(hairView.has(1, 1), true);
});

test('GameOrchestrator - resets combo immediately on shaving empty cell after streak', async () => {
    const pipeline = createMockPipeline();
    const orchestrator = new GameOrchestrator(pipeline);
    await orchestrator.loadAndStartStage('mock', 60);

    orchestrator.session.scoreCalculator.shaveStreak = 5;

    // Shave empty cell at (0, 0)
    const { removed } = orchestrator.shave(0, 0, 0);
    assert.equal(removed, 0);
    assert.equal(orchestrator.session.scoreCalculator.shaveStreak, 0);
});

test('GameOrchestrator - timer tick interval, shaving guards, winning shave and restart', async () => {
    let intervalCb = null;
    const originalSetInterval = global.setInterval;
    global.setInterval = (cb, ms) => {
        intervalCb = cb;
        return { unref: () => {} };
    };

    try {
        const pipeline = createMockPipeline();
        const orchestrator = new GameOrchestrator(pipeline);

        let gameOverFired = false;
        orchestrator.onGameOver(() => { gameOverFired = true; });

        await orchestrator.loadAndStartStage('mock', 2);
        assert.ok(intervalCb);

        // Tick 1s
        intervalCb();
        assert.equal(orchestrator.session.timeLeft, 1);

        // Tick 2s -> TIMEOUT
        intervalCb();
        assert.equal(orchestrator.session.status, SessionStatus.TIMEOUT);
        assert.equal(gameOverFired, true);

        // Shave when not RUNNING returns 0
        const idleShave = orchestrator.shave(1, 1, 1);
        assert.equal(idleShave.removed, 0);

        // Restart
        orchestrator.restart();
        assert.equal(orchestrator.session.status, SessionStatus.RUNNING);

        // Winning shave
        const winShave = orchestrator.shave(1, 1, 1);
        assert.equal(winShave.removed, 1);
        assert.equal(orchestrator.session.status, SessionStatus.WON);
    } finally {
        global.setInterval = originalSetInterval;
    }
});
