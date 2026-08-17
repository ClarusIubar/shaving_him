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

        if (typeof source === 'object' && source !== null) {
            rawData = source;
        } else {
            const hasEmbedded = typeof window !== 'undefined' && Boolean(window.EMBEDDED_GAME_DATA);
            const isDefaultPreset = source === 'game_data.json' || source === 'game_data.js' || !source;

            if (isDefaultPreset && hasEmbedded) {
                rawData = window.EMBEDDED_GAME_DATA;
            } else {
                try {
                    const resp = await this.fetch(source);
                    if (resp && resp.ok) {
                        rawData = await resp.json();
                    } else if (hasEmbedded) {
                        rawData = window.EMBEDDED_GAME_DATA;
                    } else {
                        const status = resp ? resp.status : 'network error';
                        throw new Error(`Fetch failed: ${status}`);
                    }
                } catch (err) {
                    if (hasEmbedded) {
                        if (typeof console !== 'undefined' && console.error) {
                            console.error('StaticJsonStageAdapter: fetch failed, falling back to window.EMBEDDED_GAME_DATA', err);
                        }
                        rawData = window.EMBEDDED_GAME_DATA;
                    } else {
                        throw err;
                    }
                }
            }
        }

        const textGrid = Array.isArray(rawData.text) ? rawData.text : [];
        const colorGrid = Array.isArray(rawData.colors) ? rawData.colors : [];
        const rows = typeof rawData.rows === 'number' ? rawData.rows : textGrid.length;
        const cols = typeof rawData.cols === 'number' ? rawData.cols : (textGrid[0] ? textGrid[0].length : 0);
        const hairPositions = Array.isArray(rawData.hair) ? rawData.hair : (Array.isArray(rawData.hairPositions) ? rawData.hairPositions : []);
        const totalHairCount = typeof rawData.totalHairCount === 'number'
            ? rawData.totalHairCount
            : (typeof rawData.hairCount === 'number' ? rawData.hairCount : hairPositions.length);

        return {
            rows,
            cols,
            totalHairCount,
            hairPositions,
            textGrid,
            colorGrid
        };
    }
}
