/**
 * TSK-010-08: residual cleanup found in code review -
 * - main.js no longer imports the now-unused SessionStatus
 * - CanvasRenderer's full-redraw loop no longer declares an unused rowColors
 * - BrushController.handlePointerMove's dead condition branch is simplified
 * - shaving an empty area resets the combo immediately, not on the next
 *   timer tick, without triggering a needless full canvas redraw
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { GameOrchestrator } from '../../src/app/game-orchestrator.js';
import { StagePipeline } from '../../src/app/stage-pipeline.js';
import { StageSourceRegistry, JsonSourceHandler } from '../../src/app/stage-source-handlers.js';
import { StaticJsonStageAdapter } from '../../src/adapters/static-json-stage.js';
import { GridGeometry } from '../../src/domain/grid-geometry.js';
import { CanvasRenderer } from '../../src/ui/canvas-renderer.js';

test('main.js - does not import the unused SessionStatus (victory rule lives in GamePolicy)', async () => {
    const source = await readFile(new URL('../../src/main.js', import.meta.url), 'utf8');
    assert.equal(/SessionStatus/.test(source), false, 'main.js must not import SessionStatus - nothing in it references SessionStatus anymore');
});

test('CanvasRenderer - the full-redraw loop declares no unused rowColors binding', async () => {
    const source = await readFile(new URL('../../src/ui/canvas-renderer.js', import.meta.url), 'utf8');
    assert.equal(/const rowColors/.test(source), false, 'renderSingleCell() reads colorGrid[r][c] directly - the loop-local rowColors binding is dead');
});

test('BrushController - handlePointerMove carries no dead condition branch', async () => {
    const source = await readFile(new URL('../../src/ui/brush-controller.js', import.meta.url), 'utf8');
    // The old `else if (this.isMouseDown || (row !== this.lastR || col !== this.lastC))`
    // let control enter the block whenever the pointer moved to a new cell,
    // but the body re-tested `this.isMouseDown` before doing anything - so the
    // "moved to a new cell" half of the condition never changed behavior.
    assert.equal(
        /else if \(this\.isMouseDown \|\|/.test(source),
        false,
        'the redundant `|| (row !== this.lastR || col !== this.lastC)` disjunct must be removed'
    );
});

const makeOrchestrator = () => {
    const pipeline = new StagePipeline(null, null, null, null,
        new StageSourceRegistry([new JsonSourceHandler(new StaticJsonStageAdapter())]));
    return new GameOrchestrator(pipeline);
};

test('GameOrchestrator - shaving an empty cell after a streak resets the combo immediately, not on the next timer tick', async () => {
    const orchestrator = makeOrchestrator();
    const updates = [];
    orchestrator.onUpdate(event => updates.push(event.snapshot.comboCount));

    // Two adjacent hairs so two separate 1-cell shaves each build streak.
    await orchestrator.loadAndStartStage(
        { rows: 4, cols: 4, hair: [{ r: 0, c: 0 }, { r: 2, c: 2 }], text: ['A'], colors: [] }, 10
    );

    orchestrator.shave(0, 0, 0); // removes the hair at (0,0) -> streak 1
    assert.equal(updates[updates.length - 1], 1, 'sanity check: combo is 1 after the first successful shave');

    updates.length = 0;
    orchestrator.shave(1, 1, 0); // empty cell -> ScoreCalculator resets shaveStreak to 0
    assert.equal(updates.length, 1, 'an empty-cell shave that resets an active streak must notify immediately');
    assert.equal(updates[0], 0, 'the notified snapshot must reflect the reset combo (0), not the stale pre-reset value');

    orchestrator.stopTimer();
});

test('GameOrchestrator - shaving an empty cell with no active streak still does not spuriously notify', async () => {
    const orchestrator = makeOrchestrator();
    let updateCount = 0;
    orchestrator.onUpdate(() => { updateCount++; });

    await orchestrator.loadAndStartStage(
        { rows: 4, cols: 4, hair: [{ r: 2, c: 2 }], text: ['A'], colors: [] }, 10
    );

    updateCount = 0;
    orchestrator.shave(1, 1, 0); // empty cell, combo was already 0 -> nothing actually changed
    assert.equal(updateCount, 0, 'a no-op shave with no combo change must not trigger an update notification');

    orchestrator.stopTimer();
});

const makeRendererHarness = (geometry) => {
    const calls = { rect: 0, text: 0 };
    const canvas = {
        width: geometry.width, height: geometry.height, style: {},
        getContext: () => ({
            scale() {},
            fillRect() { calls.rect++; },
            fillText() { calls.text++; }
        })
    };
    const renderer = new CanvasRenderer(canvas, geometry);
    const stageData = {
        cols: geometry.cols, rows: geometry.rows,
        textGrid: Array.from({ length: geometry.rows }, () => '.'.repeat(geometry.cols)),
        colorGrid: null
    };
    const hairGrid = { has: () => false };
    return { renderer, stageData, hairGrid, calls };
};

test('CanvasRenderer.render - an empty dirtyCells array draws nothing (not a full redraw)', () => {
    const geometry = new GridGeometry(10, 10, 6, 6);
    const { renderer, stageData, hairGrid, calls } = makeRendererHarness(geometry);

    renderer.render(stageData, hairGrid, []);
    assert.equal(calls.rect, 0, 'an empty dirty-cell list must not fall through to a full canvas redraw');
    assert.equal(calls.text, 0);
});

test('CanvasRenderer.requestRender - an empty dirtyCells array does not schedule a full redraw', () => {
    const geometry = new GridGeometry(10, 10, 6, 6);
    const { renderer, stageData, hairGrid, calls } = makeRendererHarness(geometry);

    const rafQueue = [];
    global.requestAnimationFrame = (cb) => { rafQueue.push(cb); return rafQueue.length; };

    renderer.requestRender(stageData, hairGrid, []);
    while (rafQueue.length) rafQueue.shift()();

    assert.equal(calls.rect, 0, 'an empty dirty-cell list must never set needsFullRedraw');
    assert.equal(calls.text, 0);

    delete global.requestAnimationFrame;
});
