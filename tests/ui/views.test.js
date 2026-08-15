import test from 'node:test';
import assert from 'node:assert/strict';

import { StatsHUDView } from '../../src/ui/views/stats-hud-view.js';
import { StageSelectModalView } from '../../src/ui/views/stage-select-modal-view.js';
import { LoadingOverlayView } from '../../src/ui/views/loading-overlay-view.js';
import { GameOverOverlayView } from '../../src/ui/views/game-over-overlay-view.js';
import { HUD } from '../../src/ui/hud.js';

function createMockDoc() {
    const elements = new Map();
    const mockDoc = {
        getElementById(id) {
            if (!elements.has(id)) {
                elements.set(id, {
                    id,
                    textContent: '',
                    style: {},
                    classList: {
                        classes: new Set(),
                        add(c) { this.classes.add(c); },
                        remove(c) { this.classes.delete(c); },
                        contains(c) { return this.classes.has(c); }
                    },
                    listeners: {},
                    addEventListener(evt, fn) { this.listeners[evt] = fn; },
                    click() { if (this.listeners.click) this.listeners.click(); }
                });
            }
            return elements.get(id);
        },
        createElement(tag) {
            return {
                tagName: tag,
                id: '',
                className: '',
                innerHTML: '',
                textContent: '',
                style: {},
                appendChild() {}
            };
        },
        querySelectorAll(sel) {
            return [];
        },
        body: {
            appendChild() {}
        }
    };
    return mockDoc;
}

test('StatsHUDView - handles null doc and null snapshot safely', () => {
    const nullView = new StatsHUDView(null);
    assert.equal(nullView.scoreEl, null);
    nullView.update(null);
    nullView.updateBrushSizeUI(1);

    const doc = createMockDoc();
    const statsView = new StatsHUDView(doc);
    statsView.update(null);
});

test('StatsHUDView - updates snapshot values and combo badge', () => {
    const doc = createMockDoc();
    const statsView = new StatsHUDView(doc);

    statsView.update({
        score: 1500,
        timeLeft: 45,
        remainingHairs: 10,
        percentageCleared: 80,
        comboCount: 5
    });

    assert.equal(statsView.scoreEl.textContent, 1500);
    assert.equal(statsView.timerEl.textContent, 45);
    assert.equal(statsView.remainEl.textContent, 10);
    assert.equal(statsView.barFillEl.style.width, '80%');
    assert.equal(statsView.comboValEl.textContent, 5);
    assert.ok(statsView.comboBadgeEl.classList.contains('active'));
    assert.equal(statsView.comboBadgeEl.style.display, 'inline-block');

    // Combo reset
    statsView.update({
        score: 1500,
        timeLeft: 45,
        remainingHairs: 10,
        percentageCleared: 80,
        comboCount: 1
    });
    assert.ok(!statsView.comboBadgeEl.classList.contains('active'));
    assert.equal(statsView.comboBadgeEl.style.display, 'none');
});

test('StatsHUDView - updates sound toggle text and brush button styles', () => {
    const doc = createMockDoc();
    const b1 = { active: false, getAttribute: () => '1' };
    b1.classList = { add() { b1.active = true; }, remove() { b1.active = false; } };
    const b2 = { active: false, getAttribute: () => '2' };
    b2.classList = { add() { b2.active = true; }, remove() { b2.active = false; } };
    doc.querySelectorAll = () => [b1, b2];

    const statsView = new StatsHUDView(doc);
    statsView.updateSoundUI(true);
    assert.equal(statsView.soundToggleBtn.textContent, '🔊 소리 켬');
    statsView.updateSoundUI(false);
    assert.equal(statsView.soundToggleBtn.textContent, '🔇 음소거');

    statsView.updateBrushSizeUI(2);
    assert.equal(b1.active, false);
    assert.equal(b2.active, true);
});

test('StageSelectModalView - handles null doc gracefully', () => {
    const nullModal = new StageSelectModalView(null);
    assert.equal(nullModal.startModalEl, null);
    nullModal.init();
    nullModal.show();
    nullModal.hide();
});

test('StageSelectModalView - shows, hides, and handles preset/custom selections with URL revoke', () => {
    const doc = createMockDoc();
    const modalView = new StageSelectModalView(doc);

    let presetChosen = null;
    let customFileChosen = null;
    modalView.init(
        (p) => { presetChosen = p; },
        (f) => { customFileChosen = f; }
    );

    modalView.show();
    assert.equal(modalView.startModalEl.style.display, 'flex');

    modalView.startPresetBtn.click();
    assert.equal(presetChosen, 'preset1');

    // First file
    modalView.handleFileSelected({ name: 'photo1.jpg' });
    assert.equal(modalView.startCustomBtn.disabled, false);
    assert.equal(modalView.startCustomBtn.style.opacity, '1');

    // Drag and drop events
    modalView.dropZoneEl.listeners['dragover']({ preventDefault: () => {} });
    assert.ok(modalView.dropZoneEl.classList.contains('drag-over'));

    modalView.dropZoneEl.listeners['dragleave']({ preventDefault: () => {} });
    assert.ok(!modalView.dropZoneEl.classList.contains('drag-over'));

    // Second file (triggers revokeObjectURL path if previewUrl exists)
    modalView.previewUrl = 'blob:test';
    let revoked = null;
    global.URL = {
        revokeObjectURL(url) { revoked = url; },
        createObjectURL() { return 'blob:new'; }
    };
    try {
        modalView.dropZoneEl.listeners['drop']({
            preventDefault: () => {},
            dataTransfer: { files: [{ name: 'photo2.jpg' }] }
        });
        assert.equal(revoked, 'blob:test');
    } finally {
        delete global.URL;
    }

    modalView.startCustomBtn.click();
    assert.deepEqual(customFileChosen, { name: 'photo2.jpg' });

    modalView.hide();
    assert.equal(modalView.startModalEl.style.display, 'none');
});

test('LoadingOverlayView - handles null doc, creates elements and hides', () => {
    const nullLoading = new LoadingOverlayView(null);
    nullLoading.show();
    nullLoading.hide();

    const doc = createMockDoc();
    const loadingView = new LoadingOverlayView(doc);

    loadingView.show('로딩 중...', 50);
    assert.ok(loadingView.loadingEl);

    // Refresh path
    loadingView.show('갱신 중...', 80);

    loadingView.hide();
    assert.equal(loadingView.loadingEl.style.display, 'none');
});

test('GameOverOverlayView - handles null doc and renders result overlays', () => {
    const nullGameOver = new GameOverOverlayView(null);
    nullGameOver.show();
    nullGameOver.hide();

    const doc = createMockDoc();
    const gameOverView = new GameOverOverlayView(doc);

    let restarted = false;
    const snapshot = {
        percentageCleared: 100,
        remainingHairs: 0,
        finalResult: { totalScore: 3000, timeBonus: 200, allClearBonus: 500 }
    };

    // Win
    gameOverView.show(snapshot, true, () => { restarted = true; });
    assert.equal(gameOverView.titleEl.textContent, '🎉 완벽한 면도!');
    assert.equal(gameOverView.overlayEl.style.display, 'flex');

    const restartBtn = doc.getElementById('restartBtn');
    restartBtn.onclick();
    assert.equal(restarted, true);
    assert.equal(gameOverView.overlayEl.style.display, 'none');

    // High percentage (>=80)
    gameOverView.show({ percentageCleared: 85, remainingHairs: 15 }, false, () => {});
    assert.equal(gameOverView.titleEl.textContent, '👏 깔끔해요!');

    // Low percentage (<80)
    gameOverView.show({ percentageCleared: 40, remainingHairs: 60 }, false, () => {});
    assert.equal(gameOverView.titleEl.textContent, '😅 아쉬워요!');
});

test('HUD - full facade integration and property accessor tests', () => {
    const doc = createMockDoc();
    const hud = new HUD(undefined, doc);

    // Test element setters and getters
    const dummy = { textContent: '', style: {} };
    hud.scoreEl = dummy;
    assert.equal(hud.scoreEl, dummy);
    hud.timerEl = dummy;
    assert.equal(hud.timerEl, dummy);
    hud.remainEl = dummy;
    assert.equal(hud.remainEl, dummy);
    hud.barFillEl = dummy;
    assert.equal(hud.barFillEl, dummy);
    hud.comboBadgeEl = dummy;
    assert.equal(hud.comboBadgeEl, dummy);
    hud.comboValEl = dummy;
    assert.equal(hud.comboValEl, dummy);
    hud.soundToggleBtn = dummy;
    assert.equal(hud.soundToggleBtn, dummy);
    hud.exportPngBtn = dummy;
    assert.equal(hud.exportPngBtn, dummy);

    hud.startModalEl = dummy;
    assert.equal(hud.startModalEl, dummy);
    hud.photoInputEl = dummy;
    assert.equal(hud.photoInputEl, dummy);
    hud.dropZoneEl = dummy;
    assert.equal(hud.dropZoneEl, dummy);
    hud.previewEl = dummy;
    assert.equal(hud.previewEl, dummy);
    hud.startPresetBtn = dummy;
    assert.equal(hud.startPresetBtn, dummy);
    hud.startCustomBtn = dummy;
    assert.equal(hud.startCustomBtn, dummy);

    hud.loadingEl = dummy;
    assert.equal(hud.loadingEl, dummy);
    hud.overlayEl = dummy;
    assert.equal(hud.overlayEl, dummy);
    hud.titleEl = dummy;
    assert.equal(hud.titleEl, dummy);
    hud.finalScoreEl = dummy;
    assert.equal(hud.finalScoreEl, dummy);
    hud.msgEl = dummy;
    assert.equal(hud.msgEl, dummy);
    hud.detailEl = dummy;
    assert.equal(hud.detailEl, dummy);

    hud.selectedFile = { name: 'test.png' };
    assert.equal(hud.selectedFile.name, 'test.png');

    hud.previewUrl = 'blob:url';
    assert.equal(hud.previewUrl, 'blob:url');

    hud.handleFileSelected({ name: 'direct.png' });

    hud.showStartModal();
    assert.equal(hud.startModalEl.style.display, 'flex');
    hud.hideStartModal();
    assert.equal(hud.startModalEl.style.display, 'none');

    hud.showLoading('생성 중...', 50);
    assert.ok(hud.loadingEl);
    hud.hideLoading();

    hud.update({ score: 100, timeLeft: 30, remainingHairs: 5, percentageCleared: 90, comboCount: 2 });
    hud.updateSoundUI(true);
    hud.updateBrushSizeUI(1);

    hud.showGameOver({ percentageCleared: 100, remainingHairs: 0, finalResult: { totalScore: 5000 } }, () => {});
    assert.equal(hud.overlayEl.style.display, 'flex');
    hud.hideOverlay();
    assert.equal(hud.overlayEl.style.display, 'none');
});
