import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock IndexedDB
const mockStore = new Map<string, unknown>();
const mockTransaction = {
    objectStore: vi.fn(() => ({
        put: vi.fn((entry: { id: string }) => {
            mockStore.set(entry.id, entry);
            return { onsuccess: null, onerror: null };
        }),
        get: vi.fn((id: string) => {
            const result = mockStore.get(id);
            return {
                result,
                onsuccess: null as ((event: Event) => void) | null,
                onerror: null as ((event: Event) => void) | null
            };
        }),
        delete: vi.fn((id: string) => {
            mockStore.delete(id);
            return { onsuccess: null, onerror: null };
        }),
        clear: vi.fn(() => {
            mockStore.clear();
            return { onsuccess: null, onerror: null };
        }),
        getAllKeys: vi.fn(() => ({
            result: Array.from(mockStore.keys()),
            onsuccess: null,
            onerror: null,
        })),
    })),
    oncomplete: null as ((event: Event) => void) | null,
    onerror: null as ((event: Event) => void) | null,
};

const mockDb = {
    transaction: vi.fn(() => mockTransaction),
    objectStoreNames: { contains: vi.fn(() => true) },
    createObjectStore: vi.fn(() => ({ createIndex: vi.fn() })),
};

const mockRequest = {
    result: mockDb,
    onsuccess: null as ((event: Event) => void) | null,
    onerror: null as ((event: Event) => void) | null,
    onupgradeneeded: null as ((event: IDBVersionChangeEvent) => void) | null,
};

vi.stubGlobal('indexedDB', {
    open: vi.fn(() => mockRequest),
});

// Import after mocking
import { saveBlob, getBlob, deleteBlob, clearAllBlobs, getAllBlobIds } from './blobStorage';

describe('blobStorage', () => {
    beforeEach(() => {
        mockStore.clear();
        vi.clearAllMocks();
        // Simulate successful DB open
        setTimeout(() => mockRequest.onsuccess?.({} as Event), 0);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('saveBlob', () => {
        it('should save blob data to IndexedDB', async () => {
            // We need to mock the transaction more properly for async behavior
            const putResult = { onsuccess: null as (() => void) | null, onerror: null };
            const store = {
                put: vi.fn(() => {
                    setTimeout(() => putResult.onsuccess?.(), 0);
                    return putResult;
                }),
            };
            mockTransaction.objectStore.mockReturnValue(store as unknown as ReturnType<typeof mockTransaction.objectStore>);

            const savePromise = saveBlob('test-id', 'base64data');

            // Trigger DB open success
            mockRequest.onsuccess?.({} as Event);

            await expect(savePromise).resolves.toBeUndefined();
        });
    });

    describe('getBlob', () => {
        it('should return null for non-existent blob', async () => {
            const getResult = {
                result: undefined,
                onsuccess: null as (() => void) | null,
                onerror: null
            };
            const store = {
                get: vi.fn(() => {
                    setTimeout(() => getResult.onsuccess?.(), 0);
                    return getResult;
                }),
            };
            mockTransaction.objectStore.mockReturnValue(store as unknown as ReturnType<typeof mockTransaction.objectStore>);

            const getPromise = getBlob('non-existent');

            // Trigger DB open success
            mockRequest.onsuccess?.({} as Event);

            await expect(getPromise).resolves.toBeNull();
        });
    });

    describe('deleteBlob', () => {
        it('should delete blob from IndexedDB', async () => {
            const deleteResult = { onsuccess: null as (() => void) | null, onerror: null };
            const store = {
                delete: vi.fn(() => {
                    setTimeout(() => deleteResult.onsuccess?.(), 0);
                    return deleteResult;
                }),
            };
            mockTransaction.objectStore.mockReturnValue(store as unknown as ReturnType<typeof mockTransaction.objectStore>);

            const deletePromise = deleteBlob('test-id');

            // Trigger DB open success
            mockRequest.onsuccess?.({} as Event);

            await expect(deletePromise).resolves.toBeUndefined();
        });
    });

    describe('clearAllBlobs', () => {
        it('should clear all blobs from IndexedDB', async () => {
            const clearResult = { onsuccess: null as (() => void) | null, onerror: null };
            const store = {
                clear: vi.fn(() => {
                    setTimeout(() => clearResult.onsuccess?.(), 0);
                    return clearResult;
                }),
            };
            mockTransaction.objectStore.mockReturnValue(store as unknown as ReturnType<typeof mockTransaction.objectStore>);

            const clearPromise = clearAllBlobs();

            // Trigger DB open success
            mockRequest.onsuccess?.({} as Event);

            await expect(clearPromise).resolves.toBeUndefined();
        });
    });

    describe('getAllBlobIds', () => {
        it('should return all blob IDs', async () => {
            const getAllKeysResult = {
                result: ['id1', 'id2'],
                onsuccess: null as (() => void) | null,
                onerror: null
            };
            const store = {
                getAllKeys: vi.fn(() => {
                    setTimeout(() => getAllKeysResult.onsuccess?.(), 0);
                    return getAllKeysResult;
                }),
            };
            mockTransaction.objectStore.mockReturnValue(store as unknown as ReturnType<typeof mockTransaction.objectStore>);

            const getIdsPromise = getAllBlobIds();

            // Trigger DB open success
            mockRequest.onsuccess?.({} as Event);

            await expect(getIdsPromise).resolves.toEqual(['id1', 'id2']);
        });
    });
});
