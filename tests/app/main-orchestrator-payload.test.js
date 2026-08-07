/**
 * TSK-008-07: main.js must receive render data through the onUpdate payload,
 * never by reaching into GameOrchestrator's internal state directly.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { GameOrchestrator } from '../../src/app/game-orchestrator.js';
import { StagePipeline } from '../../src/app/stage-pipeline.js';
import { StageSourceRegistry, JsonSourceHandler } from '../../src/app/stage-source-handlers.js';
import { StaticJsonStageAdapter } from '../../src/adapters/static-json-stage.js';

test('main.js - does not read orchestrator.currentStageData or orchestrator.session directly', async () => {
    const source = await readFile(new URL('../../src/main.js', import.meta.url), 'utf8');
    assert.equal(/orchestrator\.currentStageData/.test(source), false,
        'main.js must receive stage data through the onUpdate payload, not by reaching into the orchestrator');
    assert.equal(/orchestrator\.session\b/.test(source), false,
        'main.js must not reach into orchestrator.session directly');
});

test('GameOrchestrator - onUpdate payload is a single named event object, not positional arguments', async () => {
    const pipeline = new StagePipeline(null, null, null, null,
        new StageSourceRegistry([new JsonSourceHandler(new StaticJsonStageAdapter())]));
    const orchestrator = new GameOrchestrator(pipeline);

    let receivedArgCount = -1;
    let event = null;
    orchestrator.onUpdate((...args) => {
        receivedArgCount = args.length;
        event = args[0];
    });

    const stageData = await orchestrator.loadAndStartStage(
        { rows: 3, cols: 3, hair: [{ r: 0, c: 0 }], text: ['A'], colors: [] }, 10
    );

    assert.ok(event, 'onUpdate must have fired on stage load');
    assert.equal(receivedArgCount, 1, 'onUpdate callback must receive exactly one event object, not positional args');
    assert.equal(event.stageData, stageData, 'event.stageData must carry the loaded stage data');
    assert.deepEqual(event.hairView.has(0, 0), true, 'event.hairView must reflect the current hair grid state');

    orchestrator.stopTimer();
});

test('GameOrchestrator - onUpdate event.hairView is read-only: it exposes has() but no mutation surface', async () => {
    const pipeline = new StagePipeline(null, null, null, null,
        new StageSourceRegistry([new JsonSourceHandler(new StaticJsonStageAdapter())]));
    const orchestrator = new GameOrchestrator(pipeline);

    let event = null;
    orchestrator.onUpdate(e => { event = e; });

    await orchestrator.loadAndStartStage(
        { rows: 3, cols: 3, hair: [{ r: 0, c: 0 }], text: ['A'], colors: [] }, 10
    );

    assert.equal(typeof event.hairView.has, 'function');
    assert.equal(event.hairView.shave, undefined, 'hairView must not expose shave() - a UI subscriber has no business mutating session state');
    assert.equal(event.hairView.data, undefined, 'hairView must not expose the underlying Uint8Array');

    orchestrator.stopTimer();
});

test('GameOrchestrator - getCurrentHairView() returns the same kind of read-only view as the onUpdate payload', async () => {
    const pipeline = new StagePipeline(null, null, null, null,
        new StageSourceRegistry([new JsonSourceHandler(new StaticJsonStageAdapter())]));
    const orchestrator = new GameOrchestrator(pipeline);

    await orchestrator.loadAndStartStage(
        { rows: 3, cols: 3, hair: [{ r: 0, c: 0 }], text: ['A'], colors: [] }, 10
    );

    const view = orchestrator.getCurrentHairView();
    assert.equal(typeof view.has, 'function');
    assert.equal(view.has(0, 0), true);
    assert.equal(view.shave, undefined);

    orchestrator.stopTimer();
});
