/**
 * Concrete Adapter: DeltaDiffEngineAdapter
 * Computes hair coordinates by calculating brightness & color differences between original and skin base.
 */
import { DiffEnginePort } from '../ports/diff-engine.port.js';

export class DeltaDiffEngineAdapter extends DiffEnginePort {
    /**
     * Compute hair positions from brightness differences
     * @param {Array<Array<{r:number, g:number, b:number}>>} originalColors 
     * @param {Array<Array<{r:number, g:number, b:number}>>} skinBaseColors 
     * @param {number} threshold - Minimum brightness difference to count as hair
     */
    computeHairCoordinates(originalColors, skinBaseColors, threshold = 25) {
        const hairPositions = [];
        const rows = Math.min(originalColors.length, skinBaseColors.length);

        for (let r = 0; r < rows; r++) {
            const origRow = originalColors[r];
            const skinRow = skinBaseColors[r];
            const cols = Math.min(origRow.length, skinRow.length);

            for (let c = 0; c < cols; c++) {
                const orig = origRow[c];
                const skin = skinRow[c];

                const origLum = (orig[0] + orig[1] + orig[2]) / 3;
                const skinLum = (skin[0] + skin[1] + skin[2]) / 3;

                // Hair condition: original is significantly darker than skin base
                if (origLum < 100 && (skinLum - origLum) >= threshold) {
                    hairPositions.push({ r, c });
                }
            }
        }

        return hairPositions;
    }

    /**
     * Compute average skin color from brighter non-hair pixels in the image
     * @param {Array<Array<[number, number, number]>>} colors 
     * @param {number} threshold 
     * @returns {[number, number, number]}
     */
    calculateAverageSkinTone(colors, threshold = 80) {
        let sumR = 0, sumG = 0, sumB = 0, count = 0;
        for (let r = 0; r < colors.length; r++) {
            const row = colors[r];
            for (let c = 0; c < row.length; c++) {
                const pixel = row[c];
                const cr = pixel[0], cg = pixel[1], cb = pixel[2], ca = pixel.length > 3 ? pixel[3] : 255;
                if (ca < 128) continue; // Skip transparent pixels
                const lum = (cr + cg + cb) / 3;
                if (lum >= threshold) {
                    sumR += cr;
                    sumG += cg;
                    sumB += cb;
                    count++;
                }
            }
        }
        if (count === 0) return [210, 180, 150]; // Fallback default
        return [
            Math.round(sumR / count),
            Math.round(sumG / count),
            Math.round(sumB / count)
        ];
    }
}
