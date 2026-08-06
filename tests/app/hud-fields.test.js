/**
 * TSK-008-01: HUD DOM field alignment
 * The constructor's assigned fields and the render methods' referenced fields
 * must be the same set, otherwise a display silently stops updating.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { ShaveSession } from '../../src/domain/shave-session.js';

const HUD_SOURCE = new URL('../../src/ui/hud.js', import.meta.url);

/** Minimal DOM stub that hands out a distinct element per id. */
const stubDocument = () => {
    const byId = new Map();
    const make = (id) => ({
        id,
        style: {},
        textContent: '',
        disabled: false,
        classList: { add() {}, remove() {} },
        addEventListener() {},
        querySelector: () => ({ style: {}, textContent: '' })
    });
    global.document = {
        getElementById: (id) => {
            if (!byId.has(id)) byId.set(id, make(id));
            return byId.get(id);
        },
        querySelectorAll: () => [],
        createElement: () => make('created'),
        body: { appendChild() {} }
    };
    return byId;
};

test('HUD - reflects remaining hairs and cleared progress from a real session snapshot', async () => {
    stubDocument();
    const { HUD } = await import('../../src/ui/hud.js');
    const hud = new HUD();

    const session = new ShaveSession({
        cols: 4,
        rows: 4,
        hairPositions: [{ r: 0, c: 0 }, { r: 1, c: 1 }, { r: 2, c: 2 }, { r: 3, c: 3 }]
    }, 60);
    session.start();
    session.shave(0, 0, 0); // one of four hairs removed -> 25%

    const snapshot = session.getSnapshot();
    assert.equal(snapshot.remainingHairs, 3, 'precondition: snapshot reports three hairs left');

    hud.update(snapshot);

    assert.equal(hud.remainEl.textContent, 3, '#remainVal must show the remaining hair count');
    assert.equal(hud.barFillEl.style.width, '25%', '#progressBarFill must track cleared percentage');

    delete global.document;
});

test('HUD - every DOM field a render method reads is assigned by the constructor', async () => {
    const source = await readFile(HUD_SOURCE, 'utf8');

    const constructorBody = source.slice(
        source.indexOf('constructor('),
        source.indexOf('initStartModalEvents(')
    );
    const assigned = new Set(
        [...constructorBody.matchAll(/this\.(\w+)\s*=/g)].map(m => m[1])
    );

    const renderBody = source.slice(source.indexOf('    update(snapshot)'));
    const referenced = [...renderBody.matchAll(/this\.(\w+El)\b/g)].map(m => m[1]);

    const dangling = [...new Set(referenced)].filter(name => !assigned.has(name));
    assert.deepEqual(
        dangling,
        [],
        `render methods read fields the constructor never assigns: ${dangling.join(', ')}`
    );
});
