/**
 * Adapter Helper: ImageFileLoader
 * Handles FileReader and HTMLImageElement decoding lifecycle.
 * Encapsulates asynchronous image file parsing and error handling.
 */

export class ImageFileLoader {
    /**
     * Decode a File into an HTMLImageElement
     * @param {File|Blob} file 
     * @returns {Promise<HTMLImageElement|Object>}
     */
    static load(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                return reject(new Error('파일이 지정되지 않았습니다.'));
            }
            if (typeof FileReader === 'undefined') {
                return reject(new Error('FileReader API가 지원되지 않는 환경입니다.'));
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                if (typeof Image === 'undefined') {
                    return resolve({});
                }
                const img = new Image();
                img.onload = () => {
                    if (img.naturalWidth === 0 || img.naturalHeight === 0) {
                        reject(new Error('이미지 크기가 0px이거나 손상된 파일입니다.'));
                    } else {
                        resolve(img);
                    }
                };
                img.onerror = () => reject(new Error('유효하지 않거나 손상된 이미지 파일입니다.'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('파일 읽기 과정에서 오류가 발생했습니다.'));
            reader.readAsDataURL(file);
        });
    }
}
