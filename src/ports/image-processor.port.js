/**
 * Abstract Port Interface: ImageProcessorPort
 * Defines contract for in-browser skin base extraction and hair mask generation.
 */
export class ImageProcessorPort {
    /**
     * @param {Object} imageSource - Image or Canvas source
     * @returns {Promise<{ skinBaseBitmap: Object, hairMask: Uint8Array, width: number, height: number }>}
     */
    async extractSkinAndHairMask(imageSource) {
        throw new Error('ImageProcessorPort method not implemented');
    }
}
