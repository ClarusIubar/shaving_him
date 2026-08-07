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
    const geometry = compositionRoot.geometry;
    const gamePolicy = compositionRoot.gamePolicy;
    const renderer = new CanvasRenderer(canvas, geometry);
    const hud = new HUD(gamePolicy, doc);
    const sound = new SoundEffects(win);

    let currentStageData = null;
    let lastCombo = 1;

    // Brush controller for razor mouse/touch drag and size setting
    const brushController = new BrushController(canvas, cursor, (row, col, radius) => {
        sound.init();
        const { removed } = orchestrator.shave(row, col, radius);
        if (removed > 0) {
            sound.playShaveSound();
        }
    }, geometry);

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

    // Subscribe to state updates. The orchestrator hands over a single event
    // object carrying everything the UI needs (snapshot, stageData,
    // hairView) so main.js never reaches into its internals (Law of
    // Demeter). hairView is read-only (see HairGrid.toReadOnlyView).
    orchestrator.onUpdate(({ snapshot, dirtyCells, isTimerTick, stageData, hairView }) => {
        hud.update(snapshot);
        if (snapshot.comboCount > 1 && snapshot.comboCount !== lastCombo) {
            sound.playComboSound(snapshot.comboCount);
        }
        lastCombo = snapshot.comboCount;

        if (!isTimerTick && stageData && hairView) {
            renderer.requestRender(stageData, hairView, dirtyCells);
        }
    });

    // Subscribe to Game Over
    orchestrator.onGameOver(snapshot => {
        if (gamePolicy.isVictory(snapshot)) {
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
            // The canvas was hidden (display:none) when BrushController cached its
            // bounding rect at construction time; that cache never refreshes on its
            // own from a script-driven visibility change. Force a fresh read now so
            // the very first pointer/touch interaction resolves to a real cell.
            brushController.invalidateRect();

            currentStageData = await orchestrator.loadAndStartStage(source, 60, (msg, pct) => {
                hud.showLoading(msg, pct);
            });
            renderer.render(currentStageData, orchestrator.getCurrentHairView(), null);
        } catch (err) {
            if (typeof console !== 'undefined' && console.error) console.error('Stage loading error:', err);
            if (typeof alert === 'function') alert(`스테이지 로드 실패: ${err ? err.message : '알 수 없는 오류'}`);
            hud.showStartModal();
        } finally {
            hud.hideLoading();
        }
    };

    // Start Modal Preset & Custom Photo File Selection
    hud.initStartModalEvents(
        (preset) => startStageWithSource(preset === 'preset1' ? 'game_data.json' : preset),
        (file) => startStageWithSource(file)
    );

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

export function initAutoBootstrap(doc = (typeof document !== 'undefined' ? document : null), win = (typeof window !== 'undefined' ? window : null)) {
    if (!doc) return null;
    if (doc.readyState === 'loading') {
        if (win && typeof win.addEventListener === 'function') {
            win.addEventListener('DOMContentLoaded', () => bootstrapApp(doc, win));
        }
        return null;
    }
    return bootstrapApp(doc, win);
}

if (typeof document !== 'undefined') {
    initAutoBootstrap(document, typeof window !== 'undefined' ? window : null);
}
