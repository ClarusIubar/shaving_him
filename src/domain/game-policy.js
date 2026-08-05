/**
 * Pure Domain Model: GamePolicy
 * Encapsulates game victory rules and policy evaluations.
 * 0% DOM/Canvas dependency.
 */
import { SessionStatus } from './shave-session.js';

export class GamePolicy {
    /**
     * Evaluate if the given snapshot represents a victory
     * @param {Object} snapshot - { status, percentageCleared }
     * @returns {boolean}
     */
    isVictory(snapshot) {
        if (!snapshot) return false;
        return snapshot.status === SessionStatus.WON || snapshot.percentageCleared === 100;
    }
}
