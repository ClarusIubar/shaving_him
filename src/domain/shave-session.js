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
        const { hairPositions = [], rows = 219, cols = 280 } = stageData;
        this.hairGrid = new HairGrid(rows, cols, hairPositions);
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
     * @returns {{ removed: number, dirtyCells: Array<{r: number, c: number}> }}
     */
    shave(r, c, radius = 1) {
        if (this.status !== SessionStatus.RUNNING) {
            return { removed: 0, dirtyCells: [] };
        }

        const { count, dirtyCells } = this.hairGrid.shave(r, c, radius);
        this.scoreCalculator.addShave(count);

        if (this.hairGrid.getRemainingCount() === 0) {
            this.status = SessionStatus.WON;
        }

        return { removed: count, dirtyCells };
    }

    getSnapshot() {
        const remain = this.hairGrid ? this.hairGrid.getRemainingCount() : 0;
        const total = this.hairGrid ? this.hairGrid.totalHairCount : 0;
        const clearedPct = this.hairGrid ? this.hairGrid.getClearedPercentage() : 0;

        const result = this.scoreCalculator.calculateFinalScore(
            this.timeLeft,
            remain
        );

        return {
            status: this.status,
            timeLeft: this.timeLeft,
            maxTime: this.maxTime,
            score: result.baseScore,
            finalResult: result,
            remainingHairs: remain,
            totalHairs: total,
            percentageCleared: clearedPct
        };
    }
}
