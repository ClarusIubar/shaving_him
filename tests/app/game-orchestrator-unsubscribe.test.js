/**
 * TSK-008-05: onUpdate/onGameOver can register callbacks but had no way to
 * remove them. A stage-change/re-bootstrap path would accumulate
 * subscriptions and fire the same callback multiple times per event.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { GameOrchestrator } from '../../src/app/game-orchestrator.js';
import { StagePipeline } from '../../src/app/stage-pipeline.js';
import { StageSourceRegistry, JsonSourceHandler } from '../../src/app/stage-source-handlers.js';
import { StaticJsonStageAdapter } from '../../src/adapters/static-json-stage.js';

const makeOrchestrator = () => {
    const pipeline = new StagePipeline(null, null, null, null,
        new StageSourceRegistry([new JsonSourceHandler(new StaticJsonStageAdapter())]));
    return new GameOrchestrator(pipeline);
};

test('GameOrchestrator - offUpdate() stops a previously registered callback from firing', async () => {
    const orchestrator = makeOrchestrator();
    let calls = 0;
    const listener = () => { calls++; };

    orchestrator.onUpdate(listener);
    await orchestrator.loadAndStartStage({ rows: 2, cols: 2, hair: [], text: ['A'], colors: [] }, 10);
    assert.equal(calls, 1, 'sanity check: the listener fires while still subscribed');

    orchestrator.offUpdate(listener);
    orchestrator.notifyUpdate(null, false);
    assert.equal(calls, 1, 'offUpdate() must stop further notifications to the removed listener');

    orchestrator.stopTimer();
});

test('GameOrchestrator - offGameOver() stops a previously registered callback from firing', async () => {
    const orchestrator = makeOrchestrator();
    let calls = 0;
    const listener = () => { calls++; };

    orchestrator.onGameOver(listener);
    await orchestrator.loadAndStartStage({ rows: 2, cols: 2, hair: [{ r: 0, c: 0 }], text: ['A'], colors: [] }, 10);

    orchestrator.offGameOver(listener);
    orchestrator.shave(0, 0, 0); // clears the only hair -> WON -> notifyGameOver would fire
    assert.equal(calls, 0, 'offGameOver() must stop further notifications to the removed listener');

    orchestrator.stopTimer();
});

test('GameOrchestrator - offUpdate()/offGameOver() on an unregistered callback is a harmless no-op', () => {
    const orchestrator = makeOrchestrator();
    assert.doesNotThrow(() => orchestrator.offUpdate(() => {}));
    assert.doesNotThrow(() => orchestrator.offGameOver(() => {}));
});

test('GameOrchestrator - offUpdate() removes only the targeted listener, leaving others intact', async () => {
    const orchestrator = makeOrchestrator();
    const calls = { a: 0, b: 0 };
    const listenerA = () => { calls.a++; };
    const listenerB = () => { calls.b++; };

    orchestrator.onUpdate(listenerA);
    orchestrator.onUpdate(listenerB);
    await orchestrator.loadAndStartStage({ rows: 2, cols: 2, hair: [], text: ['A'], colors: [] }, 10);
    assert.deepEqual(calls, { a: 1, b: 1 });

    orchestrator.offUpdate(listenerA);
    orchestrator.notifyUpdate(null, false);
    assert.deepEqual(calls, { a: 1, b: 2 }, 'only listenerA should stop receiving notifications');

    orchestrator.stopTimer();
});
