/**
 * Application Entry Point: main.js
 * Bootstraps GameOrchestrator, CanvasRenderer, BrushController, and HUD with 60FPS rAF rendering.
 */
import { GameOrchestrator } from './app/game-orchestrator.js';
import { CanvasRenderer } from './ui/canvas-renderer.js';
import { BrushController } from './ui/brush-controller.js';
import { HUD } from './ui/hud.js';

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const cursor = document.getElementById('razorCursor');
    const gameContainer = document.getElementById('gameContainer');
    const changeStageBtn = document.getElementById('changeStageBtn');

    if (!canvas) return;

    const orchestrator = new GameOrchestrator();
    const renderer = new CanvasRenderer(canvas);
    const hud = new HUD();

    let currentStageData = null;

    // Brush controller for razor mouse/touch drag and size setting
    const brushController = new BrushController(canvas, cursor, (row, col, radius) => {
        orchestrator.shave(row, col, radius);
    });

    // Synchronize HUD brush button highlight when brush radius changes (e.g. via mouse wheel)
    brushController.onRadiusChange(radius => {
        hud.updateBrushSizeUI(radius);
    });

    // Brush size selector buttons
    document.querySelectorAll('.brush-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.brush-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const radius = parseInt(e.target.getAttribute('data-radius'), 10);
            brushController.setRadius(radius);
        });
    // Global Keyboard Shortcuts (1-4 for brush radius, R for restart)
    window.addEventListener('keydown', (e) => {
        const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea' || (document.activeElement && document.activeElement.isContentEditable)) return;

        const keyMap = { '1': 1, '2': 3, '3': 5, '4': 7 };
        if (keyMap[e.key] !== undefined) {
            brushController.setRadius(keyMap[e.key]);
        } else if (e.key === 'r' || e.key === 'R') {
            orchestrator.restart();
        }
    });

    // Change Stage Button in HUD
    if (changeStageBtn) {
        changeStageBtn.addEventListener('click', () => {
            orchestrator.stopTimer();
            hud.showStartModal();
        });
    }

    // Subscribe to state updates with high-performance rAF partial redraws
    orchestrator.onUpdate((snapshot, dirtyCells, isTimerTick) => {
        hud.update(snapshot);
        if (!isTimerTick && currentStageData && orchestrator.session) {
            renderer.requestRender(currentStageData, orchestrator.session.hairGrid, dirtyCells);
        }
    });

    // Subscribe to Game Over
    orchestrator.onGameOver(snapshot => {
        hud.showGameOver(snapshot, () => {
            orchestrator.restart();
        });
    });

    const startStageWithSource = async (source) => {
        try {
            hud.showLoading('1-Photo 아스키 파이프라인 생성 중...');
            hud.hideStartModal();
            hud.hideOverlay();
            if (gameContainer) gameContainer.style.display = 'flex';

            currentStageData = await orchestrator.loadAndStartStage(source, 60);
            renderer.requestRender(currentStageData, orchestrator.session.hairGrid, null); // Full initial render
        } catch (err) {
            console.error('Stage loading error:', err);
            alert(`스테이지 로드 실패: ${err.message}`);
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

    // Show initial Start Modal on launch
    hud.showStartModal();
});
