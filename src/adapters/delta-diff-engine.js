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
}
