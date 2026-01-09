import { CONFIG } from "../constants";
import type { GalleryItem, GenerationParams } from "../types";

// Flattened params update (e.g., { 'params.enhanced': true })
type FlattenedParamsUpdate = {
    [K in keyof GenerationParams as `params.${K & string}`]?: GenerationParams[K];
};

// Type for updates: either direct properties or flattened params notation
type GalleryItemUpdate = Partial<Omit<GalleryItem, 'params'>> & FlattenedParamsUpdate;

// Mock User interface as we are removing firebase/auth dependency
export interface User {
    uid: string;
    isAnonymous: boolean;
}

const STORAGE_KEY = `venice_history_${CONFIG.COLLECTION_NAME}`;

// Internal helper to get history from local storage
const getLocalHistory = (): GalleryItem[] => {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to parse history from local storage", e);
        return [];
    }
};

// Internal helper to save history to local storage
const setLocalHistory = (items: GalleryItem[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    // Dispatch a custom event so subscribers in the same window can update
    window.dispatchEvent(new Event('local_history_updated'));
};

export const signIn = async (): Promise<void> => {
    // Mock successful sign in
    return Promise.resolve();
};

export const subscribeToAuth = (callback: (user: User | null) => void) => {
    // Simulate an authenticated user immediately
    const mockUser: User = { uid: 'local-user', isAnonymous: true };
    // Execute callback asynchronously to mimic real auth behavior slightly
    setTimeout(() => callback(mockUser), 0);
    return () => { };
};

export const saveImageToHistory = async (userId: string, item: Omit<GalleryItem, 'id'>) => {
    const items = getLocalHistory();
    // Generate a pseudo-random ID
    const newItem: GalleryItem = {
        ...item,
        id: Date.now().toString(36) + Math.random().toString(36).substring(2)
    };
    items.push(newItem);
    setLocalHistory(items);
    return newItem;
};

export const updateImageInHistory = async (_userId: string, docId: string, updates: GalleryItemUpdate) => {
    const items = getLocalHistory();
    const index = items.findIndex(i => i.id === docId);
    if (index !== -1) {
        const currentItem = items[index];

        // Handle flattened dot notation updates (e.g., 'params.enhanced')
        // and direct property updates separately
        const newParams = { ...currentItem.params };
        const cleanUpdates: Partial<Omit<GalleryItem, 'params'>> = {};

        for (const key of Object.keys(updates)) {
            if (key.startsWith('params.')) {
                const paramKey = key.slice(7) as keyof GenerationParams; // Remove 'params.' prefix
                const value = updates[key as keyof FlattenedParamsUpdate];
                if (value !== undefined) {
                    // Use type-safe assignment by checking the specific param key
                    Object.assign(newParams, { [paramKey]: value });
                }
            } else {
                // Direct property update (id, base64, createdAt, mediaType)
                const value = updates[key as keyof typeof cleanUpdates];
                if (value !== undefined) {
                    Object.assign(cleanUpdates, { [key]: value });
                }
            }
        }

        items[index] = {
            ...currentItem,
            ...cleanUpdates,
            params: newParams
        };
        setLocalHistory(items);
    }
};

export const clearHistory = async (_userId: string) => {
    setLocalHistory([]);
};

export const subscribeToHistory = (userId: string, callback: (items: GalleryItem[]) => void) => {
    const handleUpdate = () => {
        const items = getLocalHistory();
        // Sort by timestamp desc
        items.sort((a, b) => (b.params.timestamp || 0) - (a.params.timestamp || 0));
        callback(items);
    };

    window.addEventListener('local_history_updated', handleUpdate);
    // Initial load
    handleUpdate();

    return () => {
        window.removeEventListener('local_history_updated', handleUpdate);
    };
};