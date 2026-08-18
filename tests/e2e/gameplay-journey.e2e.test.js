import test from 'node:test';
import assert from 'node:assert/strict';

import { bootstrapApp } from '../../src/main.js';
import { setupGlobalDOM } from '../helpers/dom-mock-harness.js';
import { StaticJsonStageAdapter } from '../../src/adapters/static-json-stage.js';
import { SessionStatus } from '../../src/domain/shave-session.js';

test('E2E - Full User Journey: Bootstrap, Select Preset, Shave, Combo, Sound, Shortcuts, and Victory Flow', async () => {
    const { document: doc, window: win, teardown } = setupGlobalDOM();

    try {
        const mockStageData = {
            rows: 10,
            cols: 10,
            totalHairCount: 3,
            hairPositions: [
                { r: 2, c: 2 },
                { r: 2, c: 3 },
                { r: 2, c: 4 }
            ],
            textGrid: [
                '..........',
                '..........',
                '..###.....',
                '..........',
                '..........',
                '..........',
                '..........',
                '..........',
                '..........',
                '..........'
            ],
            colorGrid: null
        };

        const mockJsonAdapter = new StaticJsonStageAdapter(async () => {
            return {
                ok: true,
                status: 200,
                json: async () => mockStageData
            };
        });

        // 1. Bootstrap Application with injected customAdapter
        const app = bootstrapApp(doc, win, {
            jsonAdapter: mockJsonAdapter
        });

        assert.ok(app);
        assert.ok(app.orchestrator);
        assert.ok(app.renderer);
        assert.ok(app.hud);
        assert.ok(app.sound);
        assert.ok(app.brushController);
        assert.ok(app.inputManager);

        // 2. Select Stage and verify loading
        await app.startStageWithSource('preset', 'stage1.json');

        const session = app.orchestrator.session;
        assert.ok(session);
        assert.equal(session.getSnapshot().totalHairs, 3);
        assert.equal(session.getSnapshot().remainingHairs, 3);

        const canvas = doc.getElementById('gameCanvas');
        assert.ok(canvas);

        // 3. User Journey: Shave hair at (2, 2)
        // Canvas width = 60, height = 60 (10x10 cells, 6px each).
        // Cell (2, 2) is x = 2 * 6 + 3 = 15, y = 2 * 6 + 3 = 15
        const rect = canvas.getBoundingClientRect();
        
        // Simulate mouse down on cell (2, 2)
        // Radius 1 circle at (2, 2) covers (2, 2) and (2, 3), removing 2 hairs
        if (canvas.listeners['mousedown']) {
            canvas.listeners['mousedown']({
                clientX: rect.left + 15,
                clientY: rect.top + 15,
                buttons: 1,
                preventDefault: () => {}
            });
        }

        assert.equal(session.hairGrid.getRemainingCount(), 1);
        assert.equal(session.getSnapshot().comboCount, 1);
        assert.ok(session.getSnapshot().score > 0);

        // 4. Keyboard shortcut: switch brush radius to 7 using key '4'
        win.dispatchEvent('keydown', { key: '4' });
        assert.equal(app.brushController.brushRadius, 7);

        // 5. Sound toggle
        const initialSound = app.sound.enabled;
        const soundBtn = doc.getElementById('soundToggleBtn');
        soundBtn.click();
        assert.equal(app.sound.enabled, !initialSound);

        // 6. Simulate drag mouse move to cell (2, 4) -> x = 4 * 6 + 3 = 27, y = 15
        // Shaves remaining hair at (2, 4) and triggers victory
        if (canvas.listeners['mousemove']) {
            canvas.listeners['mousemove']({
                clientX: rect.left + 27,
                clientY: rect.top + 15,
                buttons: 1,
                preventDefault: () => {}
            });
        }

        assert.equal(session.hairGrid.getRemainingCount(), 0);
        assert.equal(session.getSnapshot().comboCount, 2);
        assert.equal(session.status, SessionStatus.WON);

        // Simulate mouse up
        if (canvas.listeners['mouseup']) {
            canvas.listeners['mouseup']({
                preventDefault: () => {}
            });
        }

        // 7. Restart game via keyboard shortcut 'R'
        win.dispatchEvent('keydown', { key: 'r' });
        assert.equal(app.orchestrator.session.hairGrid.getRemainingCount(), 3);
        assert.equal(app.orchestrator.session.scoreCalculator.shaveStreak, 0);

        // 8. Clean teardown
        app.inputManager.destroy();
        app.orchestrator.stopTimer();
    } finally {
        teardown();
    }
});
