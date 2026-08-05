import test from 'node:test';
import assert from 'node:assert/strict';
import { GamePolicy } from '../../src/domain/game-policy.js';
import { SessionStatus } from '../../src/domain/shave-session.js';

test('GamePolicy - evaluates victory condition correctly', () => {
    const policy = new GamePolicy();

    assert.equal(policy.isVictory({ status: SessionStatus.WON, percentageCleared: 100 }), true);
    assert.equal(policy.isVictory({ status: SessionStatus.RUNNING, percentageCleared: 100 }), true);
    assert.equal(policy.isVictory({ status: SessionStatus.RUNNING, percentageCleared: 99 }), false);
    assert.equal(policy.isVictory({ status: SessionStatus.TIMEOUT, percentageCleared: 50 }), false);
});
