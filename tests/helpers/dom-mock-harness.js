/**
 * Test Helper: dom-mock-harness
 * Standardized mock harness for Document, Window, Canvas 2D context, and Web Audio API.
 * Provides unified fixture factories and global injection/teardown mechanics.
 */

export function createMockAudioContext() {
    return {
        state: 'running',
        currentTime: 0,
        sampleRate: 44100,
        destination: {},
        createOscillator() {
            return {
                type: 'sine',
                frequency: {
                    setValueAtTime() {},
                    exponentialRampToValueAtTime() {}
                },
                connect() {},
                start() {},
                stop() {}
            };
        },
        createGain() {
            return {
                gain: {
                    value: 1,
                    setValueAtTime() {},
                    linearRampToValueAtTime() {},
                    exponentialRampToValueAtTime() {}
                },
                connect() {}
            };
        },
        createBuffer(channels, length, sampleRate) {
            const channelData = new Float32Array(length);
            return {
                getChannelData: () => channelData
            };
        },
        createBufferSource() {
            return {
                buffer: null,
                connect() {},
                start() {},
                stop() {}
            };
        },
        createBiquadFilter() {
            return {
                type: 'bandpass',
                frequency: { setValueAtTime() {} },
                Q: { setValueAtTime() {} },
                connect() {}
            };
        },
        resume: async () => {}
    };
}

export function createMockCanvasElement(width = 800, height = 600) {
    const ctx = {
        canvas: null,
        font: '',
        textBaseline: 'top',
        fillStyle: '#000000',
        scale() {},
        fillRect() {},
        fillText() {},
        clearRect() {},
        drawImage() {},
        getImageData() {
            return {
                data: new Uint8ClampedArray(width * height * 4),
                width,
                height
            };
        }
    };

    const listeners = {};

    const canvas = {
        id: 'gameCanvas',
        width,
        height,
        style: {
            width: `${width}px`,
            height: `${height}px`
        },
        getContext(type) {
            if (type === '2d') {
                ctx.canvas = canvas;
                return ctx;
            }
            return null;
        },
        getBoundingClientRect() {
            return {
                left: 0,
                top: 0,
                width: canvas.width,
                height: canvas.height,
                right: canvas.width,
                bottom: canvas.height
            };
        },
        addEventListener(evt, fn) {
            listeners[evt] = fn;
        },
        removeEventListener(evt, fn) {
            delete listeners[evt];
        },
        toDataURL() {
            return 'data:image/png;base64,mock';
        }
    };

    return canvas;
}

export function createMockDocument() {
    const elements = new Map();
    elements.set('gameCanvas', createMockCanvasElement());

    const mockDoc = {
        getElementById(id) {
            if (!elements.has(id)) {
                elements.set(id, {
                    id,
                    textContent: '',
                    disabled: false,
                    innerHTML: '',
                    style: {},
                    classList: {
                        classes: new Set(),
                        add(c) { this.classes.add(c); },
                        remove(c) { this.classes.delete(c); },
                        contains(c) { return this.classes.has(c); }
                    },
                    listeners: {},
                    addEventListener(evt, fn) { this.listeners[evt] = fn; },
                    removeEventListener(evt, fn) { delete this.listeners[evt]; },
                    click() {
                        if (typeof this.onclick === 'function') this.onclick();
                        if (typeof this.listeners.click === 'function') this.listeners.click();
                    },
                    getAttribute(attr) { return null; }
                });
            }
            return elements.get(id);
        },
        createElement(tag) {
            if (tag === 'canvas') {
                return createMockCanvasElement();
            }
            return {
                tagName: tag,
                id: '',
                className: '',
                innerHTML: '',
                textContent: '',
                style: {},
                appendChild() {},
                removeChild() {},
                click() {}
            };
        },
        querySelectorAll(selector) {
            return [];
        },
        addEventListener() {},
        removeEventListener() {},
        body: {
            appendChild() {},
            removeChild() {}
        }
    };

    return mockDoc;
}

export function createMockWindow(doc = null) {
    const documentObj = doc || createMockDocument();
    return {
        document: documentObj,
        devicePixelRatio: 1,
        AudioContext: function() { return createMockAudioContext(); },
        webkitAudioContext: function() { return createMockAudioContext(); },
        requestAnimationFrame(cb) {
            return setTimeout(cb, 16);
        },
        cancelAnimationFrame(id) {
            clearTimeout(id);
        },
        addEventListener() {},
        removeEventListener() {}
    };
}

export function setupGlobalDOM(overrides = {}) {
    const prevDoc = global.document;
    const prevWin = global.window;
    const prevRaf = global.requestAnimationFrame;

    const doc = overrides.document || createMockDocument();
    const win = overrides.window || createMockWindow(doc);

    global.document = doc;
    global.window = win;
    global.requestAnimationFrame = win.requestAnimationFrame;

    const teardown = () => {
        if (prevDoc !== undefined) {
            global.document = prevDoc;
        } else {
            delete global.document;
        }

        if (prevWin !== undefined) {
            global.window = prevWin;
        } else {
            delete global.window;
        }

        if (prevRaf !== undefined) {
            global.requestAnimationFrame = prevRaf;
        } else {
            delete global.requestAnimationFrame;
        }
    };

    return { document: doc, window: win, teardown };
}
