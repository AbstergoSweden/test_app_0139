import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import type { Model, GenerationParams } from '../types';
import { fetchModels, fetchStyles, suggestPromptVenice, enhancePromptVenice } from '../services/veniceService';
import { suggestPrompt as suggestPromptGemini, enhancePrompt as enhancePromptGemini } from '../services/geminiService';
import { CONFIG } from '../constants';
import { Modal } from './Modal';
import { Video, Image as ImageIcon, Sparkles, Upload } from 'lucide-react';
import { compressImage } from '../utils';

interface ControlPanelProps {
    onGenerate: (params: GenerationParams, variants: number) => void;
    onClearHistory: () => void;
    isGenerating: boolean;
    apiKey?: string;
    geminiKey?: string;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ onGenerate, isGenerating, apiKey, geminiKey }) => {
    // --- Global State ---
    const [provider, setProvider] = useState<'venice' | 'gemini'>('venice');
    const [mode, setMode] = useState<'image' | 'video'>('image');

    // --- Form Values ---
    const [models, setModels] = useState<Model[]>([]);
    const [styles, setStyles] = useState<string[]>([]);

    // Venice Specific
    const [selectedModel, setSelectedModel] = useState<string>('default');
    const [selectedStyle, setSelectedStyle] = useState<string>('none');
    const [steps, setSteps] = useState(30);
    const [variants, setVariants] = useState(1);
    const [hideWatermark, _setHideWatermark] = useState(true);
    const [safeMode, _setSafeMode] = useState(false);

    // Gemini Specific
    const [geminiImageSize, setGeminiImageSize] = useState<'1K' | '2K' | '4K'>('1K');
    const [geminiAspectRatio, setGeminiAspectRatio] = useState<string>('1:1');
    const [inputImage, setInputImage] = useState<string | null>(null); // Base64 for Image-to-Video
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Shared
    const [prompt, setPrompt] = useState('');
    // Initialize empty as requested
    const [negativePrompt, setNegativePrompt] = useState(CONFIG.DEFAULT_NEGATIVE_PROMPT);
    const [seed, _setSeed] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState('square'); // Venice simplified

    // AI Helper States
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
    const [suggestionModalOpen, setSuggestionModalOpen] = useState(false);
    const [suggestionIdea, setSuggestionIdea] = useState('');

    useEffect(() => {
        const initData = async () => {
            if (provider === 'venice') {
                const [fetchedModels, fetchedStyles] = await Promise.all([
                    fetchModels('image', apiKey),
                    fetchStyles(apiKey)
                ]);
                setModels(fetchedModels);
                setStyles(fetchedStyles);
                if (fetchedModels.length > 0 && selectedModel === 'default') setSelectedModel(fetchedModels[0].id);
            }
        };
        initData();
    }, [apiKey, provider]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = (reader.result as string).split(',')[1];
                const compressed = await compressImage(base64, 0.7);
                setInputImage(compressed);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleNegPresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === 'none') {
            setNegativePrompt('');
        } else if (val === 'standard') {
            setNegativePrompt(CONFIG.NEGATIVE_PROMPTS.standard);
        } else if (val === 'anime') {
            setNegativePrompt(CONFIG.NEGATIVE_PROMPTS.anime);
        } else if (val === 'realistic') {
            setNegativePrompt(CONFIG.NEGATIVE_PROMPTS.realistic);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // --- Venice Generation ---
        if (provider === 'venice') {
            let width = 1024, height = 1024;
            if (aspectRatio === 'tall') { width = 768; height = 1024; }
            if (aspectRatio === 'wide') { width = 1024; height = 768; }

            const seedVal = seed ? parseInt(seed) : Math.floor(Math.random() * 1000000000);

            const params: GenerationParams = {
                provider: 'venice',
                model: selectedModel,
                prompt,
                negative_prompt: negativePrompt,
                width, height,
                steps,
                hide_watermark: hideWatermark,
                safe_mode: safeMode,
                seed: seedVal,
                style_preset: selectedStyle !== 'none' ? selectedStyle : undefined,
                format: "png",
                embed_exif_metadata: false,
                mediaType: 'image'
            };
            onGenerate(params, variants);
        }

        // --- Gemini Generation ---
        else {
            if (!geminiKey) {
                alert("Please configure your Gemini API Key in Settings.");
                return;
            }

            const params: GenerationParams = {
                provider: 'gemini',
                mediaType: mode, // 'image' or 'video'
                model: mode === 'image' ? 'gemini-3-pro-image-preview' : 'veo-3.1-fast-generate-preview',
                prompt,
                negative_prompt: '', // Gemini doesn't use neg prompt usually in same way
                width: 0, height: 0, steps: 0, // Ignored
                hide_watermark: false,
                safe_mode: false,
                seed: 0,
                format: 'png',
                embed_exif_metadata: false,

                // Specifics
                aspectRatio: geminiAspectRatio,
                geminiConfig: {
                    imageSize: geminiImageSize,
                    videoResolution: '720p',
                    inputImageBase64: inputImage || undefined
                }
            };
            onGenerate(params, 1); // No variants for Gemini/Veo usually
        }
    };

    const handlePromptSuggestion = async () => {
        if (!suggestionIdea.trim()) return;
        setSuggestionModalOpen(false);
        setIsSuggesting(true);
        try {
            let newPrompt = "";
            // Strategy: Use current provider if key exists, else fallback
            if (provider === 'gemini' && geminiKey) {
                newPrompt = await suggestPromptGemini(suggestionIdea, geminiKey);
            } else if (provider === 'venice' && apiKey) {
                newPrompt = await suggestPromptVenice(suggestionIdea, apiKey);
            } else if (geminiKey) {
                // Fallback to Gemini
                newPrompt = await suggestPromptGemini(suggestionIdea, geminiKey);
            } else if (apiKey) {
                // Fallback to Venice
                newPrompt = await suggestPromptVenice(suggestionIdea, apiKey);
            } else {
                throw new Error("No API Key configured for either service.");
            }
            setPrompt(newPrompt);
            setSuggestionIdea('');
        } catch (error: any) {
            alert(`Failed to suggest prompt. ${error.message}`);
        } finally {
            setIsSuggesting(false);
        }
    };

    const handlePromptEnhancement = async () => {
        if (!prompt.trim()) return;
        setIsEnhancingPrompt(true);
        try {
            let enhanced = "";
            if (provider === 'gemini' && geminiKey) {
                enhanced = await enhancePromptGemini(prompt, geminiKey);
            } else if (provider === 'venice' && apiKey) {
                enhanced = await enhancePromptVenice(prompt, apiKey);
            } else if (geminiKey) {
                enhanced = await enhancePromptGemini(prompt, geminiKey);
            } else if (apiKey) {
                enhanced = await enhancePromptVenice(prompt, apiKey);
            } else {
                throw new Error("No API Key configured for either service.");
            }
            setPrompt(enhanced);
        } catch (error: any) {
            alert(`Failed to enhance prompt. ${error.message}`);
        } finally {
            setIsEnhancingPrompt(false);
        }
    };

    return (
        <div className="bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700">
            {/* Header / Tabs */}
            <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                <div className="flex bg-slate-900 rounded-lg p-1">
                    <button
                        onClick={() => setProvider('venice')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${provider === 'venice' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        Venice.ai
                    </button>
                    <button
                        onClick={() => setProvider('gemini')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-2 ${provider === 'gemini' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Sparkles className="w-3 h-3" /> Gemini
                    </button>
                </div>

                {provider === 'gemini' && (
                    <div className="flex bg-slate-900 rounded-lg p-1 ml-4">
                        <button
                            onClick={() => setMode('image')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-2 ${mode === 'image' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
                        >
                            <ImageIcon className="w-3 h-3" /> Image
                        </button>
                        <button
                            onClick={() => setMode('video')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-2 ${mode === 'video' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
                        >
                            <Video className="w-3 h-3" /> Video (Veo)
                        </button>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Prompt Section */}
                <div className="md:col-span-2 lg:col-span-3">
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="prompt" className="block text-sm font-medium text-slate-300">
                            {mode === 'video' ? 'Video Prompt' : 'Prompt'}
                        </label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="suggest"
                                className="text-xs py-1 px-3"
                                onClick={() => setSuggestionModalOpen(true)}
                                isLoading={isSuggesting}
                            >
                                ✨ Idea
                            </Button>
                            <Button
                                type="button"
                                variant="enhance"
                                className="text-xs py-1 px-3"
                                onClick={handlePromptEnhancement}
                                isLoading={isEnhancingPrompt}
                                disabled={!prompt.trim()}
                            >
                                ✨ Enhance
                            </Button>
                        </div>
                    </div>
                    <textarea
                        id="prompt"
                        rows={3}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition placeholder-slate-500 shadow-inner"
                        placeholder={mode === 'video' ? "e.g., A neon hologram of a cat driving at top speed" : "e.g., A futuristic cityscape at dusk..."}
                    ></textarea>
                </div>

                {/* --- VENICE CONTROLS --- */}
                {provider === 'venice' && (
                    <>
                        <div className="md:col-span-2 lg:col-span-3">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-slate-300">Negative Prompt</label>
                                <select
                                    defaultValue="none"
                                    onChange={handleNegPresetChange}
                                    className="bg-slate-700 text-xs text-slate-300 rounded-lg px-2 py-1 border border-slate-600 focus:ring-1 focus:ring-orange-500 outline-none hover:border-slate-500 transition"
                                >
                                    <option value="none">Empty / Custom</option>
                                    <option value="standard">Universal</option>
                                    <option value="anime">Anime</option>
                                    <option value="realistic">Photo Realism</option>
                                </select>
                            </div>
                            <textarea
                                rows={2}
                                value={negativePrompt}
                                onChange={(e) => setNegativePrompt(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white text-sm focus:ring-1 focus:ring-orange-500/50"
                                placeholder="Select a preset or type custom exclusions..."
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Model</label>
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-orange-500"
                            >
                                {models.map(m => <option key={m.id} value={m.id}>{m.name || m.id}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Style</label>
                            <select
                                value={selectedStyle}
                                onChange={(e) => setSelectedStyle(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-orange-500"
                            >
                                <option value="none">None</option>
                                {styles.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Aspect Ratio</label>
                            <select
                                value={aspectRatio}
                                onChange={(e) => setAspectRatio(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-orange-500"
                            >
                                <option value="tall">Tall (768x1024)</option>
                                <option value="wide">Wide (1024x768)</option>
                                <option value="square">Square (1024x1024)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Steps: {steps}</label>
                            <input
                                type="range"
                                min="1" max="50"
                                value={steps}
                                onChange={(e) => setSteps(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg cursor-pointer accent-orange-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Variants: {variants}</label>
                            <input
                                type="range"
                                min="1" max="4"
                                value={variants}
                                onChange={(e) => setVariants(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg cursor-pointer accent-orange-500"
                            />
                        </div>
                    </>
                )}

                {/* --- GEMINI CONTROLS --- */}
                {provider === 'gemini' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Aspect Ratio</label>
                            <select
                                value={geminiAspectRatio}
                                onChange={(e) => setGeminiAspectRatio(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-orange-500"
                            >
                                <option value="1:1">1:1 (Square)</option>
                                <option value="16:9">16:9 (Landscape)</option>
                                <option value="9:16">9:16 (Portrait)</option>
                                <option value="4:3">4:3</option>
                                <option value="3:4">3:4</option>
                                {mode === 'image' && <option value="21:9">21:9 (Ultrawide)</option>}
                            </select>
                        </div>

                        {mode === 'image' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Size (Quality)</label>
                                <select
                                    value={geminiImageSize}
                                    onChange={(e) => setGeminiImageSize(e.target.value as any)}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-orange-500"
                                >
                                    <option value="1K">1K (Standard)</option>
                                    <option value="2K">2K (High)</option>
                                    <option value="4K">4K (Ultra)</option>
                                </select>
                            </div>
                        )}

                        {mode === 'video' && (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-300 mb-2">Input Image (Optional)</label>
                                <div className="flex gap-4 items-center">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg border border-slate-600 flex items-center gap-2 text-sm text-slate-300"
                                    >
                                        <Upload className="w-4 h-4" /> Upload Image
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                    />
                                    {inputImage && (
                                        <div className="flex items-center gap-2 bg-green-900/30 px-3 py-1 rounded-full border border-green-500/50">
                                            <span className="text-xs text-green-300">Image Attached</span>
                                            <button
                                                type="button"
                                                onClick={() => setInputImage(null)}
                                                className="text-green-300 hover:text-white"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mt-2">Upload an image to animate it with Veo.</p>
                            </div>
                        )}
                    </>
                )}

                {/* Shared Submit Action */}
                <div className="md:col-span-2 lg:col-span-3 mt-4">
                    <Button type="submit" variant="primary" className="w-full py-3 text-lg" isLoading={isGenerating}>
                        {mode === 'video' && provider === 'gemini' ? 'Generate Video (Veo)' : 'Generate'}
                    </Button>
                </div>
            </form>

            {/* Suggestion Modal */}
            <Modal
                isOpen={suggestionModalOpen}
                onClose={() => setSuggestionModalOpen(false)}
                title="✨ Get a Prompt Idea"
            >
                <div className="space-y-4">
                    <p className="text-slate-300">Enter a simple idea or keyword, and the AI will expand it into a full, artistic prompt.</p>
                    <input
                        type="text"
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-500 transition"
                        placeholder="e.g., a majestic dragon"
                        value={suggestionIdea}
                        onChange={(e) => setSuggestionIdea(e.target.value)}
                        autoFocus
                    />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setSuggestionModalOpen(false)}>Cancel</Button>
                        <Button variant="suggest" onClick={handlePromptSuggestion}>Generate Idea</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};