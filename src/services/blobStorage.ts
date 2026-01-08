/**
 * IndexedDB-based blob storage for gallery images and videos.
 * Moves large base64 data out of localStorage to avoid quota limits.
 */

const DB_NAME = 'venice_blob_store';
const DB_VERSION = 1;
const STORE_NAME = 'blobs';

interface BlobEntry {
    id: string;
    data: string; // base64 encoded
    createdAt: number;
}

let dbInstance: IDBDatabase | null = null;

/**
 * Opens the IndexedDB database, creating the object store if needed.
 */
const openDB = (): Promise<IDBDatabase> => {
    if (dbInstance) return Promise.resolve(dbInstance);

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('createdAt', 'createdAt');
            }
        };

        request.onsuccess = () => {
            dbInstance = request.result;
            resolve(dbInstance);
        };

        request.onerror = () => {
            reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`));
        };
    });
};

/**
 * Saves a blob to IndexedDB.
 */
export const saveBlob = async (id: string, data: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const entry: BlobEntry = {
            id,
            data,
            createdAt: Date.now(),
        };

        const request = store.put(entry);

        request.onsuccess = () => resolve();
        request.onerror = () => {
            const error = request.error;
            // Check for quota exceeded
            if (error?.name === 'QuotaExceededError') {
                reject(new Error('IndexedDB quota exceeded. Please delete some media to free space.'));
            } else {
                reject(new Error(`Failed to save blob: ${error?.message}`));
            }
        };
    });
};

/**
 * Retrieves a blob from IndexedDB.
 */
export const getBlob = async (id: string): Promise<string | null> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
            const entry = request.result as BlobEntry | undefined;
            resolve(entry?.data ?? null);
        };

        request.onerror = () => {
            reject(new Error(`Failed to get blob: ${request.error?.message}`));
        };
    });
};

/**
 * Deletes a blob from IndexedDB.
 */
export const deleteBlob = async (id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => {
            reject(new Error(`Failed to delete blob: ${request.error?.message}`));
        };
    });
};

/**
 * Retrieves multiple blobs by their IDs.
 */
export const getBlobs = async (ids: string[]): Promise<Map<string, string>> => {
    const db = await openDB();
    const results = new Map<string, string>();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);

        let completed = 0;

        if (ids.length === 0) {
            resolve(results);
            return;
        }

        ids.forEach(id => {
            const request = store.get(id);
            request.onsuccess = () => {
                const entry = request.result as BlobEntry | undefined;
                if (entry?.data) {
                    results.set(id, entry.data);
                }
                completed++;
                if (completed === ids.length) {
                    resolve(results);
                }
            };
            request.onerror = () => {
                completed++;
                if (completed === ids.length) {
                    resolve(results);
                }
            };
        });

        transaction.onerror = () => {
            reject(new Error(`Failed to get blobs: ${transaction.error?.message}`));
        };
    });
};

/**
 * Deletes multiple blobs by their IDs.
 */
export const deleteBlobs = async (ids: string[]): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        ids.forEach(id => {
            store.delete(id);
        });

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => {
            reject(new Error(`Failed to delete blobs: ${transaction.error?.message}`));
        };
    });
};

/**
 * Clears all blobs from IndexedDB (useful for testing/reset).
 */
export const clearAllBlobs = async (): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => {
            reject(new Error(`Failed to clear blobs: ${request.error?.message}`));
        };
    });
};

/**
 * Gets all stored blob IDs (useful for cleanup/migration).
 */
export const getAllBlobIds = async (): Promise<string[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAllKeys();

        request.onsuccess = () => {
            resolve(request.result as string[]);
        };

        request.onerror = () => {
            reject(new Error(`Failed to get blob IDs: ${request.error?.message}`));
        };
    });
};
