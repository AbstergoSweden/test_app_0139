export interface Model {
  id: string;
  name?: string;
}

export interface GenerationParams {
  model: string;
  prompt: string;
  negative_prompt: string;
  width: number;
  height: number;
  steps: number;
  hide_watermark: boolean;
  safe_mode: boolean;
  seed: number;
  style_preset?: string;
  format: string;
  embed_exif_metadata: boolean;
  timestamp?: number;
  enhanced?: boolean;
  enhancementPrompt?: string;
  // New Optional Fields for Gemini/Veo
  provider?: 'venice' | 'gemini';
  mediaType?: 'image' | 'video';
  aspectRatio?: string; // "16:9", "1:1" etc
  geminiConfig?: {
    imageSize?: '1K' | '2K' | '4K';
    videoResolution?: '720p' | '1080p';
    inputImageBase64?: string; // For Image-to-Video or Image-to-Image
  };
}

export interface GalleryItem {
  id: string;
  base64: string; // Base64 of image or video
  params: GenerationParams;
  createdAt: number;
  mediaType?: 'image' | 'video'; // Defaults to image if undefined
}

export interface VeniceResponse {
  images: string[];
}

export interface EnhancementParams {
  image: string; // base64
  scale: number;
  enhance: boolean;
  enhanceCreativity: number;
  enhancePrompt?: string;
}

export interface ChatMessage {
    role: 'user' | 'model' | 'system';
    content: string;
    timestamp: number;
    attachments?: { type: 'image' | 'video'; base64: string; mimeType: string }[];
}

export interface ChatSession {
    id: string;
    name: string;
    model: string;
    messages: ChatMessage[];
    systemPrompt?: string;
    config?: {
        useThinking?: boolean;
        useSearch?: boolean;
        thinkingBudget?: number;
    }
}

export interface AppSettings {
    veniceApiKey?: string;
    geminiApiKey?: string;
    openAiApiKey?: string; // Placeholder for future
    grokApiKey?: string;   // Placeholder for future
}

export interface UserData {
    username: string;
    settings: AppSettings;
    gallery: GalleryItem[];
    chats: ChatSession[];
}

export type AppView = 'auth' | 'image-gen' | 'gallery' | 'chat' | 'settings';