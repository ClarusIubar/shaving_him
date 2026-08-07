/**
 * Concrete Adapter: StaticJsonStageAdapter
 * Loads pre-rendered game stage JSON (e.g. game_data.json) into standard StageDataDTO format.
 * Includes fallback for file:// protocol CORS restrictions.
 */
export class StaticJsonStageAdapter {
    constructor(fetchFunction = (...args) => globalThis.fetch(...args)) {
        this.fetch = fetchFunction;
    }

    /**
     * Load stage data from JSON URL, global variable, or object
     * @param {string|Object} source 
     * @returns {Promise<{ rows: number, cols: number, totalHairCount: number, hairPositions: Array<{r: number, c: number}>, textGrid: string[], colorGrid: Array<Array<[number, number, number]>> }>}
     */
    async loadStage(source = 'game_data.json') {
        let rawData;
        if (typeof window !== 'undefined' && window.EMBEDDED_GAME_DATA && (source === 'game_data.json' || source === 'game_data.js' || !source)) {
            rawData = window.EMBEDDED_GAME_DATA;
        } else if (typeof source === 'string') {
            try {
                const resp = await this.fetch(source);
                if (resp && resp.ok) {
                    rawData = await resp.json();
                } else if (typeof window !== 'undefined' && window.EMBEDDED_GAME_DATA) {
                    rawData = window.EMBEDDED_GAME_DATA;
                } else {
                    throw new Error(`Fetch failed: ${resp ? resp.status : 'unknown'}`);
                }
            } catch (err) {
                // Fallback for file:// protocol or HTTP 404 fetch restrictions in browsers
                if (typeof window !== 'undefined' && window.EMBEDDED_GAME_DATA) {
                    if (typeof console !== 'undefined' && console.error) {
                        console.error('StaticJsonStageAdapter: fetch failed, falling back to window.EMBEDDED_GAME_DATA', err);
                    }
                    rawData = window.EMBEDDED_GAME_DATA;
                } else {
                    throw err;
                }
            }
        } else {
            rawData = source;
        }

        const textGrid = rawData.text || [];
        const colorGrid = rawData.colors || [];
        const rows = rawData.rows || (textGrid ? textGrid.length : 0);
        const cols = rawData.cols || (textGrid && textGrid[0] ? textGrid[0].length : 0);

        return {
            rows,
            cols,
            totalHairCount: rawData.totalHairCount || rawData.hairCount || (rawData.hair ? rawData.hair.length : 0),
            hairPositions: rawData.hair || [],
            textGrid,
            colorGrid
        };
    }
}
