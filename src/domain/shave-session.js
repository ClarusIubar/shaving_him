/**
 * Pure Domain Model: ShaveSession
 * Manages game session lifecycle, timer countdown, and game rules.
 * 0% DOM/Canvas dependency.
 */
import { HairGrid } from './hair-grid.js';
import { ScoreCalculator } from './score-calculator.js';

export const SessionStatus = {
    INIT: 'INIT',
    RUNNING: 'RUNNING',
    PAUSED: 'PAUSED',
    WON: 'WON',
    TIMEOUT: 'TIMEOUT'
};

export class ShaveSession {
    /**
     * @param {Object} stageData - Stage DTO { hairPositions, rows, cols }
     * @param {number} maxTimeSeconds - Total time allowed (default: 60)
     */
    constructor(stageData = null, maxTimeSeconds = 60) {
        this.maxTime = maxTimeSeconds;
        this.timeLeft = maxTimeSeconds;
        this.status = SessionStatus.INIT;
        this.scoreCalculator = new ScoreCalculator();
        this.hairGrid = null;

        if (stageData) {
            this.initStage(stageData);
        }
    }

    initStage(stageData) {
        const { hairPositions = [], rows = 0, cols = 0 } = stageData;
        this.hairGrid = new HairGrid(hairPositions, rows, cols);
        this.scoreCalculator.reset();
        this.timeLeft = this.maxTime;
        this.status = SessionStatus.INIT;
    }

    start() {
        if (!this.hairGrid) throw new Error('Stage not initialized');
        this.status = SessionStatus.RUNNING;
    }

    pause() {
        if (this.status === SessionStatus.RUNNING) {
            this.status = SessionStatus.PAUSED;
        }
    }

    resume() {
        if (this.status === SessionStatus.PAUSED) {
            this.status = SessionStatus.RUNNING;
        }
    }

    /**
     * Decrement timer by 1 second
     * @returns {boolean} True if session ended
     */
    tick() {
        if (this.status !== SessionStatus.RUNNING) return false;

        this.timeLeft -= 1;

        if (this.timeLeft <= 0) {
            this.timeLeft = 0;
            this.status = SessionStatus.TIMEOUT;
            return true;
        }

        return false;
    }

    /**
     * Execute shave action at coordinate (r, c) with given radius
     * @param {number} r 
     * @param {number} c 
     * @param {number} radius 
     */
    shave(r, c, radius = 1) {
        if (this.status !== SessionStatus.RUNNING) return 0;

        const removed = this.hairGrid.shave(r, c, radius);
        this.scoreCalculator.addShave(removed);

        if (this.hairGrid.remainingCount === 0) {
            this.status = SessionStatus.WON;
        }

        return removed;
    }

    getSnapshot() {
        const result = this.scoreCalculator.calculateFinalScore(
            this.timeLeft,
            this.hairGrid ? this.hairGrid.remainingCount : 0
        );

        return {
            status: this.status,
            timeLeft: this.timeLeft,
            maxTime: this.maxTime,
            score: result.baseScore,
            finalResult: result,
            remainingHairs: this.hairGrid ? this.hairGrid.remainingCount : 0,
            totalHairs: this.hairGrid ? this.hairGrid.totalCount : 0,
            percentageCleared: this.hairGrid ? this.hairGrid.percentageCleared : 0
        };
    }
}
