/**
 * Verifies that bootstrapApp's DI boundary is complete: HUD and SoundEffects
 * must use the doc/win bootstrapApp was given, never fall back to the global
 * document/window, and the GamePolicy instance must come from the
 * composition root rather than being constructed separately in two places.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

const genericEl = () => ({
    style: {},
    disabled: false,
    classList: { add: () => {}, remove: () => {} },
    textContent: '',
    src: '',
    onclick: null,
    querySelector: () => ({ style: {}, textContent: '' }),
    addEventListener: () => {}
});

const makeCanvas = () => ({
    width: 100, height: 100, style: {},
    getContext: () => ({ scale: () => {}, fillRect: () => {}, fillText: () => {} }),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    addEventListener: () => {}
});

const makeInjectedDoc = () => ({
    readyState: 'complete',
    body: { appendChild: () => {} },
    activeElement: { tagName: 'div', isContentEditable: false },
    getElementById: (id) => (id === 'gameCanvas' ? makeCanvas() : genericEl()),
    querySelectorAll: () => [],
    createElement: () => genericEl(),
    addEventListener: () => {}
});

const makeInjectedWin = () => ({ addEventListener: () => {} });

// main.js runs an auto-bootstrap side effect at top-level import time
// whenever `document` exists. If that first evaluation throws, Node retries
// top-level evaluation on every later import of the same specifier - so this
// warm-up must succeed, with a harmless global, before any test below
// manipulates global.document/window.
global.document = makeInjectedDoc();
global.window = makeInjectedWin();
await import('../../src/main.js');
delete global.document;
delete global.window;

test('bootstrapApp - HUD and SoundEffects use the injected doc/win, never the global document/window', async () => {
    // A global that throws on any access proves the injected doc/win is what
    // actually gets read - if HUD or SoundEffects fall back to the global
    // instead of the objects bootstrapApp was given, this makes that failure
    // loud instead of silently passing because the global happens to work too.
    global.document = {
        getElementById: () => { throw new Error('must not read global.document.getElementById'); },
        querySelectorAll: () => { throw new Error('must not read global.document.querySelectorAll'); },
        createElement: () => { throw new Error('must not read global.document.createElement'); }
    };
    global.window = {
        // BrushController separately reads the global `window` for resize/
        // scroll/mouseup listeners (out of this fix's scope) - keep that
        // harmless so only the AudioContext read this test cares about traps.
        addEventListener: () => {},
        get AudioContext() { throw new Error('must not read global.window.AudioContext'); }
    };

    const doc = makeInjectedDoc();
    const win = makeInjectedWin();

    const { bootstrapApp } = await import('../../src/main.js');
    const app = bootstrapApp(doc, win);
    assert.ok(app, 'bootstrapApp must succeed using only the injected doc/win');

    // Triggers SoundEffects.init(), which used to read window.AudioContext
    // straight off the global.
    assert.doesNotThrow(() => app.sound.playShaveSound());

    delete global.document;
    delete global.window;
});

test('bootstrapApp - HUD and the win-sound check share one GamePolicy instance from the composition root', async () => {
    const doc = makeInjectedDoc();
    const win = makeInjectedWin();

    let victoryCalls = 0;
    const gamePolicyStub = { isVictory: () => { victoryCalls += 1; return true; } };

    const { bootstrapApp } = await import('../../src/main.js');
    const app = bootstrapApp(doc, win, { gamePolicy: gamePolicyStub });
    assert.ok(app);

    assert.equal(app.hud.gamePolicy, gamePolicyStub, "HUD must receive the composition root's GamePolicy, not construct its own default");

    // Invoke the registered game-over handler directly to exercise both
    // consumers without driving a full session to completion: main.js's own
    // win-sound check, and HUD.showGameOver()'s internal verdict. Both must
    // land on the exact same stub - two calls, not a call each on two
    // separately-constructed GamePolicy instances.
    app.orchestrator.gameOverCallbacks[0]({ status: 'WON', percentageCleared: 100, finalResult: {} });
    assert.equal(victoryCalls, 2, 'both the win-sound check and HUD.showGameOver must consult the same injected GamePolicy instance');
});

test('createCompositionRoot - creates and exposes a single GamePolicy instance', async () => {
    const { createCompositionRoot } = await import('../../src/app/composition-root.js');
    const { GamePolicy } = await import('../../src/domain/game-policy.js');

    const root = createCompositionRoot();
    assert.ok(root.gamePolicy instanceof GamePolicy);
});
