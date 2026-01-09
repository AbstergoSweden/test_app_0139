import { GoogleGenAI } from "@google/genai";
import type { Part, GroundingChunk, GenerateContentConfig, GenerateVideosConfig } from "@google/genai";
import { SYSTEM_PROMPT_GEMINI } from "../constants";
import type { GenerationParams, ChatMessage } from "../types";

// Type for attachment in ChatMessage
interface ChatAttachment {
    type: 'image' | 'video';
    base64: string;
    mimeType: string;
}

let ai: GoogleGenAI | null = null;
let currentKey: string | null = null;

const getAI = (apiKey?: string) => {
    const keyToUse = apiKey || process.env.API_KEY;
    if (!keyToUse) return null;

    if (!ai || currentKey !== keyToUse) {
        ai = new GoogleGenAI({ apiKey: keyToUse });
        currentKey = keyToUse;
    }
    return ai;
};

// --- Helper Utilities ---
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

// --- Prompt Suggestion (Fast) ---
export const suggestPrompt = async (idea: string, apiKey?: string): Promise<string> => {
    const client = getAI(apiKey);
    if (!client) throw new Error("Gemini API Key is missing");

    try {
        // Use Flash-Lite for low latency as requested
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: `Expand this short idea into a detailed, artistic image generation prompt: "${idea}". Keep it under 150 words.`,
        });
        return response.text || "";
    } catch (error) {
        console.error("Gemini Suggestion Error:", error);
        throw error;
    }
};

export const enhancePrompt = async (currentPrompt: string, apiKey?: string): Promise<string> => {
    const client = getAI(apiKey);
    if (!client) throw new Error("Gemini API Key is missing");

    try {
        const response = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: currentPrompt,
            config: {
                systemInstruction: SYSTEM_PROMPT_GEMINI,
                temperature: 1.0,
            },
        });

        let text = response.text || "";
        text = text.replace(/^\/imagine prompt:\s*/, '');
        return text;
    } catch (error) {
        console.error("Gemini Enhancement Error:", error);
        throw error;
    }
};

// --- Gemini Image Generation ---
export const generateGeminiImage = async (params: GenerationParams, apiKey: string): Promise<string> => {
    const client = getAI(apiKey);
    if (!client) throw new Error("Gemini API Key is missing");

    // "gemini-3-pro-image-preview" for high quality, supports size
    // "gemini-2.5-flash-image" for standard
    const model = params.geminiConfig?.imageSize ? "gemini-3-pro-image-preview" : "gemini-2.5-flash-image";

    const config: GenerateContentConfig = {
        imageConfig: {
            aspectRatio: params.aspectRatio || "1:1",
        }
    };

    // Only Pro model supports imageSize
    if (params.geminiConfig?.imageSize && model === "gemini-3-pro-image-preview") {
        config.imageConfig = {
            ...config.imageConfig,
            imageSize: params.geminiConfig.imageSize
        };
    }

    const response = await client.models.generateContent({
        model: model,
        contents: {
            parts: [{ text: params.prompt }]
        },
        config: config
    });

    // Extract image
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return part.inlineData.data;
            }
        }
    }
    throw new Error("No image data found in Gemini response");
};

// --- Veo Video Generation ---
export const generateGeminiVideo = async (
    params: GenerationParams,
    apiKey: string,
    onStatusUpdate?: (status: string) => void
): Promise<string> => {
    const client = getAI(apiKey);
    if (!client) throw new Error("Gemini API Key is missing");

    const model = "veo-3.1-fast-generate-preview";

    // Setup polling config
    const pollingInterval = 5000;

    onStatusUpdate?.("Submitting video generation request...");

    // Build Request
    const generateOptions: GenerateVideosConfig = {
        model: model,
        prompt: params.prompt,
        config: {
            numberOfVideos: 1,
            resolution: params.geminiConfig?.videoResolution || '720p', // fast-generate usually supports 720p or 1080p
            aspectRatio: params.aspectRatio || '16:9'
        }
    };

    // Add Image input if present (Image-to-Video)
    if (params.geminiConfig?.inputImageBase64) {
        generateOptions.image = {
            imageBytes: params.geminiConfig.inputImageBase64,
            mimeType: 'image/jpeg' // Assuming JPEG for simplicity, Veo supports PNG too
        };
    }

    let operation = await client.models.generateVideos(generateOptions);

    onStatusUpdate?.("Processing video... this may take a minute.");

    // Polling Loop
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, pollingInterval));
        operation = await client.operations.getVideosOperation({ operation: operation });
        onStatusUpdate?.("Still processing...");
    }

    if (operation.error) {
        throw new Error(`Video generation failed: ${operation.error.message}`);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("No video URI returned.");
    }

    onStatusUpdate?.("Downloading video...");

    // Fetch the video bytes
    const videoResponse = await fetch(`${downloadLink}&key=${apiKey}`);
    if (!videoResponse.ok) throw new Error("Failed to download generated video.");

    const videoBlob = await videoResponse.blob();
    return await blobToBase64(videoBlob);
};

// --- Enhanced Chat (Multimodal + Thinking + Search) ---
export const generateGeminiChat = async (
    messages: ChatMessage[],
    apiKey: string,
    systemPrompt?: string,
    config?: { useThinking?: boolean; useSearch?: boolean; thinkingBudget?: number }
): Promise<string> => {
    const client = getAI(apiKey);
    if (!client) throw new Error("Gemini API Key is missing");

    // Determine Model
    let model = "gemini-3-flash-preview"; // Default
    if (config?.useThinking) {
        model = "gemini-3-pro-preview";
    } else if (config?.useSearch) {
        model = "gemini-3-flash-preview";
    } else {
        // Check if any message has attachments (Multimodal) -> Use Pro or Flash
        const hasAttachments = messages.some(m => m.attachments && m.attachments.length > 0);
        if (hasAttachments) {
            model = "gemini-3-pro-preview"; // Vision/Video understanding
        }
    }

    // Prepare Config
    const genConfig: GenerateContentConfig = {
        systemInstruction: systemPrompt
    };

    if (config?.useThinking) {
        genConfig.thinkingConfig = { thinkingBudget: config.thinkingBudget || 32768 };
        // Do NOT set maxOutputTokens when using thinking budget as per instructions
    }

    if (config?.useSearch) {
        genConfig.tools = [{ googleSearch: {} }];
    }

    // Prepare Contents
    // We need to convert the chat history into Gemini format, including attachments
    const history = messages.map(msg => {
        const parts: Part[] = [];

        // Add text part
        if (msg.content) {
            parts.push({ text: msg.content });
        }

        // Add attachments
        if (msg.attachments) {
            msg.attachments.forEach((att: ChatAttachment) => {
                parts.push({
                    inlineData: {
                        mimeType: att.mimeType,
                        data: att.base64
                    }
                });
            });
        }

        return {
            role: msg.role === 'model' ? 'model' : 'user',
            parts: parts
        };
    });

    const response = await client.models.generateContent({
        model: model,
        contents: history,
        config: genConfig
    });

    let text = response.text || "";

    // Append Search Grounding Metadata if present
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks && chunks.length > 0) {
        const links = chunks
            .filter((c: GroundingChunk) => c.web?.uri)
            .map((c: GroundingChunk) => `[${c.web?.title ?? 'Source'}](${c.web?.uri})`)
            .join('\n');

        if (links) {
            text += `\n\n**Sources:**\n${links}`;
        }
    }

    return text;
};