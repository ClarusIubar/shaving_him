import test from 'node:test';
import assert from 'node:assert/strict';

import { SoundEffects } from '../../src/ui/sound-effects.js';
import { createMockWindow } from '../helpers/dom-mock-harness.js';

test('SoundEffects - initializes and toggles sound cleanly', () => {
    const win = createMockWindow();
    const sound = new SoundEffects(win);
    assert.equal(sound.enabled, true);

    const toggledOff = sound.toggle();
    assert.equal(toggledOff, false);
    assert.equal(sound.enabled, false);

    const toggledOn = sound.toggle();
    assert.equal(toggledOn, true);
    assert.equal(sound.enabled, true);
});

test('SoundEffects - plays shave, combo, and win sounds', () => {
    const win = createMockWindow();
    const sound = new SoundEffects(win);

    sound.init();
    assert.ok(sound.ctx !== null);

    // Audio effects should not throw
    assert.doesNotThrow(() => {
        sound.playShaveSound();
        sound.playComboSound(2);
        sound.playComboSound(5);
        sound.playWinSound();
    });

    // When disabled, playing sounds is a harmless no-op
    sound.enabled = false;
    assert.doesNotThrow(() => {
        sound.playShaveSound();
        sound.playComboSound(3);
        sound.playWinSound();
    });
});

test('SoundEffects - handles AudioContext suspension and missing window gracefully', async () => {
    // Missing window
    const soundNoWin = new SoundEffects(null);
    soundNoWin.init();
    assert.doesNotThrow(() => soundNoWin.playShaveSound());

    // Suspended context with resume rejection
    const win = createMockWindow();
    const sound = new SoundEffects(win);
    sound.init();
    sound.ctx.state = 'suspended';
    sound.ctx.resume = async () => { throw new Error('Resume rejected'); };
    sound.init(); // triggers catch block

    await new Promise(r => setTimeout(r, 10));

    // Audio context error branches
    sound.ctx.createBufferSource = () => { throw new Error('Audio policy error'); };
    sound.ctx.createOscillator = () => { throw new Error('Oscillator error'); };
    assert.doesNotThrow(() => {
        sound.playShaveSound();
        sound.playComboSound(2);
        sound.playWinSound();
    });
});
