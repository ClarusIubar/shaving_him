import { StageSourcePort } from '../ports/stage-source.port.js';

const STAGE_EXTENSIONS = new Set(['.json', '.js']);

/**
 * Concrete Adapter: StaticJsonStageAdapter
 * Loads pre-rendered game stage JSON (e.g. game_data.json) into standard StageDataDTO format.
 * Includes fallback for file:// protocol CORS restrictions.
 */
export class StaticJsonStageAdapter extends StageSourcePort {
    constructor(fetchFunction = (...args) => globalThis.fetch(...args)) {
        super();
        this.fetch = fetchFunction;
    }

    /**
     * Check if this strategy can handle the given stage source
     * @param {*} source 
     * @returns {boolean}
     */
    canHandle(source) {
        if (!source) return false;
        if (typeof source === 'object' && !Array.isArray(source)) return true;
        if (typeof source !== 'string') return false;
        if (source === 'game_data.json') return true;

        const dotIdx = source.lastIndexOf('.');
        if (dotIdx === -1) return false;
        return STAGE_EXTENSIONS.has(source.slice(dotIdx));
    }

    /**
     * Load stage data from JSON URL, global variable, or object
     * @param {string|Object} source 
     * @param {number} [targetCols]
     * @param {number} [targetRows]
     * @param {Object} [options]
     * @param {Function} [onProgress]
     * @returns {Promise<{ rows: number, cols: number, totalHairCount: number, hairPositions: Array<{r: number, c: number}>, textGrid: string[], colorGrid: Array<Array<[number, number, number]>> }>}
     */
    async loadStage(source = 'game_data.json', targetCols, targetRows, options = {}, onProgress = null) {
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

        let rows = textGrid.length;
        if (typeof rawData.rows === 'number') {
            rows = rawData.rows;
        }

        let cols = 0;
        if (typeof rawData.cols === 'number') {
            cols = rawData.cols;
        } else if (textGrid.length > 0 && textGrid[0]) {
            cols = textGrid[0].length;
        }

        let hairPositions = [];
        if (Array.isArray(rawData.hair)) {
            hairPositions = rawData.hair;
        } else if (Array.isArray(rawData.hairPositions)) {
            hairPositions = rawData.hairPositions;
        }

        let totalHairCount = hairPositions.length;
        if (typeof rawData.totalHairCount === 'number') {
            totalHairCount = rawData.totalHairCount;
        } else if (typeof rawData.hairCount === 'number') {
            totalHairCount = rawData.hairCount;
        }

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
