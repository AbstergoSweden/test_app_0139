import { CONFIG } from '../constants';
import type { Model, GenerationParams, VeniceResponse, EnhancementParams, ChatMessage } from '../types';

const MOCK_IMAGE = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

// Types for Venice API responses
interface VeniceModelItem {
    id: string;
    name?: string;
}

interface VeniceStyleItem {
    id: string;
}

interface VeniceChatResponse {
    choices: { message: { content: string } }[];
}

// Type for API request payloads
interface VeniceImageGeneratePayload {
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
}

export const fetchModels = async (type: 'image' | 'text' = 'image', apiKey?: string): Promise<Model[]> => {
    // Dev Mode Mock
    if (apiKey === 'dev-mode-enabled') {
        if (type === 'text') {
            return [
                { id: 'venice-uncensored', name: 'Venice Uncensored (Dev)' },
                { id: 'llama-3-70b', name: 'Llama 3 70B (Dev)' }
            ];
        }
        return [
            { id: 'stable-diffusion-xl', name: 'SDXL (Dev)' },
            { id: 'fluently-xl', name: 'Fluently XL (Dev)' }
        ];
    }

    const keyToUse = apiKey || (CONFIG.API_KEYS.length > 0 ? CONFIG.API_KEYS[0] : null);
    
    try {
        if (!keyToUse) {
            // If no key is available, return empty list gracefully or mock if desired.
            // Returning empty list allows UI to just show empty dropdowns or show error when generating.
            return [];
        }

        const headers: Record<string, string> = {};
        if (keyToUse) {
            headers['Authorization'] = `Bearer ${keyToUse}`;
        }

        const response = await fetch(`${CONFIG.BASE_API_URL}/models?type=${type}`, { headers });
        if (!response.ok) throw new Error(`Failed to fetch ${type} models`);
        const data = await response.json();
        return data.data.map((item: VeniceModelItem | string) => ({
            id: typeof item === 'object' ? item.id : item,
            name: typeof item === 'object' ? item.name || item.id : item
        }));
    } catch (error) {
        console.error(error);
        // Fallback for UI if fetch fails
        return [];
    }
};

export const fetchStyles = async (apiKey?: string): Promise<string[]> => {
    if (apiKey === 'dev-mode-enabled') {
        return ['3d-model', 'analog-film', 'anime', 'cinematic'];
    }

    const keyToUse = apiKey || (CONFIG.API_KEYS.length > 0 ? CONFIG.API_KEYS[0] : null);

    try {
        if (!keyToUse) return [];

        const headers: Record<string, string> = {};
        if (keyToUse) {
            headers['Authorization'] = `Bearer ${keyToUse}`;
        }

        const response = await fetch(`${CONFIG.BASE_API_URL}/image/styles`, { headers });
        if (!response.ok) throw new Error("Failed to fetch styles");
        const data = await response.json();
        return data.data.map((item: VeniceStyleItem | string) => (typeof item === 'object' ? item.id : item));
    } catch (error) {
        console.error(error);
        return [];
    }
};

const attemptApiCall = async (url: string, data: Record<string, unknown>, keyIndex = 0, isBinaryResponse = false, retries = 0, overrideKey?: string): Promise<VeniceResponse | VeniceChatResponse | Response> => {
    let apiKey = overrideKey;
    if (!apiKey) {
        if (CONFIG.API_KEYS.length === 0) throw new Error("No Venice API Key configured. Please add your API Key in Settings.");
        if (keyIndex >= CONFIG.API_KEYS.length) throw new Error("All default API keys failed.");
        apiKey = CONFIG.API_KEYS[keyIndex];
    }

    // Dev Mode Interception
    if (apiKey === 'dev-mode-enabled') {
        await new Promise(r => setTimeout(r, 1500)); // Simulate latency
        
        if (url.includes('/image/generate')) {
            return { images: [MOCK_IMAGE] };
        }
        if (url.includes('/chat/completions')) {
            return { 
                choices: [{ 
                    message: { 
                        content: "This is a simulated response from Dev Mode. Authentication was bypassed." 
                    } 
                }] 
            };
        }
        if (url.includes('/image/upscale')) {
            // Mock binary response for upscale
            const res = await fetch(`data:image/png;base64,${MOCK_IMAGE}`);
            return res;
        }
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            if (response.status === 401) throw new Error("Unauthorized: Invalid or missing API Key.");
            if (response.status === 429) {
                if (retries < 3) {
                    const delay = Math.pow(2, retries) * 1000;
                    await new Promise(res => setTimeout(res, delay));
                    return attemptApiCall(url, data, keyIndex, isBinaryResponse, retries + 1, overrideKey);
                }
                throw new Error("Rate limit exceeded. Please wait a moment.");
            }

            if (!overrideKey && keyIndex + 1 < CONFIG.API_KEYS.length) {
                return attemptApiCall(url, data, keyIndex + 1, isBinaryResponse);
            }
            
            const errorData = await response.json().catch(() => ({}));
            // Provide more detail on errors if available (e.g. "Invalid parameter")
            const errorMsg = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
            throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
        }
        return isBinaryResponse ? response : response.json();
    } catch (error: unknown) {
        if (!overrideKey && keyIndex + 1 < CONFIG.API_KEYS.length) {
             return attemptApiCall(url, data, keyIndex + 1, isBinaryResponse);
        }
        throw error;
    }
};

export const generateImage = async (params: GenerationParams, apiKey?: string): Promise<VeniceResponse> => {
    // Sanitize parameters to only include what Venice API expects.
    // Explicitly mapping fields prevents sending internal state like 'provider', 'mediaType', 'geminiConfig'.
    const payload: VeniceImageGeneratePayload = {
        model: params.model,
        prompt: params.prompt,
        negative_prompt: params.negative_prompt,
        width: params.width,
        height: params.height,
        steps: params.steps,
        hide_watermark: params.hide_watermark,
        safe_mode: params.safe_mode,
        seed: params.seed,
    };

    if (params.style_preset) {
        payload.style_preset = params.style_preset;
    }

    return attemptApiCall(`${CONFIG.BASE_API_URL}/image/generate`, payload as unknown as Record<string, unknown>, 0, false, 0, apiKey) as Promise<VeniceResponse>;
};

export const generateChatResponse = async (messages: ChatMessage[], model: string, apiKey: string, systemPrompt?: string): Promise<string> => {
    const payload = {
        model,
        messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            ...messages.map(m => ({ role: m.role === 'model' ? 'assistant' : m.role, content: m.content }))
        ]
    };
    const result = await attemptApiCall(`${CONFIG.BASE_API_URL}/chat/completions`, payload as unknown as Record<string, unknown>, 0, false, 0, apiKey) as VeniceChatResponse;
    return result.choices[0].message.content;
};

export const upscaleImage = async (params: EnhancementParams, apiKey?: string): Promise<Blob> => {
    // attemptApiCall returns the raw Response object when isBinaryResponse is true
    const response = await attemptApiCall(`${CONFIG.BASE_API_URL}/image/upscale`, params as unknown as Record<string, unknown>, 0, true, 0, apiKey) as Response;
    return response.blob();
};

export const suggestPromptVenice = async (idea: string, apiKey: string): Promise<string> => {
    const prompt = `Create a detailed, creative image generation prompt based on this idea: "${idea}". The prompt should be descriptive and ready for an AI image generator. Output ONLY the prompt text, no conversational filler.`;
    return await generateChatResponse([{ role: 'user', content: prompt }], "llama-3.3-70b", apiKey);
};

export const enhancePromptVenice = async (currentPrompt: string, apiKey: string): Promise<string> => {
    const systemPrompt = "You are an expert prompt engineer. Your task is to enhance the user's prompt by adding artistic details, lighting, mood, and style keywords to improve image generation quality. Maintain the original intent. Output ONLY the enhanced prompt.";
    return await generateChatResponse([{ role: 'user', content: currentPrompt }], "llama-3.3-70b", apiKey, systemPrompt);
};