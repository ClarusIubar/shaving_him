/**
 * Application Entry Point: main.js
 * Bootstraps GameOrchestrator, CanvasRenderer, BrushController, HUD, SoundEffects, and InputManager.
 * Fully exported and testable in Node.js test runner suite.
 */
import { createCompositionRoot } from './app/composition-root.js';
import { CanvasRenderer } from './ui/canvas-renderer.js';
import { BrushController } from './ui/brush-controller.js';
import { HUD } from './ui/hud.js';
import { SoundEffects } from './ui/sound-effects.js';
import { InputManager, KEY_BRUSH_RADIUS_MAP } from './ui/input-manager.js';

export { KEY_BRUSH_RADIUS_MAP };

function getDefaultDocument() {
    if (typeof document === 'undefined') return null;
    return document;
}

function getDefaultWindow() {
    if (typeof window === 'undefined') return null;
    return window;
}

export const bootstrapApp = (doc = getDefaultDocument(), win = getDefaultWindow(), customAdapters = {}) => {
    if (!doc) return null;

    const canvas = doc.getElementById('gameCanvas');
    const cursor = doc.getElementById('razorCursor');
    const gameContainer = doc.getElementById('gameContainer');

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

    // Input manager encapsulates all DOM keyboard shortcuts, brush buttons, sound toggle, change stage
    const inputManager = new InputManager({
        doc,
        win,
        brushController,
        orchestrator,
        hud,
        sound
    });

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
            brushController.invalidateRect();

            currentStageData = await orchestrator.loadAndStartStage(source, 60, (msg, pct) => {
                hud.showLoading(msg, pct);
            });
            renderer.render(currentStageData, orchestrator.getCurrentHairView(), null);
        } catch (err) {
            if (typeof console !== 'undefined' && console.error) console.error('Stage loading error:', err);
            let errMsg = '알 수 없는 오류';
            if (err && err.message) {
                errMsg = err.message;
            }
            if (typeof alert === 'function') alert(`스테이지 로드 실패: ${errMsg}`);
            hud.showStartModal();
        } finally {
            hud.hideLoading();
        }
    };

    // Start Modal Preset & Custom Photo File Selection
    hud.initStartModalEvents(
        (preset) => {
            let src = preset;
            if (preset === 'preset1') {
                src = 'game_data.json';
            }
            return startStageWithSource(src);
        },
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
        inputManager,
        startStageWithSource
    };
};

export function initAutoBootstrap(doc = getDefaultDocument(), win = getDefaultWindow()) {
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
    let globalWin = null;
    if (typeof window !== 'undefined') {
        globalWin = window;
    }
    initAutoBootstrap(document, globalWin);
}
