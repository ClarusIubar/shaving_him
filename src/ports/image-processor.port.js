/**
 * Abstract Port Interface: ImageProcessorPort
 * Defines contract for in-browser skin base extraction and hair mask generation.
 */
export class ImageProcessorPort {
    /**
     * @param {File|HTMLImageElement} source 
     * @param {number} targetWidth 
     * @param {number} targetHeight 
     * @returns {Promise<{ imageData: Object, colors: Array<Array<[number, number, number]>> }>}
     */
    async processImageSource(source, targetWidth = 280, targetHeight = 219) {
        throw new Error('ImageProcessorPort processImageSource method not implemented');
    }
}
