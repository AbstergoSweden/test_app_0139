// Configurable Security Parameters
const ITERATIONS_NEW = 310000;
const SALT_SIZE_NEW = 64;
const ITERATIONS_LEGACY = 100000;
const SALT_SIZE_LEGACY = 16;

// Derive an AES‑GCM key from a password. Use OWASP‑recommended parameters (≥310 000 iterations
// and a 64‑byte salt) to slow down brute‑force attacks.
export const deriveKey = async (password: string, salt: Uint8Array, iterations: number = ITERATIONS_NEW): Promise<CryptoKey> => {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt,
            iterations,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
};

export const encryptData = async (data: any, password: string): Promise<string> => {
    // Use a 64‑byte salt as per OWASP recommendations.
    const salt = window.crypto.getRandomValues(new Uint8Array(SALT_SIZE_NEW));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt, ITERATIONS_NEW);

    const enc = new TextEncoder();
    const encodedData = enc.encode(JSON.stringify(data));

    const encryptedContent = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encodedData
    );

    // Combine salt + iv + ciphertext for storage
    const buffer = new Uint8Array(salt.byteLength + iv.byteLength + encryptedContent.byteLength);
    buffer.set(salt, 0);
    buffer.set(iv, salt.byteLength);
    buffer.set(new Uint8Array(encryptedContent), salt.byteLength + iv.byteLength);

    // Fix for Maximum call stack size exceeded with large data
    // Process buffer in chunks to avoid stack overflow with String.fromCharCode
    let binary = '';
    const len = buffer.byteLength;
    const CHUNK_SIZE = 4096;

    for (let i = 0; i < len; i += CHUNK_SIZE) {
        const chunk = buffer.subarray(i, Math.min(i + CHUNK_SIZE, len));
        binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
    }

    return btoa(binary);
};

export const decryptData = async (encryptedBase64: string, password: string): Promise<any> => {
    try {
        const binaryString = atob(encryptedBase64);
        const buffer = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            buffer[i] = binaryString.charCodeAt(i);
        }

        // Strategy: Try New Format (64-byte salt) first, fall back to Legacy (16-byte salt)
        try {
            if (buffer.length < SALT_SIZE_NEW + 12) throw new Error("Data too short for new format");

            const salt = buffer.slice(0, SALT_SIZE_NEW);
            const iv = buffer.slice(SALT_SIZE_NEW, SALT_SIZE_NEW + 12);
            const data = buffer.slice(SALT_SIZE_NEW + 12);

            const key = await deriveKey(password, salt, ITERATIONS_NEW);

            const decryptedContent = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv },
                key,
                data
            );

            const dec = new TextDecoder();
            return JSON.parse(dec.decode(decryptedContent));
        } catch (newFormatError) {
            // Fallback: Try Legacy Format
            try {
                // Ensure sufficient length for legacy format
                if (buffer.length < SALT_SIZE_LEGACY + 12) throw newFormatError;

                const salt = buffer.slice(0, SALT_SIZE_LEGACY);
                const iv = buffer.slice(SALT_SIZE_LEGACY, SALT_SIZE_LEGACY + 12);
                const data = buffer.slice(SALT_SIZE_LEGACY + 12);

                const key = await deriveKey(password, salt, ITERATIONS_LEGACY);

                const decryptedContent = await window.crypto.subtle.decrypt(
                    { name: "AES-GCM", iv },
                    key,
                    data
                );

                const dec = new TextDecoder();
                return JSON.parse(dec.decode(decryptedContent));
            } catch {
                // If both fail, throw the original error or a generic one
                throw new Error("Decryption failed. Wrong password or corrupted data.");
            }
        }
    } catch (e) {
        console.error("Decryption failed:", e);
        throw new Error("Decryption failed. Wrong password or corrupted data.");
    }
};