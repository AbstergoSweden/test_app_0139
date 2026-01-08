import { describe, it, expect } from 'vitest';
import { detectDataVersion, migrateUserData, CURRENT_DATA_VERSION } from './migrations';

describe('migrations', () => {
  describe('detectDataVersion', () => {
    it('returns 0 for null/undefined data', () => {
      expect(detectDataVersion(null)).toBe(0);
      expect(detectDataVersion(undefined)).toBe(0);
    });

    it('returns 0 for data missing chats array', () => {
      const oldData = {
        username: 'test',
        settings: {},
        gallery: [],
      };
      expect(detectDataVersion(oldData)).toBe(0);
    });

    it('returns 0 for gallery items missing createdAt', () => {
      const oldData = {
        username: 'test',
        settings: {},
        gallery: [{ id: '1', base64: 'abc', params: { model: 'test', prompt: '' } }],
        chats: [],
      };
      expect(detectDataVersion(oldData)).toBe(0);
    });

    it('returns 1 for properly formatted v1 data', () => {
      const v1Data = {
        username: 'test',
        settings: {},
        gallery: [{ id: '1', base64: 'abc', createdAt: Date.now(), params: { model: 'test' } }],
        chats: [],
      };
      expect(detectDataVersion(v1Data)).toBe(1);
    });

    it('returns explicit version if set', () => {
      const versionedData = {
        username: 'test',
        settings: {},
        gallery: [],
        chats: [],
        __dataVersion: 2,
      };
      expect(detectDataVersion(versionedData)).toBe(2);
    });
  });

  describe('migrateUserData', () => {
    it('does not migrate already current data', () => {
      const currentData = {
        username: 'test',
        settings: { veniceApiKey: 'key' },
        gallery: [{ id: '1', base64: 'abc', createdAt: 12345, params: { model: 'test' } }],
        chats: [],
        __dataVersion: CURRENT_DATA_VERSION,
      };
      
      const result = migrateUserData(currentData);
      expect(result.migrated).toBe(false);
      expect(result.fromVersion).toBe(CURRENT_DATA_VERSION);
    });

    it('migrates v0 data to current version', () => {
      const v0Data = {
        username: 'olduser',
        settings: { veniceApiKey: 'old-key' },
        gallery: [
          { id: 'old-1', base64: 'data123', params: { model: 'flux', prompt: 'test prompt' } },
        ],
        // Missing chats array (v0 characteristic)
      };
      
      const result = migrateUserData(v0Data);
      expect(result.migrated).toBe(true);
      expect(result.fromVersion).toBe(0);
      expect(result.data.username).toBe('olduser');
      expect(result.data.chats).toEqual([]);
      expect(result.data.gallery[0].createdAt).toBeDefined();
      expect(result.data.gallery[0].mediaType).toBe('image');
    });

    it('preserves all original fields during migration', () => {
      const v0Data = {
        username: 'user',
        settings: { geminiApiKey: 'gemini-key' },
        gallery: [
          { 
            id: 'img-1', 
            base64: 'base64data',
            params: { 
              model: 'flux-dev',
              prompt: 'a sunset',
              width: 1024,
              height: 768,
            }
          },
        ],
      };
      
      const result = migrateUserData(v0Data);
      expect(result.data.settings.geminiApiKey).toBe('gemini-key');
      expect(result.data.gallery[0].params.width).toBe(1024);
      expect(result.data.gallery[0].params.height).toBe(768);
      expect(result.data.gallery[0].params.prompt).toBe('a sunset');
    });
  });
});
