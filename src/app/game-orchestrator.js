/**
 * Application Layer: GameOrchestrator
 * Controls game loop clock, state machine transitions, and UI event command dispatching.
 */
import { ShaveSession, SessionStatus } from '../domain/shave-session.js';
import { GridGeometry } from '../domain/grid-geometry.js';

export class GameOrchestrator {
    constructor(stagePipeline, gridGeometry = GridGeometry.default()) {
        if (!stagePipeline || typeof stagePipeline.loadStage !== 'function') {
            throw new Error('GameOrchestrator requires a stage pipeline exposing loadStage()');
        }
        this.pipeline = stagePipeline;
        this.geometry = gridGeometry;
        this.session = null;
        this.currentStageData = null;
        this.timerId = null;
        this.updateCallbacks = [];
        this.gameOverCallbacks = [];
    }

    onUpdate(callback) {
        this.updateCallbacks.push(callback);
    }

    offUpdate(callback) {
        const idx = this.updateCallbacks.indexOf(callback);
        if (idx !== -1) this.updateCallbacks.splice(idx, 1);
    }

    onGameOver(callback) {
        this.gameOverCallbacks.push(callback);
    }

    offGameOver(callback) {
        const idx = this.gameOverCallbacks.indexOf(callback);
        if (idx !== -1) this.gameOverCallbacks.splice(idx, 1);
    }

    notifyUpdate(dirtyCells = null, isTimerTick = false) {
        if (!this.session) return;
        // stageData/hairView are included so UI subscribers never need to
        // reach into orchestrator.currentStageData / orchestrator.session
        // directly (Law of Demeter). hairView is a read-only projection of
        // the session's HairGrid (see HairGrid.toReadOnlyView) - a UI
        // subscriber has no business mutating session state through it.
        const event = {
            snapshot: this.session.getSnapshot(),
            dirtyCells,
            isTimerTick,
            stageData: this.currentStageData,
            hairView: this.session.hairGrid.toReadOnlyView()
        };
        for (let i = 0; i < this.updateCallbacks.length; i++) {
            this.updateCallbacks[i](event);
        }
    }

    notifyGameOver() {
        if (!this.session) return;
        const snapshot = this.session.getSnapshot();
        for (let i = 0; i < this.gameOverCallbacks.length; i++) {
            this.gameOverCallbacks[i](snapshot);
        }
    }

    async loadAndStartStage(stageSource = 'game_data.json', maxTime = 60, onProgress = null) {
        this.stopTimer();
        const stageData = await this.pipeline.loadStage(stageSource, this.geometry.cols, this.geometry.rows, {}, onProgress);
        this.currentStageData = stageData;
        this.session = new ShaveSession(stageData, maxTime);
        this.session.start();
        this.startTimer();
        this.notifyUpdate(null, false); // Full initial redraw
        return stageData;
    }

    startTimer() {
        this.stopTimer();
        this.timerId = setInterval(() => {
            if (!this.session) return;
            const ended = this.session.tick();
            this.notifyUpdate(null, true); // Timer tick: HUD update only

            if (ended || this.session.status === SessionStatus.WON || this.session.status === SessionStatus.TIMEOUT) {
                this.stopTimer();
                this.notifyGameOver();
            }
        }, 1000);
        if (this.timerId && typeof this.timerId.unref === 'function') {
            this.timerId.unref();
        }
    }

    stopTimer() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }

    /**
     * Dispatch shave command from UI
     * @param {number} row 
     * @param {number} col 
     * @param {number} radius 
     */
    shave(row, col, radius = 1) {
        if (!this.session || this.session.status !== SessionStatus.RUNNING) {
            return { removed: 0, dirtyCells: [] };
        }
        const result = this.session.shave(row, col, radius);
        const removed = result ? result.removed : 0;
        const dirtyCells = result && result.dirtyCells ? result.dirtyCells : [];

        if (removed > 0 || dirtyCells.length > 0) {
            this.notifyUpdate(dirtyCells, false);
            if (this.session.status === SessionStatus.WON) {
                this.stopTimer();
                this.notifyGameOver();
            }
        }
        return { removed, dirtyCells };
    }

    restart() {
        if (this.session && this.currentStageData) {
            this.session.initStage(this.currentStageData);
            this.session.start();
            this.startTimer();
            this.notifyUpdate(null, false);
        }
    }

    getCurrentHairView() {
        return this.session ? this.session.hairGrid.toReadOnlyView() : null;
    }
}
