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

test('BrushController - interpolates line coordinates during drag movement', async () => {
    const { BrushController } = await import('../../src/ui/brush-controller.js');
    const shavedCoords = [];
    const mockCanvas = {
        width: 280, height: 219,
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 280, height: 219 }),
        addEventListener: () => {}
    };

    const controller = new BrushController(mockCanvas, null, (r, c) => {
        shavedCoords.push({ r, c });
    });

    controller.isMouseDown = true;
    controller.handlePointerMove(0, 0);   // row: 0, col: 0
    controller.handlePointerMove(18, 18); // row: 3, col: 3 (jumped)

    // Interpolation must fill intermediate cells (0,0), (1,1), (2,2), (3,3)
    assert.ok(shavedCoords.length >= 4);
    assert.deepEqual(shavedCoords[0], { r: 0, c: 0 });
    assert.deepEqual(shavedCoords[shavedCoords.length - 1], { r: 3, c: 3 });
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

test('HUD - manages drag-over class on dragover and dragleave events', async () => {
    const { HUD } = await import('../../src/ui/hud.js');
    const classes = new Set();
    const mockDropZone = {
        addEventListener: (event, cb) => { mockDropZone.listeners[event] = cb; },
        listeners: {},
        classList: {
            add: (cls) => classes.add(cls),
            remove: (cls) => classes.delete(cls)
        }
    };
    const mockInput = { addEventListener: () => {} };

    global.document = {
        getElementById: (id) => {
            if (id === 'uploadDropZone') return mockDropZone;
            if (id === 'photoInput') return mockInput;
            return null;
        }
    };

    const hud = new HUD();
    mockDropZone.listeners['dragover']({ preventDefault: () => {} });
    assert.equal(classes.has('drag-over'), true);

    mockDropZone.listeners['dragleave']({ preventDefault: () => {} });
    assert.equal(classes.has('drag-over'), false);
});

test('HUD - updates combo streak badge display based on snapshot.comboCount', async () => {
    const { HUD } = await import('../../src/ui/hud.js');
    let comboDisplay = 'none';
    let comboText = '0';

    const mockBadge = { style: { set display(v) { comboDisplay = v; } } };
    const mockVal = { set textContent(v) { comboText = String(v); } };

    global.document = {
        getElementById: (id) => {
            if (id === 'comboBadge') return mockBadge;
            if (id === 'comboVal') return mockVal;
            return null;
        }
    };

    const hud = new HUD();
    hud.update({ comboCount: 5 });
    assert.equal(comboDisplay, 'inline-block');
    assert.equal(comboText, '5');

    hud.update({ comboCount: 1 });
    assert.equal(comboDisplay, 'none');
});

test('SoundEffects - initializes and toggles enable state correctly', async () => {
    const { SoundEffects } = await import('../../src/ui/sound-effects.js');
    const sound = new SoundEffects();
    assert.equal(sound.enabled, true);

    const toggled = sound.toggle();
    assert.equal(toggled, false);
    assert.equal(sound.enabled, false);

    sound.playShaveSound(); // Silent when disabled
    sound.playComboSound(5);
    sound.playWinSound();

    // Re-enable and test audio context synthesis with mock AudioContext
    sound.toggle();
    global.window = {
        AudioContext: class {
            constructor() {
                this.sampleRate = 44100;
                this.currentTime = 0;
                this.destination = {};
                this.state = 'running';
            }
            createBuffer() { return { getChannelData: () => new Float32Array(100) }; }
            createBufferSource() { return { buffer: null, connect: () => {}, start: () => {}, stop: () => {} }; }
            createBiquadFilter() { return { type: '', frequency: { setValueAtTime: () => {} }, Q: { setValueAtTime: () => {} }, connect: () => {} }; }
            createOscillator() { return { type: '', frequency: { setValueAtTime: () => {} }, connect: () => {}, start: () => {}, stop: () => {} }; }
            createGain() { return { gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {} }; }
            resume() { return Promise.resolve(); }
        }
    };

    sound.init();
    sound.playShaveSound();
    sound.playComboSound(3);
    sound.playWinSound();
    delete global.window;
});
