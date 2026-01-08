import { encryptData, decryptData } from "../utils/crypto";
import { UserData } from "../types";

const USERS_INDEX_KEY = "venice_app_users_index"; // Stores list of usernames
const USER_PREFIX = "venice_user_data_";
const LAST_USER_KEY = "venice_last_user";

export const DEV_USER: UserData = {
    username: "dev",
    settings: {
        veniceApiKey: "dev-mode-enabled",
        geminiApiKey: "dev-mode-enabled"
    },
    gallery: [
        {
            id: "dev-img-1",
            base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
            createdAt: Date.now(),
            params: {
                model: "dev-model",
                prompt: "Developer Mode Test Image",
                negative_prompt: "",
                width: 512,
                height: 512,
                steps: 1,
                hide_watermark: true,
                safe_mode: false,
                seed: 12345,
                format: "png",
                embed_exif_metadata: false
            }
        }
    ],
    chats: [
        {
            id: "dev-chat-1",
            name: "Dev Console",
            model: "dev-mode-v1",
            messages: [
                { role: "system", content: "Developer mode active.", timestamp: Date.now() },
                { role: "model", content: "Welcome to Developer Mode. Authentication bypassed.", timestamp: Date.now() }
            ],
            systemPrompt: "You are a dev tool."
        }
    ]
};

export const getRegisteredUsers = (): string[] => {
    try {
        return JSON.parse(localStorage.getItem(USERS_INDEX_KEY) || "[]");
    } catch {
        return [];
    }
};

export const setLastUser = (username: string) => {
    localStorage.setItem(LAST_USER_KEY, username);
};

export const getLastUser = (): string => {
    return localStorage.getItem(LAST_USER_KEY) || "";
};

export const registerUser = async (username: string, password: string): Promise<UserData> => {
    const users = getRegisteredUsers();
    if (users.length >= 3) {
        throw new Error("Maximum of 3 users allowed.");
    }
    if (users.includes(username)) {
        throw new Error("Username already exists.");
    }

    const initialData: UserData = {
        username,
        settings: {},
        gallery: [],
        chats: []
    };

    const encrypted = await encryptData(initialData, password);
    localStorage.setItem(USER_PREFIX + username, encrypted);

    users.push(username);
    localStorage.setItem(USERS_INDEX_KEY, JSON.stringify(users));

    return initialData;
};

export const loginUser = async (username: string, password: string): Promise<UserData> => {
    const rawData = localStorage.getItem(USER_PREFIX + username);
    if (!rawData) throw new Error("User data not found.");
    return decryptData(rawData, password);
};

export const saveUserData = async (data: UserData, password: string): Promise<void> => {
    // Don't save dev user to local storage to avoid corrupting real data
    if (data.username === 'dev') return;

    const encrypted = await encryptData(data, password);
    try {
        localStorage.setItem(USER_PREFIX + data.username, encrypted);
    } catch (e) {
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
            throw new Error('Storage quota exceeded. Please delete some images to free space.');
        }
        throw e;
    }
};

export const deleteUser = (username: string) => {
    const users = getRegisteredUsers().filter(u => u !== username);
    localStorage.setItem(USERS_INDEX_KEY, JSON.stringify(users));
    localStorage.removeItem(USER_PREFIX + username);
    if (getLastUser() === username) {
        localStorage.removeItem(LAST_USER_KEY);
    }
};