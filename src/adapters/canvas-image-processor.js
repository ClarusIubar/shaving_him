/**
 * Concrete Adapter: CanvasImageProcessorAdapter
 * Performs in-browser skin-smoothing and hair mask extraction using HTML5 Canvas 2D ImageData.
 */
import { ImageProcessorPort } from '../ports/image-processor.port.js';

export class CanvasImageProcessorAdapter extends ImageProcessorPort {
    /**
     * Smooths out dark hair pixels by replacing them with surrounding skin tones
     * @param {ImageData} imageData 
     * @param {number} threshold - Brightness threshold to treat as hair
     */
    processSkinSmoothing(imageData, threshold = 80) {
        const { width, height, data } = imageData;
        const output = new Uint8ClampedArray(data);

        // Simple spatial median/skin fill filter for dark hair pixels
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                const r = data[idx], g = data[idx + 1], b = data[idx + 2];
                const lum = (r + g + b) / 3;

                if (lum < threshold) {
                    // Sample neighbor pixels to estimate skin color
                    let sumR = 0, sumG = 0, sumB = 0, count = 0;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dx === 0 && dy === 0) continue;
                            const nIdx = ((y + dy) * width + (x + dx)) * 4;
                            const nLum = (data[nIdx] + data[nIdx + 1] + data[nIdx + 2]) / 3;
                            if (nLum >= threshold) {
                                sumR += data[nIdx];
                                sumG += data[nIdx + 1];
                                sumB += data[nIdx + 2];
                                count++;
                            }
                        }
                    }

                    if (count > 0) {
                        output[idx] = Math.round(sumR / count);
                        output[idx + 1] = Math.round(sumG / count);
                        output[idx + 2] = Math.round(sumB / count);
                    }
                }
            }
        }

        return new ImageData(output, width, height);
    }
}
