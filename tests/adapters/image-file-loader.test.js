import test from 'node:test';
import assert from 'node:assert/strict';

import { ImageFileLoader } from '../../src/adapters/helpers/image-file-loader.js';
import { CanvasRenderer } from '../../src/ui/canvas-renderer.js';
import { createMockCanvasElement } from '../helpers/dom-mock-harness.js';
import { GridGeometry } from '../../src/domain/grid-geometry.js';

test('CanvasRenderer - constructor accepts injected ParticleSystem (DI support)', () => {
    const canvas = createMockCanvasElement(100, 100);
    const geometry = new GridGeometry(10, 10, 6, 6);
    let spawnCalled = false;
    const mockParticleSystem = {
        fontW: 6,
        fontH: 6,
        particles: [],
        rafId: null,
        spawn: () => { spawnCalled = true; },
        ensureLoop: () => {},
        updateAndRender: () => {},
        clear: () => {}
    };

    const renderer = new CanvasRenderer(canvas, geometry, mockParticleSystem);
    assert.equal(renderer.particleSystem, mockParticleSystem);

    renderer.spawnParticles([{ r: 1, c: 1 }]);
    assert.equal(spawnCalled, true);
});

test('ImageFileLoader - rejects on null or missing file', async () => {
    await assert.rejects(() => ImageFileLoader.load(null), /파일이 지정되지 않았습니다/);
});

test('ImageFileLoader - rejects when FileReader is not available in environment', async () => {
    const prevFileReader = global.FileReader;
    delete global.FileReader;
    try {
        await assert.rejects(() => ImageFileLoader.load({}), /FileReader API가 지원되지 않는/);
    } finally {
        if (prevFileReader) global.FileReader = prevFileReader;
    }
});

test('ImageFileLoader - loads valid file into Image successfully', async () => {
    const prevFileReader = global.FileReader;
    const prevImage = global.Image;

    class MockFileReader {
        readAsDataURL() {
            setTimeout(() => {
                if (this.onload) this.onload({ target: { result: 'data:image/png;base64,valid' } });
            }, 10);
        }
    }
    class MockImage {
        constructor() {
            this.naturalWidth = 280;
            this.naturalHeight = 219;
        }
        set src(val) {
            setTimeout(() => {
                if (this.onload) this.onload();
            }, 10);
        }
    }

    global.FileReader = MockFileReader;
    global.Image = MockImage;

    try {
        const img = await ImageFileLoader.load(new Object());
        assert.ok(img);
        assert.equal(img.naturalWidth, 280);
        assert.equal(img.naturalHeight, 219);
    } finally {
        if (prevFileReader) global.FileReader = prevFileReader;
        else delete global.FileReader;
        if (prevImage) global.Image = prevImage;
        else delete global.Image;
    }
});

test('ImageFileLoader - rejects when image dimensions are 0 or corrupted', async () => {
    const prevFileReader = global.FileReader;
    const prevImage = global.Image;

    class MockFileReader {
        readAsDataURL() {
            setTimeout(() => {
                if (this.onload) this.onload({ target: { result: 'data:image/png;base64,empty' } });
            }, 10);
        }
    }
    class MockImage {
        constructor() {
            this.naturalWidth = 0;
            this.naturalHeight = 0;
        }
        set src(val) {
            setTimeout(() => {
                if (this.onload) this.onload();
            }, 10);
        }
    }

    global.FileReader = MockFileReader;
    global.Image = MockImage;

    try {
        await assert.rejects(() => ImageFileLoader.load(new Object()), /이미지 크기가 0px이거나 손상된/);
    } finally {
        if (prevFileReader) global.FileReader = prevFileReader;
        else delete global.FileReader;
        if (prevImage) global.Image = prevImage;
        else delete global.Image;
    }
});

test('ImageFileLoader - rejects when Image onerror or FileReader onerror triggers', async () => {
    const prevFileReader = global.FileReader;
    const prevImage = global.Image;

    class ErrorFileReader {
        readAsDataURL() {
            setTimeout(() => {
                if (this.onerror) this.onerror(new Error('Read failed'));
            }, 10);
        }
    }

    global.FileReader = ErrorFileReader;
    try {
        await assert.rejects(() => ImageFileLoader.load(new Object()), /파일 읽기 과정에서 오류/);
    } finally {
        if (prevFileReader) global.FileReader = prevFileReader;
        else delete global.FileReader;
    }

    class MockFileReaderSuccess {
        readAsDataURL() {
            setTimeout(() => {
                if (this.onload) this.onload({ target: { result: 'data:image/png;base64,corrupt' } });
            }, 10);
        }
    }
    class ErrorImage {
        set src(val) {
            setTimeout(() => {
                if (this.onerror) this.onerror(new Error('Image failed'));
            }, 10);
        }
    }

    global.FileReader = MockFileReaderSuccess;
    global.Image = ErrorImage;
    try {
        await assert.rejects(() => ImageFileLoader.load(new Object()), /유효하지 않거나 손상된 이미지/);
    } finally {
        if (prevFileReader) global.FileReader = prevFileReader;
        else delete global.FileReader;
        if (prevImage) global.Image = prevImage;
        else delete global.Image;
    }
});

test('ImageFileLoader - resolves fallback object if Image class is undefined in environment', async () => {
    const prevFileReader = global.FileReader;
    const prevImage = global.Image;

    class MockFileReader {
        readAsDataURL() {
            setTimeout(() => {
                if (this.onload) this.onload({ target: { result: 'data:image/png;base64,raw' } });
            }, 10);
        }
    }

    global.FileReader = MockFileReader;
    delete global.Image;

    try {
        const result = await ImageFileLoader.load(new Object());
        assert.deepEqual(result, {});
    } finally {
        if (prevFileReader) global.FileReader = prevFileReader;
        else delete global.FileReader;
        if (prevImage) global.Image = prevImage;
    }
});
