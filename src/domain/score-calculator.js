/**
 * Pure Domain Model: DefaultScoringStrategy
 * Standard scoring rule strategy (10x capped multiplier, 5x time bonus, 500 all-clear).
 */
export class DefaultScoringStrategy {
    calculateMultiplier(streak) {
        return Math.min(Math.floor(streak / 5) + 1, 5);
    }

    calculateTimeBonus(timeLeft) {
        return Math.max(0, timeLeft) * 5;
    }

    calculateAllClearBonus(remainingHairs) {
        return remainingHairs === 0 ? 500 : 0;
    }
}

/**
 * Pure Domain Model: ScoreCalculator
 * Calculates points, streak multipliers, and final game completion bonuses via injected strategy.
 * 0% DOM/Canvas dependency.
 */
export class ScoreCalculator {
    constructor(strategy = new DefaultScoringStrategy()) {
        this.strategy = strategy;
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
            const multiplier = this.strategy.calculateMultiplier(this.shaveStreak);
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
        const timeBonus = this.strategy.calculateTimeBonus(timeLeft);
        const allClearBonus = this.strategy.calculateAllClearBonus(remainingHairs);
        
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
