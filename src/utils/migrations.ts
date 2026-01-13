import type { UserData, GalleryItem, ChatSession, AppSettings } from '../types';

export const CURRENT_DATA_VERSION = 1;

const VERSION_KEY = '__dataVersion';

interface VersionedUserData extends UserData {
  [VERSION_KEY]?: number;
}

export function detectDataVersion(data: unknown): number {
  if (!data || typeof data !== 'object') return 0;
  
  const versioned = data as VersionedUserData;
  
  if (typeof versioned[VERSION_KEY] === 'number') {
    return versioned[VERSION_KEY];
  }
  
  const userData = data as Partial<UserData>;
  
  if (!userData.chats || !Array.isArray(userData.chats)) {
    return 0;
  }
  
  if (userData.gallery && userData.gallery.length > 0) {
    const firstItem = userData.gallery[0];
    if (!firstItem.createdAt || typeof firstItem.createdAt !== 'number') {
      return 0;
    }
  }
  
  return 1;
}

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

function migrateSettingsV0toV1(settings: Partial<AppSettings>): AppSettings {
  return {
    veniceApiKey: settings?.veniceApiKey,
    geminiApiKey: settings?.geminiApiKey,
    openAiApiKey: settings?.openAiApiKey,
    grokApiKey: settings?.grokApiKey,
  };
}

function migrateV0toV1(data: Partial<UserData>): UserData {
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
  
  return migrated;
}

export function migrateUserData(data: unknown): { data: UserData; migrated: boolean; fromVersion: number } {
  const fromVersion = detectDataVersion(data);
  
  if (fromVersion >= CURRENT_DATA_VERSION) {
    return { 
      data: data as UserData, 
      migrated: false, 
      fromVersion 
    };
  }
  
  let migrated = data as Partial<UserData>;
  
  if (fromVersion < 1) {
    migrated = migrateV0toV1(migrated);
  }
  
  return { 
    data: migrated as UserData, 
    migrated: true, 
    fromVersion 
  };
}

export function stampDataVersion(data: UserData): VersionedUserData {
  return {
    ...data,
    [VERSION_KEY]: CURRENT_DATA_VERSION,
  };
}
