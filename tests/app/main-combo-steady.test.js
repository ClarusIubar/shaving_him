/**
 * TSK-008-07: the combo sound must play once per rising edge of comboCount,
 * not on every update while the streak holds steady - the `comboCount !==
 * lastCombo` branch's "unchanged" side was previously unexercised.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { StagePipeline } from '../../src/app/stage-pipeline.js';
import { StageSourceRegistry, JsonSourceHandler } from '../../src/app/stage-source-handlers.js';
import { StaticJsonStageAdapter } from '../../src/adapters/static-json-stage.js';

const makeCanvas = () => ({
    width: 1680, height: 1314, style: {},
    getContext: () => ({ scale() {}, fillRect() {}, fillText() {} }),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1680, height: 1314 }),
    addEventListener() {}
});

test('bootstrapApp - combo sound plays once per rising edge, not on every update at the same streak', async () => {
    const doc = {
        readyState: 'complete',
        body: { appendChild() {} },
        activeElement: { tagName: 'div', isContentEditable: false },
        querySelectorAll: () => [],
        addEventListener() {},
        getElementById: (id) => (id === 'gameCanvas' ? makeCanvas() : null)
    };

    global.document = doc;
    global.window = { addEventListener() {} };
    global.requestAnimationFrame = (cb) => { cb(); return 1; };

    const { bootstrapApp } = await import('../../src/main.js');
    const app = bootstrapApp(doc, { addEventListener() {} });

    let comboPlays = 0;
    app.sound.playComboSound = () => { comboPlays++; };
    app.sound.init = () => {};

    const pipeline = new StagePipeline(null, null, null, null,
        new StageSourceRegistry([new JsonSourceHandler(new StaticJsonStageAdapter())]));
    app.orchestrator.pipeline = pipeline;
    await app.orchestrator.loadAndStartStage({ rows: 2, cols: 2, hair: [], text: ['A'], colors: [] }, 10);

    app.orchestrator.session.scoreCalculator.shaveStreak = 3;
    app.orchestrator.notifyUpdate(null, false); // comboCount 3, rising from 1 -> plays
    app.orchestrator.notifyUpdate(null, false); // comboCount still 3 -> must not replay

    assert.equal(comboPlays, 1);

    app.orchestrator.stopTimer();
    delete global.document;
    delete global.window;
    delete global.requestAnimationFrame;
});
