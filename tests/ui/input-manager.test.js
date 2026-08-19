import test from 'node:test';
import assert from 'node:assert/strict';

import { InputManager, KEY_BRUSH_RADIUS_MAP } from '../../src/ui/input-manager.js';
import { createMockDocument, createMockWindow } from '../helpers/dom-mock-harness.js';
import { GamePolicy } from '../../src/domain/game-policy.js';
import { HUD } from '../../src/ui/hud.js';

test('InputManager - Fail-Fast: throws error if document is missing', () => {
    assert.throws(() => new InputManager({}), /document is required/i);
    assert.throws(() => new InputManager({ doc: null }), /document is required/i);
});

test('InputManager - binds sound toggle and synchronizes HUD and SoundEffects', () => {
    const doc = createMockDocument();
    const soundToggleBtn = doc.getElementById('soundToggleBtn');
    let soundToggled = false;
    let hudUpdated = false;

    const mockSound = {
        toggle: () => {
            soundToggled = true;
            return false;
        }
    };
    const mockHud = {
        soundToggleBtn,
        updateSoundUI: (enabled) => {
            hudUpdated = true;
            assert.equal(enabled, false);
        },
        updateBrushSizeUI: () => {}
    };
    const mockBrushController = {
        onRadiusChange: () => {},
        setRadius: () => {}
    };
    const mockOrchestrator = {
        restart: () => {},
        stopTimer: () => {}
    };

    const inputManager = new InputManager({
        doc,
        hud: mockHud,
        sound: mockSound,
        brushController: mockBrushController,
        orchestrator: mockOrchestrator
    });

    assert.ok(inputManager);
    soundToggleBtn.click();
    assert.equal(soundToggled, true);
    assert.equal(hudUpdated, true);
});

test('InputManager - syncs brush size UI when brushController onRadiusChange fires', () => {
    const doc = createMockDocument();
    let updatedRadius = null;
    let radiusCallback = null;

    const mockBrushController = {
        onRadiusChange: (cb) => {
            radiusCallback = cb;
        },
        setRadius: () => {}
    };
    const mockHud = {
        updateBrushSizeUI: (r) => {
            updatedRadius = r;
        }
    };

    const inputManager = new InputManager({
        doc,
        hud: mockHud,
        brushController: mockBrushController,
        orchestrator: {},
        sound: {}
    });

    assert.ok(typeof radiusCallback === 'function');
    radiusCallback(5);
    assert.equal(updatedRadius, 5);
});

test('InputManager - binds brush size buttons and sets brush radius', () => {
    const doc = createMockDocument();
    const btn1 = doc.createElement('button');
    btn1.className = 'brush-btn';
    btn1.setAttribute('data-radius', '3');
    doc.body.appendChild(btn1);

    const btn2 = doc.createElement('button');
    btn2.className = 'brush-btn active';
    btn2.setAttribute('data-radius', '5');
    doc.body.appendChild(btn2);

    let currentRadius = 1;
    const mockBrushController = {
        onRadiusChange: () => {},
        setRadius: (r) => {
            currentRadius = r;
        }
    };
    const mockHud = {
        updateBrushSizeUI: () => {}
    };

    const inputManager = new InputManager({
        doc,
        hud: mockHud,
        brushController: mockBrushController,
        orchestrator: {},
        sound: {}
    });

    btn1.click();
    assert.equal(currentRadius, 3);
    assert.ok(btn1.classList.contains('active'));
    assert.ok(!btn2.classList.contains('active'));
});

test('InputManager - binds keyboard shortcuts (1-4, R) on window and respects contentEditable/input guards', () => {
    const doc = createMockDocument();
    const win = createMockWindow();
    let setRadiusCalledWith = null;
    let restartCalled = false;

    const mockBrushController = {
        onRadiusChange: () => {},
        setRadius: (r) => {
            setRadiusCalledWith = r;
        }
    };
    const mockOrchestrator = {
        restart: () => {
            restartCalled = true;
        },
        stopTimer: () => {}
    };

    const inputManager = new InputManager({
        doc,
        win,
        brushController: mockBrushController,
        orchestrator: mockOrchestrator,
        hud: { updateBrushSizeUI: () => {} },
        sound: {}
    });

    // 1. Valid radius key '2' -> radius 3
    win.dispatchEvent('keydown', { key: '2' });
    assert.equal(setRadiusCalledWith, 3);

    // 2. Valid radius key '4' -> radius 7
    win.dispatchEvent('keydown', { key: '4' });
    assert.equal(setRadiusCalledWith, 7);

    // 3. Valid restart key 'r'
    win.dispatchEvent('keydown', { key: 'r' });
    assert.equal(restartCalled, true);

    restartCalled = false;
    win.dispatchEvent('keydown', { key: 'R' });
    assert.equal(restartCalled, true);

    // 4. Unmapped key 'x'
    setRadiusCalledWith = null;
    win.dispatchEvent('keydown', { key: 'x' });
    assert.equal(setRadiusCalledWith, null);

    // 5. Input element active: shortcut ignored
    const inputEl = doc.createElement('input');
    doc.activeElement = inputEl;
    setRadiusCalledWith = null;
    win.dispatchEvent('keydown', { key: '1' });
    assert.equal(setRadiusCalledWith, null);

    // 6. Textarea element active: shortcut ignored
    const textareaEl = doc.createElement('textarea');
    doc.activeElement = textareaEl;
    restartCalled = false;
    win.dispatchEvent('keydown', { key: 'r' });
    assert.equal(restartCalled, false);

    // 7. contentEditable active: shortcut ignored
    const editableEl = doc.createElement('div');
    editableEl.isContentEditable = true;
    doc.activeElement = editableEl;
    win.dispatchEvent('keydown', { key: '3' });
    assert.equal(setRadiusCalledWith, null);
});

test('InputManager - binds change stage button to stop timer and open start modal', () => {
    const doc = createMockDocument();
    const changeStageBtn = doc.getElementById('changeStageBtn');
    let timerStopped = false;
    let modalShown = false;

    const mockOrchestrator = {
        stopTimer: () => {
            timerStopped = true;
        }
    };
    const mockHud = {
        showStartModal: () => {
            modalShown = true;
        },
        updateBrushSizeUI: () => {}
    };

    const inputManager = new InputManager({
        doc,
        orchestrator: mockOrchestrator,
        hud: mockHud,
        brushController: { onRadiusChange: () => {} },
        sound: {}
    });

    changeStageBtn.click();
    assert.equal(timerStopped, true);
    assert.equal(modalShown, true);
});

test('InputManager - destroy() cleans up all event listeners without throwing', () => {
    const doc = createMockDocument();
    const win = createMockWindow();
    const changeStageBtn = doc.getElementById('changeStageBtn');
    const soundToggleBtn = doc.getElementById('soundToggleBtn');
    const btn = doc.createElement('button');
    btn.className = 'brush-btn';
    btn.setAttribute('data-radius', '2');
    doc.body.appendChild(btn);

    let modalShown = false;
    let soundToggled = false;
    let radiusSet = null;

    const mockHud = {
        soundToggleBtn,
        showStartModal: () => {
            modalShown = true;
        },
        updateSoundUI: () => {},
        updateBrushSizeUI: () => {}
    };
    const mockSound = {
        toggle: () => {
            soundToggled = true;
            return true;
        }
    };
    const mockBrush = {
        onRadiusChange: () => {},
        setRadius: (r) => {
            radiusSet = r;
        }
    };

    const inputManager = new InputManager({
        doc,
        win,
        hud: mockHud,
        sound: mockSound,
        orchestrator: { stopTimer: () => {}, restart: () => {} },
        brushController: mockBrush
    });

    inputManager.destroy();

    changeStageBtn.click();
    soundToggleBtn.click();
    btn.click();
    win.dispatchEvent('keydown', { key: '1' });

    assert.equal(modalShown, false);
    assert.equal(soundToggled, false);
    assert.equal(radiusSet, null);
});

test('InputManager - supports granular views injection without monolithic HUD (ISP)', () => {
    const doc = createMockDocument();
    const soundToggleBtn = doc.getElementById('soundToggleBtn');
    const changeStageBtn = doc.getElementById('changeStageBtn');
    let soundUIUpdated = false;
    let brushUIUpdated = false;
    let modalShown = false;
    let radiusCallback = null;

    const mockStatsView = {
        soundToggleBtn,
        updateSoundUI: () => { soundUIUpdated = true; },
        updateBrushSizeUI: () => { brushUIUpdated = true; }
    };
    const mockModalView = {
        show: () => { modalShown = true; }
    };
    const mockBrushController = {
        onRadiusChange: (cb) => { radiusCallback = cb; },
        setRadius: () => {}
    };

    const inputManager = new InputManager({
        doc,
        statsView: mockStatsView,
        modalView: mockModalView,
        sound: { toggle: () => true },
        brushController: mockBrushController,
        orchestrator: { stopTimer: () => {} }
    });

    assert.ok(inputManager);
    soundToggleBtn.click();
    assert.equal(soundUIUpdated, true);

    radiusCallback(3);
    assert.equal(brushUIUpdated, true);

    changeStageBtn.click();
    assert.equal(modalShown, true);
});
