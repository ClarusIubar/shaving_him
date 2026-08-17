import test from 'node:test';
import assert from 'node:assert/strict';

import { HUD } from '../../src/ui/hud.js';
import { GamePolicy } from '../../src/domain/game-policy.js';
import { createMockDocument } from '../helpers/dom-mock-harness.js';

test('HUD - fields assignment and snapshot presentation', () => {
    const doc = createMockDocument();
    const hud = new HUD(new GamePolicy(), doc);

    hud.update({
        score: 2500,
        timeLeft: 50,
        remainingHairs: 12,
        percentageCleared: 75,
        comboCount: 4
    });

    assert.equal(hud.scoreEl.textContent, 2500);
    assert.equal(hud.timerEl.textContent, 50);
    assert.equal(hud.remainEl.textContent, 12);
    assert.equal(hud.barFillEl.style.width, '75%');
    assert.equal(hud.comboValEl.textContent, 4);

    hud.updateSoundUI(true);
    assert.equal(hud.soundToggleBtn.textContent, '🔊 소리 켬');
    hud.updateSoundUI(false);
    assert.equal(hud.soundToggleBtn.textContent, '🔇 음소거');

    hud.updateBrushSizeUI(3);
});

test('HUD - loading screen never parses message as HTML (XSS prevention)', () => {
    const doc = createMockDocument();
    const hud = new HUD(new GamePolicy(), doc);

    const maliciousMsg = '<img src=x onerror=alert(1)>';
    hud.showLoading(maliciousMsg, 40);

    const msgNode = doc.getElementById('loadingMsg');
    assert.equal(msgNode.textContent, maliciousMsg);

    hud.hideLoading();
    assert.equal(hud.loadingEl.style.display, 'none');
});

test('HUD - game over victory and restart flow', () => {
    const doc = createMockDocument();
    const hud = new HUD(new GamePolicy(), doc);

    let restartTriggered = false;
    hud.showGameOver({
        status: 'WON',
        remainingHairs: 0,
        percentageCleared: 100,
        finalResult: { totalScore: 5000, timeBonus: 200, allClearBonus: 500 }
    }, () => {
        restartTriggered = true;
    });

    assert.equal(hud.titleEl.textContent, '🎉 완벽한 면도!');
    assert.equal(hud.overlayEl.style.display, 'flex');

    const restartBtn = doc.getElementById('restartBtn');
    restartBtn.click();
    assert.equal(restartTriggered, true);
    assert.equal(hud.overlayEl.style.display, 'none');

    // Partial clear branches
    hud.showGameOver({ status: 'TIMEOUT', percentageCleared: 85, remainingHairs: 5, finalResult: { totalScore: 80, timeBonus: 0, allClearBonus: 0 } });
    hud.showGameOver({ status: 'TIMEOUT', percentageCleared: 50, remainingHairs: 20, finalResult: { totalScore: 30, timeBonus: 0, allClearBonus: 0 } });
    hud.showGameOver({ status: 'TIMEOUT', percentageCleared: 10, remainingHairs: 90, finalResult: { totalScore: 5, timeBonus: 0, allClearBonus: 0 } });
    assert.equal(hud.titleEl.textContent, '😅 아쉬워요!');
});

test('HUD - Fail-Fast doc requirement and modal controls', () => {
    assert.throws(() => new HUD(new GamePolicy(), null), /HUD: document is required/);

    const doc = createMockDocument();
    const hud = new HUD(new GamePolicy(), doc);
    hud.showStartModal();
    assert.equal(hud.startModalEl.style.display, 'flex');
    hud.hideStartModal();
    assert.equal(hud.startModalEl.style.display, 'none');
});

test('HUD - modal file drop and preview selection', () => {
    const doc = createMockDocument();
    const hud = new HUD(new GamePolicy(), doc);

    let presetSource = null;
    let customSource = null;
    hud.initStartModalEvents(
        (preset) => { presetSource = preset; },
        (file) => { customSource = file; }
    );

    const dropZone = doc.getElementById('uploadDropZone');
    const photoInput = doc.getElementById('photoInput');

    let photoInputClicked = false;
    photoInput.click = () => { photoInputClicked = true; };
    dropZone.click();
    assert.equal(photoInputClicked, true);

    const mockFile = { name: 'portrait.png', type: 'image/png' };
    dropZone.listeners['drop']({
        preventDefault: () => {},
        dataTransfer: { files: [mockFile] }
    });

    photoInput.listeners['change']({
        target: { files: [mockFile] }
    });
});
