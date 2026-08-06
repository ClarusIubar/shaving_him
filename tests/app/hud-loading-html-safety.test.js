/**
 * TSK-009-03: HUD.showLoading() must never let its message argument be
 * parsed as HTML. Today every caller passes a hardcoded string, but the
 * method interpolates `message` straight into an innerHTML template - a
 * future caller that routes a filename or server response through here
 * would open an XSS vector with zero warning.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

const stubDocument = () => {
    const capturedInnerHTML = [];
    let msgTextContent = null;
    let fillWidth = null;

    const loadingMsgNode = {
        set textContent(v) { msgTextContent = v; },
        get textContent() { return msgTextContent; }
    };
    const loadingBarFillNode = {
        style: {
            set width(v) { fillWidth = v; },
            get width() { return fillWidth; }
        }
    };

    const loadingEl = {
        style: {},
        set innerHTML(v) { capturedInnerHTML.push(v); },
        get innerHTML() { return capturedInnerHTML[capturedInnerHTML.length - 1] || ''; }
    };

    global.document = {
        getElementById: (id) => {
            if (id === 'loadingMsg') return loadingMsgNode;
            if (id === 'loadingBarFill') return loadingBarFillNode;
            return null;
        },
        querySelectorAll: () => [],
        createElement: () => loadingEl,
        body: { appendChild() {} }
    };

    return { capturedInnerHTML, getMsgTextContent: () => msgTextContent, getFillWidth: () => fillWidth };
};

test('HUD - showLoading never lets its message be parsed as HTML', async () => {
    const probe = stubDocument();
    const { HUD } = await import('../../src/ui/hud.js');
    const hud = new HUD();

    const dangerous = '<img src=x onerror="alert(1)">';
    hud.showLoading(dangerous, 42);

    const everInjectedAsMarkup = probe.capturedInnerHTML.some(html => html.includes(dangerous));
    assert.equal(
        everInjectedAsMarkup,
        false,
        'the message must never be concatenated into an innerHTML string - it has to be assigned as text'
    );

    assert.equal(probe.getMsgTextContent(), dangerous, 'the literal message text must still reach the loading label');

    delete global.document;
});

test('HUD - showLoading still updates message/percentage on the refresh path', async () => {
    const probe = stubDocument();
    const { HUD } = await import('../../src/ui/hud.js');
    const hud = new HUD();

    hud.showLoading('첫 메시지', 10);
    hud.showLoading('두번째 메시지', 55);

    assert.equal(probe.getMsgTextContent(), '두번째 메시지');
    assert.equal(probe.getFillWidth(), '55%');

    delete global.document;
});
