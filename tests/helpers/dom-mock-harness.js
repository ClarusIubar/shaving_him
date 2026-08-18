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
        listeners,
        addEventListener(evt, fn) {
            listeners[evt] = fn;
        },
        removeEventListener(evt, fn) {
            delete listeners[evt];
        },
        dispatchEvent(evt, data = {}) {
            if (typeof listeners[evt] === 'function') {
                listeners[evt](data);
            }
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

    const bodyChildren = [];

    const mockDoc = {
        getElementById(id) {
            if (!elements.has(id)) {
                const attrs = new Map();
                const listeners = {};
                const el = {
                    id,
                    textContent: '',
                    disabled: false,
                    innerHTML: '',
                    style: {},
                    classList: {
                        classes: new Set(),
                        add(c) { this.classes.add(c); },
                        remove(c) { this.classes.delete(c); },
                        contains(c) { return this.classes.has(c); },
                        toggle(c, force) {
                            if (typeof force === 'boolean') {
                                if (force) this.classes.add(c);
                                else this.classes.delete(c);
                                return force;
                            }
                            if (this.classes.has(c)) {
                                this.classes.delete(c);
                                return false;
                            }
                            this.classes.add(c);
                            return true;
                        }
                    },
                    listeners,
                    addEventListener(evt, fn) { listeners[evt] = fn; },
                    removeEventListener(evt, fn) { delete listeners[evt]; },
                    click() {
                        if (typeof this.onclick === 'function') this.onclick();
                        if (typeof listeners.click === 'function') listeners.click({ target: el });
                    },
                    setAttribute(attr, val) { attrs.set(attr, String(val)); },
                    getAttribute(attr) { return attrs.get(attr) || null; },
                    hasAttribute(attr) { return attrs.has(attr); },
                    removeAttribute(attr) { attrs.delete(attr); }
                };
                elements.set(id, el);
            }
            return elements.get(id);
        },
        createElement(tag) {
            if (tag === 'canvas') {
                return createMockCanvasElement();
            }
            const attrs = new Map();
            const listeners = {};
            const el = {
                tagName: tag,
                id: '',
                className: '',
                innerHTML: '',
                textContent: '',
                style: {},
                classList: {
                    classes: new Set(),
                    add(c) { this.classes.add(c); el.className = Array.from(this.classes).join(' '); },
                    remove(c) { this.classes.delete(c); el.className = Array.from(this.classes).join(' '); },
                    contains(c) { return this.classes.has(c); },
                    toggle(c, force) {
                        if (typeof force === 'boolean') {
                            if (force) this.add(c);
                            else this.remove(c);
                            return force;
                        }
                        if (this.contains(c)) {
                            this.remove(c);
                            return false;
                        }
                        this.add(c);
                        return true;
                    }
                },
                setAttribute(attr, val) {
                    attrs.set(attr, String(val));
                    if (attr === 'class' || attr === 'className') {
                        el.className = String(val);
                        el.classList.classes = new Set(String(val).split(/\s+/).filter(Boolean));
                    }
                },
                getAttribute(attr) { return attrs.get(attr) || null; },
                hasAttribute(attr) { return attrs.has(attr); },
                removeAttribute(attr) { attrs.delete(attr); },
                listeners,
                addEventListener(evt, fn) { listeners[evt] = fn; },
                removeEventListener(evt, fn) { delete listeners[evt]; },
                appendChild() {},
                removeChild() {},
                click() {
                    if (typeof this.onclick === 'function') this.onclick();
                    if (typeof listeners.click === 'function') listeners.click({ target: el });
                }
            };
            return el;
        },
        querySelectorAll(selector) {
            if (selector.startsWith('.')) {
                const cls = selector.slice(1);
                const results = [];
                for (const el of elements.values()) {
                    if (el.classList && el.classList.contains(cls)) results.push(el);
                }
                for (const el of bodyChildren) {
                    if (el.classList && el.classList.contains(cls) && !results.includes(el)) results.push(el);
                }
                return results;
            }
            return [];
        },
        addEventListener() {},
        removeEventListener() {},
        body: {
            children: bodyChildren,
            appendChild(child) {
                bodyChildren.push(child);
                if (child && child.className) {
                    child.className.split(/\s+/).filter(Boolean).forEach(c => child.classList.add(c));
                }
            },
            removeChild(child) {
                const idx = bodyChildren.indexOf(child);
                if (idx !== -1) bodyChildren.splice(idx, 1);
            }
        }
    };

    return mockDoc;
}

export function createMockWindow(doc = null) {
    const documentObj = doc || createMockDocument();
    const listeners = {};
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
        listeners,
        addEventListener(evt, fn) {
            listeners[evt] = fn;
        },
        removeEventListener(evt, fn) {
            delete listeners[evt];
        },
        dispatchEvent(evt, data = {}) {
            if (typeof listeners[evt] === 'function') {
                listeners[evt](data);
            }
        }
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
