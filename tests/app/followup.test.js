/**
 * TSK-007 Follow-up Verification Suite
 * Covers: fail-closed handlers, GamePolicy injection into HUD,
 * HairGrid geometry coercion removal, and StagePipeline pixel-operation freedom.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { HairGrid } from '../../src/domain/hair-grid.js';
import { GridGeometry } from '../../src/domain/grid-geometry.js';
import { ShaveSession } from '../../src/domain/shave-session.js';
import { StagePipeline } from '../../src/app/stage-pipeline.js';
import { JsonSourceHandler, ImageSourceHandler, StageSourceRegistry } from '../../src/app/stage-source-handlers.js';
import { GameOrchestrator } from '../../src/app/game-orchestrator.js';

/* ── Fail-closed: no silent fallbacks ─────────────────────────────── */

test('JsonSourceHandler - fails closed when the json adapter is missing', () => {
    assert.throws(() => new JsonSourceHandler(null), /JsonSourceHandler requires a stage source adapter/);
    assert.throws(() => new JsonSourceHandler({}), /JsonSourceHandler requires a stage source adapter/);
});

test('ImageSourceHandler - fails closed when collaborators are missing', () => {
    const processor = { processImageSource: () => {} };
    const diff = { computeHairCoordinates: () => {} };
    const ascii = { convertToAsciiGrid: () => {} };

    assert.throws(() => new ImageSourceHandler(null, diff, ascii), /ImageSourceHandler requires/);
    assert.throws(() => new ImageSourceHandler(processor, null, ascii), /ImageSourceHandler requires/);
    assert.throws(() => new ImageSourceHandler(processor, diff, null), /ImageSourceHandler requires/);
    assert.ok(new ImageSourceHandler(processor, diff, ascii) instanceof ImageSourceHandler);
});

test('StagePipeline - fails closed instead of building handlers from missing adapters', () => {
    assert.throws(() => new StagePipeline(), /StagePipeline requires/);
    assert.throws(() => new StagePipeline(null, {}, {}, {}), /StagePipeline requires/);
});

test('GameOrchestrator - fails closed rather than defaulting to an unwired pipeline', async () => {
    assert.throws(() => new GameOrchestrator(), /GameOrchestrator requires a stage pipeline/);
});

/* ── SRP: StagePipeline owns no pixel operations ──────────────────── */

test('StagePipeline - exposes no pixel-level skin tone computation', () => {
    const pipeline = new StagePipeline({}, {}, {}, {}, new StageSourceRegistry([]));
    assert.equal(pipeline.calculateAverageSkinTone, undefined);
});

/* ── HairGrid: geometry coercion removed ──────────────────────────── */

test('HairGrid - honours explicit (cols, rows) without magic value coercion', () => {
    const grid = new HairGrid(219, 280, []);
    assert.equal(grid.cols, 219, 'cols must stay as given - no legacy 219/280 auto-flip');
    assert.equal(grid.rows, 280, 'rows must stay as given - no legacy 219/280 auto-flip');
    assert.equal(grid.data.length, 219 * 280);
});

test('HairGrid - accepts a GridGeometry value object', () => {
    const grid = new HairGrid(new GridGeometry(10, 4, 6, 6), [{ r: 1, c: 2 }]);
    assert.equal(grid.cols, 10);
    assert.equal(grid.rows, 4);
    assert.equal(grid.totalHairCount, 1);
    assert.ok(grid.has(1, 2));
});

test('HairGrid - rejects an unusable geometry specification', () => {
    assert.throws(() => new HairGrid('nope', 4), /HairGrid requires/);
});

test('ShaveSession - builds its grid from stage geometry without flipping axes', () => {
    const session = new ShaveSession({ cols: 8, rows: 3, hairPositions: [{ r: 2, c: 7 }] }, 60);
    assert.equal(session.hairGrid.cols, 8);
    assert.equal(session.hairGrid.rows, 3);
    assert.ok(session.hairGrid.has(2, 7));
});

/* ── HUD: victory rule lives only in GamePolicy ───────────────────── */

const stubHudDocument = () => {
    const el = () => ({
        style: {},
        classList: { add: () => {}, remove: () => {} },
        addEventListener: () => {},
        querySelector: () => ({ style: {}, textContent: '' }),
        textContent: ''
    });
    global.document = {
        getElementById: () => el(),
        querySelectorAll: () => [],
        createElement: () => el(),
        body: { appendChild: () => {} }
    };
};

test('HUD - delegates the victory rule to the injected GamePolicy', async () => {
    stubHudDocument();
    const { HUD } = await import('../../src/ui/hud.js');

    const asked = [];
    const policyStub = { isVictory: (snapshot) => { asked.push(snapshot); return true; } };
    const hud = new HUD(policyStub);

    // A snapshot that the old inline duplicate would have judged a loss.
    const snapshot = { status: 'TIMEOUT', percentageCleared: 12, remainingHairs: 40, finalResult: {} };
    hud.showGameOver(snapshot, () => {});

    assert.equal(asked.length, 1, 'HUD must consult the injected policy exactly once');
    assert.equal(asked[0], snapshot);
    assert.equal(hud.titleEl.textContent, '🎉 완벽한 면도!', 'policy verdict must win over any inline rule');

    delete global.document;
});

test('HUD - carries no inline copy of the victory rule', async () => {
    const { readFile } = await import('node:fs/promises');
    const source = await readFile(new URL('../../src/ui/hud.js', import.meta.url), 'utf8');
    assert.equal(
        /percentageCleared\s*===\s*100/.test(source),
        false,
        'victory rule literals must live only in src/domain/game-policy.js'
    );
});

test('HUD - declares every method exactly once', async () => {
    const { readFile } = await import('node:fs/promises');
    const source = await readFile(new URL('../../src/ui/hud.js', import.meta.url), 'utf8');

    const names = [...source.matchAll(/^ {4}([A-Za-z_$][\w$]*)\s*\(/gm)].map(m => m[1]);
    const duplicated = names.filter((n, i) => names.indexOf(n) !== i);
    assert.deepEqual(duplicated, [], `duplicated HUD methods shadow each other: ${duplicated.join(', ')}`);
});

test('HUD - start buttons actually launch a stage', async () => {
    const clicks = {};
    const btn = (name) => ({
        style: {},
        disabled: false,
        classList: { add: () => {}, remove: () => {} },
        addEventListener: (evt, fn) => { clicks[`${name}_${evt}`] = fn; }
    });
    const presetBtn = btn('preset');
    const customBtn = btn('custom');

    global.document = {
        getElementById: (id) => {
            if (id === 'startPresetBtn') return presetBtn;
            if (id === 'startCustomBtn') return customBtn;
            return null;
        },
        querySelectorAll: () => [],
        createElement: () => ({ style: {}, classList: { add: () => {}, remove: () => {} } }),
        body: { appendChild: () => {} }
    };

    const { HUD } = await import('../../src/ui/hud.js');
    const hud = new HUD();

    const started = [];
    hud.initStartModalEvents(
        (preset) => started.push(['preset', preset]),
        (file) => started.push(['file', file])
    );

    assert.equal(typeof clicks.preset_click, 'function', 'preset button must be bound to a start handler');
    clicks.preset_click();
    assert.deepEqual(started[0], ['preset', 'preset1']);

    assert.equal(typeof clicks.custom_click, 'function', 'custom photo button must be bound to a start handler');
    hud.selectedFile = { name: 'face.png' };
    clicks.custom_click();
    assert.deepEqual(started[1], ['file', { name: 'face.png' }]);

    // With no file chosen the custom button must stay inert.
    hud.selectedFile = null;
    clicks.custom_click();
    assert.equal(started.length, 2);

    delete global.document;
});

test('HUD - update() renders a snapshot without touching undeclared identifiers', async () => {
    stubHudDocument();
    const { HUD } = await import('../../src/ui/hud.js');
    const hud = new HUD();

    // A live sound toggle button used to route update() into dead updateSoundUI leftovers.
    hud.soundToggleBtn = { classList: { add: () => {}, remove: () => {} }, querySelector: () => ({ textContent: '' }) };
    hud.scoreEl = { textContent: '' };
    hud.timerEl = { textContent: '' };

    assert.doesNotThrow(() => hud.update({ score: 120, timeLeft: 42, comboCount: 3, percentageCleared: 50, remainingHairs: 7 }));
    assert.equal(hud.scoreEl.textContent, 120);
    assert.equal(hud.timerEl.textContent, 42);

    delete global.document;
});
