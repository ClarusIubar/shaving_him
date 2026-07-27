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

    notifyUpdate() {
        if (!this.session) return;
        const snapshot = this.session.getSnapshot();
        this.updateCallbacks.forEach(cb => cb(snapshot));
    }

    notifyGameOver() {
        if (!this.session) return;
        const snapshot = this.session.getSnapshot();
        this.gameOverCallbacks.forEach(cb => cb(snapshot));
    }

    async loadAndStartStage(stageSource = 'game_data.json', maxTime = 60) {
        this.stopTimer();
        const stageData = await this.pipeline.loadStage(stageSource);
        this.session = new ShaveSession(stageData, maxTime);
        this.session.start();
        this.startTimer();
        this.notifyUpdate();
        return stageData;
    }

    startTimer() {
        this.stopTimer();
        this.timerId = setInterval(() => {
            if (!this.session) return;
            const ended = this.session.tick();
            this.notifyUpdate();

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
        const removed = this.session.shave(row, col, radius);
        if (removed > 0) {
            this.notifyUpdate();
            if (this.session.status === SessionStatus.WON) {
                this.stopTimer();
                this.notifyGameOver();
            }
        }
    }

    restart() {
        if (this.session && this.session.hairGrid) {
            this.session.initStage({
                rows: this.session.hairGrid.rows,
                cols: this.session.hairGrid.cols,
                hairPositions: Array.from(this.session.hairGrid.hairSet).map(k => {
                    const [r, c] = k.split(',').map(Number);
                    return { r, c };
                })
            });
            this.session.start();
            this.startTimer();
            this.notifyUpdate();
        }
    }
}
