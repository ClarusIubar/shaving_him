/**
 * Concrete Adapter: StaticJsonStageAdapter
 * Loads pre-rendered game stage JSON (e.g. game_data.json) into standard StageDataDTO format.
 * Includes fallback for file:// protocol CORS restrictions.
 */
export class StaticJsonStageAdapter {
    constructor(fetchFunction = globalThis.fetch) {
        this.fetch = fetchFunction;
    }

    /**
     * Load stage data from JSON URL, global variable, or object
     * @param {string|Object} source 
     * @returns {Promise<{ rows: number, cols: number, totalHairCount: number, hairPositions: Array<{r: number, c: number}>, textGrid: string[], colorGrid: Array<Array<[number, number, number]>> }>}
     */
    async loadStage(source = 'game_data.json') {
        let rawData;
        if (typeof source === 'string') {
            try {
                const resp = await this.fetch(source);
                rawData = await resp.json();
            } catch (err) {
                // Handle file:// protocol fetch restriction in browsers
                if (typeof window !== 'undefined' && window.EMBEDDED_GAME_DATA) {
                    rawData = window.EMBEDDED_GAME_DATA;
                } else {
                    throw err;
                }
            }
        } else {
            rawData = source;
        }

        return {
            rows: rawData.rows || (rawData.text ? rawData.text.length : 0),
            cols: rawData.cols || (rawData.text && rawData.text[0] ? rawData.text[0].length : 0),
            totalHairCount: rawData.hair ? rawData.hair.length : 0,
            hairPositions: rawData.hair || [],
            textGrid: rawData.text || [],
            colorGrid: rawData.colors || []
        };
    }
}
