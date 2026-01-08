/**
 * Data migration utilities for handling old data formats.
 * 
 * Migration versioning:
 * - v0 (pre-v1): Original format without version field, may have missing fields
 * - v1: Current format with all required fields properly structured
 */

import type { UserData, GalleryItem, ChatSession, AppSettings } from '../types';

// Current data version
export const CURRENT_DATA_VERSION = 1;

// Version key stored in user data
const VERSION_KEY = '__dataVersion';

interface VersionedUserData extends UserData {
  [VERSION_KEY]?: number;
}

/**
 * Detects the version of user data based on its structure.
 */
export function detectDataVersion(data: unknown): number {
  if (!data || typeof data !== 'object') return 0;
  
  const versioned = data as VersionedUserData;
  
  // If version is explicitly set, use it
  if (typeof versioned[VERSION_KEY] === 'number') {
    return versioned[VERSION_KEY];
  }
  
  // Heuristics for pre-v1 data detection
  const userData = data as Partial<UserData>;
  
  // Check for missing required fields (indicates v0)
  if (!userData.chats || !Array.isArray(userData.chats)) {
    return 0;
  }
  
  // Check for old gallery item format (missing createdAt, mediaType)
  if (userData.gallery && userData.gallery.length > 0) {
    const firstItem = userData.gallery[0];
    if (!firstItem.createdAt || typeof firstItem.createdAt !== 'number') {
      return 0;
    }
  }
  
  // Assume v1 if all checks pass
  return 1;
}

/**
 * Migrates gallery item from v0 to v1 format.
 */
function migrateGalleryItemV0toV1(item: Partial<GalleryItem>, index: number): GalleryItem {
  return {
    id: item.id || `migrated-${Date.now()}-${index}`,
    base64: item.base64 || '',
    createdAt: item.createdAt || Date.now() - (index * 1000), // Preserve order
    mediaType: item.mediaType || 'image',
    params: {
      model: item.params?.model || 'unknown',
      prompt: item.params?.prompt || '',
      negative_prompt: item.params?.negative_prompt || '',
      width: item.params?.width || 512,
      height: item.params?.height || 512,
      steps: item.params?.steps || 30,
      hide_watermark: item.params?.hide_watermark ?? true,
      safe_mode: item.params?.safe_mode ?? false,
      seed: item.params?.seed || 0,
      format: item.params?.format || 'png',
      embed_exif_metadata: item.params?.embed_exif_metadata ?? false,
      ...item.params,
    },
  };
}

/**
 * Migrates chat session from v0 to v1 format.
 */
function migrateChatSessionV0toV1(session: Partial<ChatSession>, index: number): ChatSession {
  return {
    id: session.id || `chat-migrated-${Date.now()}-${index}`,
    name: session.name || `Chat ${index + 1}`,
    model: session.model || 'gemini-2.0-flash',
    messages: (session.messages || []).map((msg, i) => ({
      role: msg?.role || 'user',
      content: msg?.content || '',
      timestamp: msg?.timestamp || Date.now() - (i * 1000),
      attachments: msg?.attachments,
    })),
    systemPrompt: session.systemPrompt,
    config: session.config,
  };
}

/**
 * Migrates settings from v0 to v1 format.
 */
function migrateSettingsV0toV1(settings: Partial<AppSettings>): AppSettings {
  return {
    veniceApiKey: settings?.veniceApiKey,
    geminiApiKey: settings?.geminiApiKey,
    openAiApiKey: settings?.openAiApiKey,
    grokApiKey: settings?.grokApiKey,
  };
}

/**
 * Migrates user data from v0 to v1.
 */
function migrateV0toV1(data: Partial<UserData>): UserData {
  console.log('[Migration] Migrating user data from v0 to v1...');
  
  const migrated: UserData = {
    username: data.username || 'migrated-user',
    settings: migrateSettingsV0toV1(data.settings || {}),
    gallery: (data.gallery || []).map((item, index) => 
      migrateGalleryItemV0toV1(item, index)
    ),
    chats: (data.chats || []).map((session, index) => 
      migrateChatSessionV0toV1(session, index)
    ),
  };
  
  console.log(`[Migration] Completed: ${migrated.gallery.length} gallery items, ${migrated.chats.length} chats`);
  
  return migrated;
}

/**
 * Migrates user data to the latest version.
 * Returns the migrated data and whether migration occurred.
 */
export function migrateUserData(data: unknown): { data: UserData; migrated: boolean; fromVersion: number } {
  const fromVersion = detectDataVersion(data);
  
  if (fromVersion >= CURRENT_DATA_VERSION) {
    // Already at current version
    return { 
      data: data as UserData, 
      migrated: false, 
      fromVersion 
    };
  }
  
  let migrated = data as Partial<UserData>;
  
  // Apply migrations sequentially
  if (fromVersion < 1) {
    migrated = migrateV0toV1(migrated);
  }
  
  // Add more migrations here as needed:
  // if (fromVersion < 2) { migrated = migrateV1toV2(migrated); }
  
  return { 
    data: migrated as UserData, 
    migrated: true, 
    fromVersion 
  };
}

/**
 * Adds version information to user data before saving.
 */
export function stampDataVersion(data: UserData): VersionedUserData {
  return {
    ...data,
    [VERSION_KEY]: CURRENT_DATA_VERSION,
  };
}
