/**
 * Application Entry Point: main.js
 * Bootstraps GameOrchestrator, CanvasRenderer, BrushController, HUD, and SoundEffects.
 * Fully exported and testable in Node.js test runner suite.
 */
import { createCompositionRoot } from './app/composition-root.js';
import { CanvasRenderer } from './ui/canvas-renderer.js';
import { BrushController } from './ui/brush-controller.js';
import { HUD } from './ui/hud.js';
import { SoundEffects } from './ui/sound-effects.js';
import { SessionStatus } from './domain/shave-session.js';

export const KEY_BRUSH_RADIUS_MAP = Object.freeze({
    '1': 1,
    '2': 3,
    '3': 5,
    '4': 7
});

export const bootstrapApp = (doc = typeof document !== 'undefined' ? document : null, win = typeof window !== 'undefined' ? window : null, customAdapters = {}) => {
    if (!doc) return null;

    const canvas = doc.getElementById('gameCanvas');
    const cursor = doc.getElementById('razorCursor');
    const gameContainer = doc.getElementById('gameContainer');
    const changeStageBtn = doc.getElementById('changeStageBtn');

    if (!canvas) return null;

    const compositionRoot = createCompositionRoot(customAdapters);
    const orchestrator = compositionRoot.orchestrator;
    const renderer = new CanvasRenderer(canvas);
    const hud = new HUD();
    const sound = new SoundEffects();

    let currentStageData = null;
    let lastCombo = 1;

    // Brush controller for razor mouse/touch drag and size setting
    const brushController = new BrushController(canvas, cursor, (row, col, radius) => {
        sound.init();
        const { removed } = orchestrator.shave(row, col, radius);
        if (removed > 0) {
            sound.playShaveSound();
        }
    });

    // Sound toggle button in HUD
    if (hud.soundToggleBtn) {
        hud.soundToggleBtn.addEventListener('click', () => {
            const enabled = sound.toggle();
            hud.updateSoundUI(enabled);
        });
    }

    // Synchronize HUD brush button highlight when brush radius changes
    brushController.onRadiusChange(radius => {
        hud.updateBrushSizeUI(radius);
    });

    // Brush size selector buttons
    const brushBtns = doc.querySelectorAll('.brush-btn');
    if (brushBtns && typeof brushBtns.forEach === 'function') {
        brushBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                brushBtns.forEach(b => b.classList && b.classList.remove('active'));
                if (e.target && e.target.classList) e.target.classList.add('active');
                const radiusAttr = e.target ? e.target.getAttribute('data-radius') : '1';
                const radius = parseInt(radiusAttr, 10) || 1;
                brushController.setRadius(radius);
            });
        });
    }

    // Global Keyboard Shortcuts
    if (win && typeof win.addEventListener === 'function') {
        win.addEventListener('keydown', (e) => {
            const activeEl = doc.activeElement;
            const tag = activeEl ? activeEl.tagName.toLowerCase() : '';
            if (tag === 'input' || tag === 'textarea' || (activeEl && activeEl.isContentEditable)) return;

            const radius = KEY_BRUSH_RADIUS_MAP[e.key];
            if (radius !== undefined) {
                brushController.setRadius(radius);
            } else if (e.key === 'r' || e.key === 'R') {
                orchestrator.restart();
            }
        });
    }

    // Change Stage Button in HUD
    if (changeStageBtn) {
        changeStageBtn.addEventListener('click', () => {
            orchestrator.stopTimer();
            hud.showStartModal();
        });
    }

    // Subscribe to state updates with Law of Demeter fix (getCurrentHairGrid)
    orchestrator.onUpdate((snapshot, dirtyCells, isTimerTick) => {
        hud.update(snapshot);
        if (snapshot.comboCount > 1 && snapshot.comboCount !== lastCombo) {
            sound.playComboSound(snapshot.comboCount);
        }
        lastCombo = snapshot.comboCount;

        if (!isTimerTick && orchestrator.currentStageData && orchestrator.session) {
            renderer.requestRender(orchestrator.currentStageData, orchestrator.getCurrentHairGrid(), dirtyCells);
        }
    });

    // Subscribe to Game Over
    orchestrator.onGameOver(snapshot => {
        if (snapshot.status === SessionStatus.WON || snapshot.percentageCleared === 100) {
            sound.playWinSound();
        }
        hud.showGameOver(snapshot, () => {
            orchestrator.restart();
        });
    });

    const startStageWithSource = async (source) => {
        try {
            hud.showLoading('1-Photo 아스키 파이프라인 생성 중...', 10);
            hud.hideStartModal();
            hud.hideOverlay();
            if (gameContainer && gameContainer.style) gameContainer.style.display = 'flex';

            currentStageData = await orchestrator.loadAndStartStage(source, 60, (msg, pct) => {
                hud.showLoading(msg, pct);
            });
            renderer.render(currentStageData, orchestrator.getCurrentHairGrid(), null);
        } catch (err) {
            if (typeof console !== 'undefined' && console.error) console.error('Stage loading error:', err);
            if (typeof alert === 'function') alert(`스테이지 로드 실패: ${err ? err.message : '알 수 없는 오류'}`);
            hud.showStartModal();
        } finally {
            hud.hideLoading();
        }
    };

    // Preset Stage Button Click
    if (hud.startPresetBtn) {
        hud.startPresetBtn.addEventListener('click', () => {
            startStageWithSource('game_data.json');
        });
    }

    // Custom Photo Stage Button Click
    if (hud.startCustomBtn) {
        hud.startCustomBtn.addEventListener('click', () => {
            if (hud.selectedFile) {
                startStageWithSource(hud.selectedFile);
            }
        });
    }

    // Export PNG Image Button in Game Over overlay
    if (hud.exportPngBtn) {
        hud.exportPngBtn.addEventListener('click', () => {
            renderer.exportPng();
        });
    }

    // Show initial Start Modal on launch
    hud.showStartModal();

    return {
        orchestrator,
        renderer,
        hud,
        sound,
        brushController,
        startStageWithSource
    };
};

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', () => bootstrapApp(document, window));
    } else {
        bootstrapApp(document, window);
    }
}
