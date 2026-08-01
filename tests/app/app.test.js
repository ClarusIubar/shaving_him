import test from 'node:test';
import assert from 'node:assert/strict';

import { GameOrchestrator } from '../../src/app/game-orchestrator.js';
import { StagePipeline } from '../../src/app/stage-pipeline.js';
import { SessionStatus } from '../../src/domain/shave-session.js';

test('StagePipeline - loads stage DTO cleanly', async () => {
    const pipeline = new StagePipeline();
    const stageData = await pipeline.loadStage({
        rows: 2, cols: 2, hair: [{ r: 0, c: 0 }], text: ['A'], colors: []
    });

    assert.equal(stageData.rows, 2);
    assert.equal(stageData.totalHairCount, 1);
});

test('GameOrchestrator - loadAndStartStage, shave, and callbacks', async () => {
    const orchestrator = new GameOrchestrator();
    let updatedSnapshot = null;
    let gameOverSnapshot = null;

    orchestrator.onUpdate(snapshot => { updatedSnapshot = snapshot; });
    orchestrator.onGameOver(snapshot => { gameOverSnapshot = snapshot; });

    const mockStage = {
        rows: 5, cols: 5, hair: [{ r: 1, c: 1 }], text: ['A'], colors: []
    };

    await orchestrator.loadAndStartStage(mockStage, 10);
    assert.notEqual(updatedSnapshot, null);
    assert.equal(updatedSnapshot.status, SessionStatus.RUNNING);

    // Perform shave
    orchestrator.shave(1, 1, 1);
    assert.equal(updatedSnapshot.status, SessionStatus.WON);
    assert.notEqual(gameOverSnapshot, null);

    // Test restart functionality: stage must restore initial hair count (1) after winning
    orchestrator.restart();
    assert.equal(orchestrator.session.status, SessionStatus.RUNNING);
    assert.equal(orchestrator.session.getSnapshot().remainingHairs, 1);

    orchestrator.stopTimer();
});

test('BrushController - notifies onRadiusChange callback when setRadius is called', async () => {
    const { BrushController } = await import('../../src/ui/brush-controller.js');
    const controller = new BrushController(null, null, () => {});

    let changedRadius = null;
    controller.onRadiusChange((newRadius) => {
        changedRadius = newRadius;
    });

    controller.setRadius(3);
    assert.equal(changedRadius, 3);
});

test('GameOrchestrator - ignores shave() when session status is not RUNNING', async () => {
    const orchestrator = new GameOrchestrator();
    let updateCalled = false;
    orchestrator.onUpdate(() => { updateCalled = true; });

    const mockStage = {
        rows: 5, cols: 5, hair: [{ r: 1, c: 1 }], text: ['A'], colors: []
    };

    await orchestrator.loadAndStartStage(mockStage, 10);
    orchestrator.session.pause(); // Pause session

    updateCalled = false;
    orchestrator.shave(1, 1, 1);
    assert.equal(updateCalled, false);
    assert.equal(orchestrator.session.getSnapshot().remainingHairs, 1);

    orchestrator.stopTimer();
});
