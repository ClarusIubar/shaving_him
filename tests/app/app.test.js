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
    let mouseUpCb = null;
    global.window = { addEventListener: (evt, fn) => { if (evt === 'mouseup') mouseUpCb = fn; } };
    const { BrushController } = await import('../../src/ui/brush-controller.js');
    const controller = new BrushController(null, null, () => {});

    if (mouseUpCb) mouseUpCb();

    let changedRadius = null;
    controller.onRadiusChange((newRadius) => {
        changedRadius = newRadius;
    });

    controller.setRadius(3);
    assert.equal(changedRadius, 3);
    delete global.window;
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
    const resultWhenPaused = orchestrator.shave(1, 1, 1);
    assert.equal(updateCalled, false);
    assert.equal(orchestrator.session.getSnapshot().remainingHairs, 1);
    // Contract assertion: must return object with { removed, dirtyCells }
    assert.ok(resultWhenPaused !== undefined, 'shave() must not return undefined');
    assert.deepEqual(resultWhenPaused, { removed: 0, dirtyCells: [] });

    orchestrator.session.resume();
    const resultWhenRunning = orchestrator.shave(1, 1, 1);
    assert.ok(resultWhenRunning !== undefined);
    assert.equal(typeof resultWhenRunning.removed, 'number');
    assert.ok(Array.isArray(resultWhenRunning.dirtyCells));

    // Test session shave returning null fallback
    const origSessionShave = orchestrator.session.shave;
    orchestrator.session.shave = () => null;
    const nullShaveResult = orchestrator.shave(1, 1, 1);
    assert.deepEqual(nullShaveResult, { removed: 0, dirtyCells: [] });
    orchestrator.session.shave = origSessionShave;

    orchestrator.stopTimer();
});

test('GameOrchestrator - pause, resume, and startTimer interval callback execution', async () => {
    const orchestrator = new GameOrchestrator();
    let tickCount = 0;
    orchestrator.onUpdate((snapshot, dirty, isTimerTick) => {
        if (isTimerTick) tickCount++;
    });

    const mockStage = { rows: 5, cols: 5, hair: [{ r: 1, c: 1 }], text: ['A'], colors: [] };
    await orchestrator.loadAndStartStage(mockStage, 1);

    orchestrator.session.pause();
    assert.equal(orchestrator.session.status, SessionStatus.PAUSED);

    orchestrator.session.resume();
    assert.equal(orchestrator.session.status, SessionStatus.RUNNING);

    // Mock setInterval callback execution
    const origSetInterval = global.setInterval;
    let timerCallback = null;
    global.setInterval = (cb) => { timerCallback = cb; return 123; };
    orchestrator.startTimer();
    assert.ok(timerCallback !== null);

    // Execute timer tick (decrements time left to 0 -> TIMEOUT)
    timerCallback();
    assert.equal(orchestrator.session.status, SessionStatus.TIMEOUT);

    // Execute timer tick when session status is WON
    orchestrator.session.status = SessionStatus.WON;
    timerCallback();

    global.setInterval = origSetInterval;
    orchestrator.stopTimer();

    // Test orchestrator methods when session is null
    const emptyOrchestrator = new GameOrchestrator();
    emptyOrchestrator.notifyUpdate();
    emptyOrchestrator.notifyGameOver();
    emptyOrchestrator.shave(0, 0, 1);
    emptyOrchestrator.restart();

    // Test setInterval callback when session is null
    let nullSessionCallback = null;
    global.setInterval = (cb) => { nullSessionCallback = cb; return 456; };
    emptyOrchestrator.startTimer();
    if (nullSessionCallback) nullSessionCallback();
    emptyOrchestrator.stopTimer();
    global.setInterval = origSetInterval;
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
                this.state = 'suspended';
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

    // Re-call init when this.ctx exists
    sound.init();

    // Test suspended resume rejection catch (line 23)
    global.window.AudioContext = class {
        constructor() { this.state = 'suspended'; }
        createBuffer() { return { getChannelData: () => new Float32Array(10) }; }
        resume() { return Promise.reject(new Error('Rejected')); }
    };
    sound.ctx = null;
    sound.init();

    // Test when noiseBuffer is null
    sound.noiseBuffer = null;
    sound.playShaveSound();

    // Test catch error block
    global.window.AudioContext = class {
        constructor() { this.state = 'running'; }
        createBuffer() { return { getChannelData: () => new Float32Array(10) }; }
        createBufferSource() { throw new Error('Audio policy error'); }
        createOscillator() { throw new Error('Audio policy error'); }
    };
    sound.ctx = null;
    sound.playShaveSound();
    sound.playComboSound();
    sound.playWinSound();

    delete global.window;

    // Test init & createNoiseBuffer without window / without ctx
    sound.ctx = null;
    sound.init();
    sound.createNoiseBuffer();
    sound.enabled = true;
    sound.playShaveSound();
    sound.playComboSound();
    sound.playWinSound();
});

test('HUD - modal visibility methods showStartModal, hideStartModal, showGameOver, hideOverlay, updateSoundUI, showLoading, hideLoading', async () => {
    const { HUD } = await import('../../src/ui/hud.js');
    let startModalDisplay = 'none';
    let overlayDisplay = 'none';
    let soundText = '';
    let loadingDisplay = 'none';
    let loadingWidth = '0%';
    let loadingText = '';

    let restartClicked = false;
    const mockRestartBtn = { set onclick(fn) { this._cb = fn; }, click() { if (this._cb) this._cb(); } };

    global.document = {
        getElementById: (id) => {
            if (id === 'startModal') return { style: { set display(v) { startModalDisplay = v; } } };
            if (id === 'gameOverlay') return { style: { set display(v) { overlayDisplay = v; } } };
            if (id === 'soundToggleBtn') return { set textContent(v) { soundText = v; } };
            if (id === 'overlayTitle') return { textContent: '', style: {} };
            if (id === 'overlayFinalScore') return { textContent: '' };
            if (id === 'overlayMsg') return { textContent: '' };
            if (id === 'overlayDetail') return { textContent: '' };
            if (id === 'loadingOverlay') return { style: { set display(v) { loadingDisplay = v; } }, classList: { add: () => {}, remove: () => {} } };
            if (id === 'loadingMsg') return { set textContent(v) { loadingText = v; } };
            if (id === 'loadingBarFill') return { style: { set width(v) { loadingWidth = v; } } };
            if (id === 'restartBtn') return mockRestartBtn;
            return null;
        },
        createElement: () => ({ set id(v){}, set className(v){}, set innerHTML(v){}, style: {} }),
        body: { appendChild: () => {} }
    };

    const hud = new HUD();
    hud.overlayEl = { style: {} };
    hud.finalScoreEl = { textContent: '' };
    hud.titleEl = { textContent: '', style: {} };
    hud.msgEl = { textContent: '' };
    hud.soundToggleBtn = { textContent: '' };

    hud.showStartModal();
    assert.equal(startModalDisplay, 'flex');
    hud.hideStartModal();
    assert.equal(startModalDisplay, 'none');

    // Test updateSoundUI (lines 126-129)
    hud.updateSoundUI(true);
    assert.equal(hud.soundToggleBtn.textContent, '🔊 소리 켬');
    hud.updateSoundUI(false);
    assert.equal(hud.soundToggleBtn.textContent, '🔇 음소거');

    // Test showLoading & hideLoading
    hud.showLoading('📷 1/4 이미지 디코딩 중...', 25);
    hud.showLoading('📷 2/4 이미지 디코딩 중...', 50);
    assert.equal(hud.loadingEl.style.display, 'flex');

    hud.hideLoading();
    assert.equal(hud.loadingEl.style.display, 'none');

    // Test showGameOver branches (WON, >=80%, <80% lines 197-201)
    hud.showGameOver({ status: 'WON', percentageCleared: 100, remainingHairs: 0, finalResult: { totalScore: 100 } }, () => {});
    hud.showGameOver({ status: 'PAUSED', percentageCleared: 85, remainingHairs: 5, finalResult: { totalScore: 80 } }, () => {});
    hud.showGameOver({ status: 'TIMEOUT', percentageCleared: 50, remainingHairs: 20, finalResult: { totalScore: 30 } }, () => {});
    hud.showGameOver({ status: 'TIMEOUT', percentageCleared: 10, remainingHairs: 90, finalResult: { totalScore: 5 } }, () => { restartClicked = true; });
    assert.equal(hud.titleEl.textContent, '😅 아쉬워요!');

    mockRestartBtn.click();
    assert.equal(restartClicked, true);

    delete global.document;
});

test('BrushController - tests all mouse, touch, wheel, and window events for 100% UI coverage', async () => {
    const { BrushController } = await import('../../src/ui/brush-controller.js');
    const eventListeners = {};
    const mockCursor = { style: { transform: '', opacity: '', fontSize: '' } };
    const mockCanvas = {
        width: 280, height: 219,
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 280, height: 219 }),
        addEventListener: (evt, fn) => { eventListeners[evt] = fn; }
    };

    const windowListeners = {};
    global.window = {
        addEventListener: (evt, fn) => { windowListeners[evt] = fn; }
    };

    let shaveCount = 0;
    const controller = new BrushController(mockCanvas, mockCursor, () => { shaveCount++; });

    controller.setRadius(4);
    assert.equal(controller.brushRadius, 4);

    // Trigger window events (lines 72-74 of brush-controller)
    if (windowListeners['resize']) windowListeners['resize']();
    if (windowListeners['scroll']) windowListeners['scroll']();
    if (windowListeners['mouseup']) {
        controller.isMouseDown = true;
        controller.lastR = 5;
        controller.lastC = 5;
        windowListeners['mouseup']();
        assert.equal(controller.isMouseDown, false);
        assert.equal(controller.lastR, -1);
    }

    // Trigger canvas mouse events
    if (eventListeners['mousedown']) eventListeners['mousedown']({ clientX: 10, clientY: 10 });
    if (eventListeners['mousemove']) eventListeners['mousemove']({ clientX: 20, clientY: 20 });
    if (eventListeners['mouseenter']) eventListeners['mouseenter']();
    if (eventListeners['mouseleave']) eventListeners['mouseleave']();

    // Trigger wheel events
    if (eventListeners['wheel']) eventListeners['wheel']({ preventDefault: () => {}, deltaY: -10 }); // Increase
    if (eventListeners['wheel']) eventListeners['wheel']({ preventDefault: () => {}, deltaY: 10 });  // Decrease

    // Trigger touch events
    if (eventListeners['touchstart']) eventListeners['touchstart']({ cancelable: true, preventDefault: () => {}, touches: [{ clientX: 5, clientY: 5 }] });
    if (eventListeners['touchmove']) eventListeners['touchmove']({ cancelable: true, preventDefault: () => {}, touches: [{ clientX: 15, clientY: 15 }] });
    if (eventListeners['touchend']) eventListeners['touchend']();

    assert.ok(shaveCount > 0);
    delete global.window;
});

test('HUD - tests URL.revokeObjectURL in handleFileSelected', async () => {
    const { HUD } = await import('../../src/ui/hud.js');
    let revoked = false;
    global.document = {
        getElementById: () => null,
        querySelectorAll: () => [],
        createElement: () => ({ set id(v){}, set className(v){}, set innerHTML(v){}, style: {} }),
        body: { appendChild: () => {} }
    };
    global.URL = {
        createObjectURL: () => 'blob:http://localhost/new',
        revokeObjectURL: () => { revoked = true; }
    };

    const hud = new HUD();
    hud.previewEl = { style: {} };
    hud.previewUrl = 'blob:http://localhost/old';
    hud.handleFileSelected({ type: 'image/png' });
    assert.equal(revoked, true);

    delete global.document;
    delete global.URL;
});

test('HUD - tests initStartModalEvents, drop zone file upload, updateBrushSizeUI, and null guards', async () => {
    const { HUD } = await import('../../src/ui/hud.js');
    let presetClicked = false;
    let customClicked = false;
    let disabledState = true;
    let previewDisplay = 'none';

    const dropZoneListeners = {};
    const inputListeners = {};
    const mockDropZone = {
        addEventListener: (evt, fn) => { dropZoneListeners[evt] = fn; },
        classList: { add: () => {}, remove: () => {} }
    };
    const mockInput = { addEventListener: (evt, fn) => { inputListeners[evt] = fn; }, files: [] };
    const mockStartPreset = { addEventListener: (evt, fn) => { presetClicked = true; } };
    const mockStartCustom = { addEventListener: (evt, fn) => { customClicked = true; }, set disabled(v) { disabledState = v; }, style: {} };
    const mockPreview = { style: { set display(v) { previewDisplay = v; } }, src: '' };
    const mockBrushBtn1 = { getAttribute: () => '1', classList: { add: () => {}, remove: () => {} } };
    const mockBrushBtn3 = { getAttribute: () => '3', classList: { add: () => {}, remove: () => {} } };

    global.document = {
        getElementById: (id) => {
            if (id === 'uploadDropZone') return mockDropZone;
            if (id === 'photoInput') return mockInput;
            if (id === 'startPresetBtn') return mockStartPreset;
            if (id === 'startCustomBtn') return mockStartCustom;
            if (id === 'photoPreview') return mockPreview;
            return null;
        },
        querySelectorAll: () => [mockBrushBtn1, mockBrushBtn3],
        createElement: () => ({ set id(v){}, set className(v){}, set innerHTML(v){}, style: {} }),
        body: { appendChild: () => {} }
    };

    global.FileReader = class {
        readAsDataURL() {
            setTimeout(() => { if (this.onload) this.onload({ target: { result: 'data:image/png;base64,mock' } }); }, 5);
        }
    };
    global.URL = { createObjectURL: () => 'blob:http://localhost/mock' };

    const hud = new HUD();
    hud.updateBrushSizeUI(3);

    // Test dropZone click triggers photoInput.click
    let inputClickCalled = false;
    mockInput.click = () => { inputClickCalled = true; };
    if (dropZoneListeners['click']) {
        dropZoneListeners['click']();
        assert.equal(inputClickCalled, true);
    }

    // Test Drop Event with File and Image undefined fallback (lines 76-77)
    delete global.Image;
    const mockFile = { type: 'image/png' };
    if (dropZoneListeners['drop']) {
        dropZoneListeners['drop']({ preventDefault: () => {}, dataTransfer: { files: [mockFile] } });
    }

    // Test Photo Input Change Event
    if (inputListeners['change']) {
        inputListeners['change']({ target: { files: [mockFile] } });
    }

    // Test showGameOver forfeit message branch (<80% cleared, lines 197-201)
    hud.showGameOver({ status: 'TIMEOUT', percentageCleared: 10, remainingHairs: 90, finalResult: { totalScore: 5 } }, () => {});

    // Test null guards
    const emptyHud = new HUD();
    emptyHud.startModalEl = null;
    emptyHud.overlayEl = null;
    emptyHud.showStartModal();
    emptyHud.hideStartModal();
    emptyHud.showGameOver(null);
    emptyHud.hideOverlay();
    emptyHud.update(null);

    delete global.document;
    delete global.FileReader;
    delete global.URL;
});
