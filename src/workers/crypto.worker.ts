/**
 * Web Worker for PBKDF2 key derivation.
 * Offloads expensive crypto operations from the main thread.
 */
import type { CryptoWorkerRequest, CryptoWorkerResponse } from '../types/crypto';

const textEncoder = new TextEncoder();

self.onmessage = async (e: MessageEvent<CryptoWorkerRequest>) => {
    const { id, type, password, salt, iterations } = e.data;

    if (type !== 'deriveKey') {
        self.postMessage({ id, success: false, error: 'Unknown request type' } as CryptoWorkerResponse);
        return;
    }

    try {
        // Import the password as key material
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            textEncoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );

        // Derive the AES-GCM key
        const derivedKey = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations,
                hash: 'SHA-256',
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            true, // extractable so we can export it
            ['encrypt', 'decrypt']
        );

        // Export the key as raw bytes to send back to main thread
        const keyData = await crypto.subtle.exportKey('raw', derivedKey);

        self.postMessage({ id, success: true, keyData } as CryptoWorkerResponse, { transfer: [keyData] });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        self.postMessage({ id, success: false, error: errorMessage } as CryptoWorkerResponse);
    }
};
