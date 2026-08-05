/**
 * Coverage Completion Suite
 * Closes the residual line/function/branch gaps required by the AGENTS.md
 * quality gate (100% line, 100% function, >=90% branch).
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { StageSourceRegistry, JsonSourceHandler } from '../../src/app/stage-source-handlers.js';
import { StaticJsonStageAdapter } from '../../src/adapters/static-json-stage.js';
import { DeltaDiffEngineAdapter } from '../../src/adapters/delta-diff-engine.js';
import { GridGeometry } from '../../src/domain/grid-geometry.js';
import { GamePolicy } from '../../src/domain/game-policy.js';
import { HairGrid } from '../../src/domain/hair-grid.js';
import { SessionStatus } from '../../src/domain/shave-session.js';

test('StageSourceRegistry - register() appends a handler discoverable by findHandler', () => {
    const registry = new StageSourceRegistry([]);
    assert.equal(registry.findHandler('game_data.json'), undefined);

    const handler = new JsonSourceHandler(new StaticJsonStageAdapter());
    registry.register(handler);

    assert.equal(registry.findHandler('game_data.json'), handler);
    assert.equal(registry.findHandler(12345), undefined);
});

test('GamePolicy - covers every victory branch', () => {
    const policy = new GamePolicy();
    assert.equal(policy.isVictory(null), false);
    assert.equal(policy.isVictory(undefined), false);
    assert.equal(policy.isVictory({ status: SessionStatus.WON, percentageCleared: 0 }), true);
    assert.equal(policy.isVictory({ status: SessionStatus.TIMEOUT, percentageCleared: 100 }), true);
    assert.equal(policy.isVictory({ status: SessionStatus.TIMEOUT, percentageCleared: 99 }), false);
});

test('GridGeometry - clamps, derives sizes, and rejects unusable client rects', () => {
    const geo = new GridGeometry(0, -5, 0, 0);
    assert.equal(geo.cols, 1);
    assert.equal(geo.rows, 1);
    assert.equal(geo.cellWidth, 1);
    assert.equal(geo.cellHeight, 1);

    const canonical = GridGeometry.default();
    assert.equal(canonical.width, 280 * 6);
    assert.equal(canonical.height, 219 * 6);
    assert.equal(canonical.contains(0, 0), true);
    assert.equal(canonical.contains(-1, 0), false);
    assert.equal(canonical.contains(0, -1), false);
    assert.equal(canonical.contains(219, 0), false);
    assert.equal(canonical.contains(0, 280), false);

    assert.deepEqual(canonical.clientToGrid(10, 10, null), { row: -1, col: -1 });
    assert.deepEqual(canonical.clientToGrid(10, 10, { left: 0, top: 0, width: 0, height: 10 }), { row: -1, col: -1 });
    assert.deepEqual(canonical.clientToGrid(10, 10, { left: 0, top: 0, width: 10, height: 0 }), { row: -1, col: -1 });
    assert.deepEqual(canonical.clientToGrid(-50, 5, { left: 0, top: 0, width: 100, height: 100 }), { row: -1, col: -1 });
    assert.deepEqual(canonical.clientToGrid(5, -50, { left: 0, top: 0, width: 100, height: 100 }), { row: -1, col: -1 });
});

test('GridGeometry - fromStageData falls back to the canonical default per dimension', () => {
    const base = GridGeometry.default();
    assert.equal(GridGeometry.fromStageData({}).cols, base.cols);
    assert.equal(GridGeometry.fromStageData({}).rows, base.rows);
    assert.equal(GridGeometry.fromStageData().cols, base.cols);
    assert.equal(GridGeometry.fromStageData({ cols: 12 }).cols, 12);
    assert.equal(GridGeometry.fromStageData({ cols: 12 }).rows, base.rows);
    assert.equal(GridGeometry.fromStageData({ rows: 7 }).rows, 7);
});

test('HairGrid - guards out-of-range coordinates and duplicate hair positions', () => {
    const grid = new HairGrid(new GridGeometry(4, 4, 6, 6), [
        { r: 0, c: 0 },
        { r: 0, c: 0 },   // duplicate is counted once
        { r: -1, c: 0 },  // out of range
        { r: 0, c: -1 },
        { r: 9, c: 0 },
        { r: 0, c: 9 }
    ]);
    assert.equal(grid.totalHairCount, 1);
    assert.equal(grid.has(-1, 0), false);
    assert.equal(grid.has(0, -1), false);
    assert.equal(grid.has(4, 0), false);
    assert.equal(grid.has(0, 4), false);

    grid.shave(0, 0, 0);
    assert.equal(grid.getRemainingCount(), 0);
    assert.equal(grid.getClearedPercentage(), 100);

    const empty = new HairGrid(new GridGeometry(2, 2, 6, 6), []);
    assert.equal(empty.getClearedPercentage(), 100);
});

test('HUD - combo badge toggles on and off across the streak boundary', async () => {
    global.document = {
        getElementById: () => null,
        querySelectorAll: () => [],
        createElement: () => ({ style: {}, classList: { add: () => {}, remove: () => {} } }),
        body: { appendChild: () => {} }
    };
    const { HUD } = await import('../../src/ui/hud.js');
    const hud = new HUD();

    const applied = [];
    hud.comboBadgeEl = {
        classList: { add: (c) => applied.push(`+${c}`), remove: (c) => applied.push(`-${c}`) },
        style: {}
    };
    hud.comboValEl = { textContent: '' };

    hud.update({ score: 0, timeLeft: 1, remainingHairs: 0, percentageCleared: 0, comboCount: 4 });
    assert.equal(hud.comboBadgeEl.style.display, 'inline-block');

    hud.update({ score: 0, timeLeft: 1, remainingHairs: 0, percentageCleared: 0, comboCount: 1 });
    assert.equal(hud.comboBadgeEl.style.display, 'none');
    assert.deepEqual(applied, ['+active', '-active']);

    // A badge element without classList/style must not break the update.
    hud.comboBadgeEl = {};
    assert.doesNotThrow(() => hud.update({ score: 0, timeLeft: 1, remainingHairs: 0, percentageCleared: 0, comboCount: 2 }));

    delete global.document;
});

test('DeltaDiffEngineAdapter - covers alpha, threshold, and supplied skin-base branches', () => {
    const engine = new DeltaDiffEngineAdapter();

    // All pixels transparent -> fallback skin tone
    assert.deepEqual(engine.calculateAverageSkinTone([[[255, 255, 255, 0]]], 80), [210, 180, 150]);
    // No pixel above threshold -> fallback skin tone
    assert.deepEqual(engine.calculateAverageSkinTone([[[10, 10, 10]]], 80), [210, 180, 150]);
    // Opaque pixels without an explicit alpha channel
    assert.deepEqual(engine.calculateAverageSkinTone([[[200, 200, 200]]], 80), [200, 200, 200]);

    const colors = [
        [[10, 10, 10], [220, 200, 180]],
        [[220, 200, 180], [10, 10, 10]]
    ];
    const derived = engine.computeHairCoordinates(colors, null, 25, 80);
    assert.ok(derived.hairPositions.length > 0);
    assert.ok(Array.isArray(derived.skinBaseColors));

    // Explicit skin base short-circuits the internal derivation
    const supplied = engine.computeHairCoordinates(colors, [[[220, 200, 180], [220, 200, 180]]], 25, 80);
    assert.ok(Array.isArray(supplied.hairPositions));
});
