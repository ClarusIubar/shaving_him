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

test('GameOrchestrator - onUpdate payload includes stageData and hairGrid so callers need no internal access', async () => {
    const pipeline = new StagePipeline(null, null, null, null,
        new StageSourceRegistry([new JsonSourceHandler(new StaticJsonStageAdapter())]));
    const orchestrator = new GameOrchestrator(pipeline);

    let payload = null;
    orchestrator.onUpdate((snapshot, dirtyCells, isTimerTick, stageData, hairGrid) => {
        payload = { snapshot, dirtyCells, isTimerTick, stageData, hairGrid };
    });

    const stageData = await orchestrator.loadAndStartStage(
        { rows: 3, cols: 3, hair: [{ r: 0, c: 0 }], text: ['A'], colors: [] }, 10
    );

    assert.ok(payload, 'onUpdate must have fired on stage load');
    assert.equal(payload.stageData, stageData, 'onUpdate payload must carry the loaded stage data');
    assert.equal(payload.hairGrid, orchestrator.getCurrentHairGrid(), 'onUpdate payload must carry the current hair grid');

    orchestrator.stopTimer();
});
