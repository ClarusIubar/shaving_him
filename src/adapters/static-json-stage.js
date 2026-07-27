/**
 * Concrete Adapter: StaticJsonStageAdapter
 * Loads pre-rendered game stage JSON (e.g. game_data.json) into standard StageDataDTO format.
 */
export class StaticJsonStageAdapter {
    constructor(fetchFunction = globalThis.fetch) {
        this.fetch = fetchFunction;
    }

    /**
     * Load stage data from JSON URL or object
     * @param {string|Object} source 
     * @returns {Promise<{ rows: number, cols: number, totalHairCount: number, hairPositions: Array<{r: number, c: number}>, textGrid: string[], colorGrid: Array<Array<[number, number, number]>> }>}
     */
    async loadStage(source = 'game_data.json') {
        let rawData;
        if (typeof source === 'string') {
            const resp = await this.fetch(source);
            rawData = await resp.json();
        } else {
            rawData = source;
        }

        return {
            rows: rawData.rows || rawData.text.length,
            cols: rawData.cols || (rawData.text[0] ? rawData.text[0].length : 0),
            totalHairCount: rawData.hair ? rawData.hair.length : 0,
            hairPositions: rawData.hair || [],
            textGrid: rawData.text || [],
            colorGrid: rawData.colors || []
        };
    }
}
