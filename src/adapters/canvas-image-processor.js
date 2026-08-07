/**
 * Concrete Adapter: CanvasImageProcessorAdapter
 * Performs in-browser skin-smoothing and hair mask extraction using HTML5 Canvas 2D ImageData.
 */
import { ImageProcessorPort } from '../ports/image-processor.port.js';

export class CanvasImageProcessorAdapter extends ImageProcessorPort {
    /**
     * Reads a File or HTMLImageElement and resizes it to target grid dimensions (e.g. 280x219)
     * @param {File|HTMLImageElement} source 
     * @param {number} targetWidth 
     * @param {number} targetHeight 
     * @returns {Promise<{ imageData: ImageData, colors: Array<Array<[number, number, number]>> }>}
     */
    async processImageSource(source, targetWidth = 280, targetHeight = 219) {
        let img;
        if (typeof HTMLImageElement !== 'undefined' && source instanceof HTMLImageElement) {
            img = source;
        } else if (typeof File !== 'undefined' && source instanceof File) {
            img = await this.loadImageFile(source);
        } else if (source && typeof source === 'object' && ('naturalWidth' in source || 'src' in source)) {
            img = source;
        } else {
            throw new Error('Invalid image source type');
        }

        if (img && typeof img.naturalWidth === 'number' && (img.naturalWidth === 0 || img.naturalHeight === 0)) {
            throw new Error('이미지 해상도를 읽을 수 없습니다.');
        }

        const canvas = typeof document !== 'undefined'
            ? document.createElement('canvas')
            : null;

        if (!canvas) {
            throw new Error('캔버스를 생성할 수 없는 환경입니다.');
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('캔버스 2D 컨텍스트를 가져올 수 없습니다.');
        }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const colors = [];

        for (let y = 0; y < targetHeight; y++) {
            const rowColors = [];
            for (let x = 0; x < targetWidth; x++) {
                const idx = (y * targetWidth + x) * 4;
                rowColors.push([
                    imageData.data[idx],
                    imageData.data[idx + 1],
                    imageData.data[idx + 2],
                    imageData.data[idx + 3]
                ]);
            }
            colors.push(rowColors);
        }

        return { imageData, colors };
    }

    loadImageFile(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                return reject(new Error('파일이 지정되지 않았습니다.'));
            }
            if (typeof FileReader === 'undefined') {
                return reject(new Error('FileReader API가 지원되지 않는 환경입니다.'));
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                if (typeof Image === 'undefined') {
                    return resolve({});
                }
                const img = new Image();
                img.onload = () => {
                    if (img.naturalWidth === 0 || img.naturalHeight === 0) {
                        reject(new Error('이미지 크기가 0px이거나 손상된 파일입니다.'));
                    } else {
                        resolve(img);
                    }
                };
                img.onerror = () => reject(new Error('유효하지 않거나 손상된 이미지 파일입니다.'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('파일 읽기 과정에서 오류가 발생했습니다.'));
            reader.readAsDataURL(file);
        });
    }
}
