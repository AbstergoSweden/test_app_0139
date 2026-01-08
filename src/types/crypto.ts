/**
 * Types for crypto Web Worker communication.
 */

export type CryptoWorkerRequest = {
    id: string;
    type: 'deriveKey';
    password: string;
    salt: Uint8Array;
    iterations: number;
};

export type CryptoWorkerSuccessResponse = {
    id: string;
    success: true;
    keyData: ArrayBuffer;
};

export type CryptoWorkerErrorResponse = {
    id: string;
    success: false;
    error: string;
};

export type CryptoWorkerResponse = CryptoWorkerSuccessResponse | CryptoWorkerErrorResponse;
