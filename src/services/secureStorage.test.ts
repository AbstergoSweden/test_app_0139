import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { UserData } from '../types';

const mockEncryptData = vi.hoisted(() => vi.fn());

// Mock crypto module
vi.mock('../utils/crypto', () => ({
    encryptData: mockEncryptData,
    decryptData: vi.fn(),
}));

// Import after mock is setup
import { saveUserData, DEV_USER } from './secureStorage';

describe('secureStorage', () => {
    const mockUser: UserData = {
        username: 'testuser',
        settings: {},
        gallery: [],
        chats: [],
    };

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        mockEncryptData.mockResolvedValue('encrypted-data');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('saveUserData', () => {
        it('should not save dev user to localStorage', async () => {
            const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

            await saveUserData(DEV_USER, 'password');

            expect(setItemSpy).not.toHaveBeenCalled();
        });

        it('should save encrypted user data to localStorage', async () => {
            const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

            await saveUserData(mockUser, 'password');

            expect(setItemSpy).toHaveBeenCalledWith('venice_user_data_testuser', 'encrypted-data');
        });

        it('should throw user-friendly error when quota is exceeded', async () => {
            const quotaError = new DOMException('Quota exceeded', 'QuotaExceededError');
            vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
                throw quotaError;
            });

            await expect(saveUserData(mockUser, 'password')).rejects.toThrow(
                'Storage quota exceeded. Please delete some images to free space.'
            );
        });

        it('should re-throw non-quota errors', async () => {
            const genericError = new Error('Generic error');
            vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
                throw genericError;
            });

            await expect(saveUserData(mockUser, 'password')).rejects.toThrow('Generic error');
        });
    });
});
