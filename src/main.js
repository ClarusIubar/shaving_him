/**
 * Application Entry Point: main.js
 * Bootstraps GameOrchestrator, CanvasRenderer, BrushController, and HUD.
 */
import { GameOrchestrator } from './app/game-orchestrator.js';
import { CanvasRenderer } from './ui/canvas-renderer.js';
import { BrushController } from './ui/brush-controller.js';
import { HUD } from './ui/hud.js';

window.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.getElementById('gameCanvas');
    const cursor = document.getElementById('razorCursor');
    const loadingScreen = document.getElementById('loadingScreen');
    const gameContainer = document.getElementById('gameContainer');

    if (!canvas) return;

    const orchestrator = new GameOrchestrator();
    const renderer = new CanvasRenderer(canvas);
    const hud = new HUD();

    let currentStageData = null;

    // Brush controller with shave callback
    const brushController = new BrushController(canvas, cursor, (row, col, radius) => {
        orchestrator.shave(row, col, radius);
    });

    // Brush size selector buttons
    document.querySelectorAll('.brush-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.brush-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const radius = parseInt(e.target.getAttribute('data-radius'), 10);
            brushController.setRadius(radius);
        });
    });

    // Subscribe to state updates
    orchestrator.onUpdate(snapshot => {
        hud.update(snapshot);
        if (currentStageData && orchestrator.session) {
            renderer.render(currentStageData, orchestrator.session.hairGrid);
        }
    });

    // Subscribe to Game Over
    orchestrator.onGameOver(snapshot => {
        hud.showGameOver(snapshot, () => {
            orchestrator.restart();
        });
    });

    // Load initial stage
    try {
        currentStageData = await orchestrator.loadAndStartStage('game_data.json', 60);
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (gameContainer) gameContainer.style.display = 'flex';
        renderer.render(currentStageData, orchestrator.session.hairGrid);
    } catch (err) {
        console.error('Stage loading error:', err);
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div style="font-size:32px;color:#ff6b6b">⚠️</div>
                <div>스테이지 로드 실패: ${err.message}</div>
                <button class="btn-primary" onclick="location.reload()" style="margin-top:10px">다시 시도</button>
            `;
        }
    }
});
