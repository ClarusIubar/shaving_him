/**
 * Pure Domain Model: ScoreCalculator
 * Calculates points, streak multipliers, and final game completion bonuses.
 * 0% DOM/Canvas dependency.
 */
export class ScoreCalculator {
    constructor() {
        this.baseScore = 0;
        this.shaveStreak = 0;
    }

    /**
     * Add points for hairs removed in a shave action
     * @param {number} hairCount 
     */
    addShave(hairCount) {
        if (hairCount > 0) {
            this.shaveStreak += 1;
            const multiplier = Math.min(Math.floor(this.shaveStreak / 5) + 1, 5);
            this.baseScore += hairCount * multiplier;
        } else {
            this.shaveStreak = 0;
        }
        return this.baseScore;
    }

    /**
     * Calculate final total score including time & all-clear bonus
     * @param {number} timeLeft - Seconds remaining
     * @param {number} remainingHairs - Hairs left uncleared
     */
    calculateFinalScore(timeLeft = 0, remainingHairs = 0) {
        const timeBonus = Math.max(0, timeLeft) * 5;
        const allClearBonus = remainingHairs === 0 ? 500 : 0;
        
        return {
            baseScore: this.baseScore,
            timeBonus,
            allClearBonus,
            totalScore: this.baseScore + timeBonus + allClearBonus
        };
    }

    reset() {
        this.baseScore = 0;
        this.shaveStreak = 0;
    }
}
