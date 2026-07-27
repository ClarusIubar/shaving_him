/**
 * Application Layer: GameOrchestrator
 * Controls game loop clock, state machine transitions, and UI event command dispatching.
 */
import { ShaveSession, SessionStatus } from '../domain/shave-session.js';
import { StagePipeline } from './stage-pipeline.js';

export class GameOrchestrator {
    constructor(stagePipeline = new StagePipeline()) {
        this.pipeline = stagePipeline;
        this.session = null;
        this.timerId = null;
        this.updateCallbacks = [];
        this.gameOverCallbacks = [];
    }

    onUpdate(callback) {
        this.updateCallbacks.push(callback);
    }

    onGameOver(callback) {
        this.gameOverCallbacks.push(callback);
    }

    notifyUpdate(dirtyCells = null, isTimerTick = false) {
        if (!this.session) return;
        const snapshot = this.session.getSnapshot();
        for (let i = 0; i < this.updateCallbacks.length; i++) {
            this.updateCallbacks[i](snapshot, dirtyCells, isTimerTick);
        }
    }

    notifyGameOver() {
        if (!this.session) return;
        const snapshot = this.session.getSnapshot();
        for (let i = 0; i < this.gameOverCallbacks.length; i++) {
            this.gameOverCallbacks[i](snapshot);
        }
    }

    async loadAndStartStage(stageSource = 'game_data.json', maxTime = 60) {
        this.stopTimer();
        const stageData = await this.pipeline.loadStage(stageSource);
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
        if (!this.session) return;
        const { removed, dirtyCells } = this.session.shave(row, col, radius);
        if (removed > 0 || (dirtyCells && dirtyCells.length > 0)) {
            this.notifyUpdate(dirtyCells, false);
            if (this.session.status === SessionStatus.WON) {
                this.stopTimer();
                this.notifyGameOver();
            }
        }
    }

    restart() {
        if (this.session && this.session.hairGrid) {
            const positions = [];
            const grid = this.session.hairGrid;
            for (let r = 0; r < grid.rows; r++) {
                for (let c = 0; c < grid.cols; c++) {
                    if (grid.data[r * grid.cols + c] === 1) {
                        positions.push({ r, c });
                    }
                }
            }

            this.session.initStage({
                rows: grid.rows,
                cols: grid.cols,
                hairPositions: positions
            });
            this.session.start();
            this.startTimer();
            this.notifyUpdate(null, false);
        }
    }
}
