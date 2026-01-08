/**
 * Compresses a base64 image string.
 * @param {string} base64Src The source base64 string (without data: prefix).
 * @param {number} [quality=0.85] The quality of the resulting JPEG image, between 0 and 1.
 * @returns {Promise<string>} A promise that resolves with the compressed base64 string (without data: prefix).
 */
export async function compressImage(base64Src: string, quality: number = 0.85): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = `data:image/png;base64,${base64Src}`;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error("Could not get 2D context"));
                return;
            }
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            // Convert to JPEG for compression
            const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            // Remove the data URL prefix before returning
            resolve(compressedBase64.split(',')[1]);
        };
        img.onerror = (error) => {
            console.error("Failed to load image for compression.", error);
            reject(new Error("Failed to load image for compression."));
        };
    });
}
