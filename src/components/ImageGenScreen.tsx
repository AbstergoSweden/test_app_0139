import React, { useState } from 'react';
import { ControlPanel } from './ControlPanel';
import { GalleryItem, GenerationParams, AppSettings } from '../types';
import { generateImage } from '../services/veniceService';
import { generateGeminiImage, generateGeminiVideo } from '../services/geminiService';
import { compressImage } from '../utils';
import { Gallery } from './Gallery';

import { ToastType } from './Toast';
import { ProgressBar } from './ProgressBar';

interface ImageGenScreenProps {
    settings: AppSettings;
    recentItems: GalleryItem[];
    onNewItem: (item: GalleryItem) => void;
    onUpdateItem: (item: GalleryItem) => void;
    onViewItem: (item: GalleryItem) => void;
    onAddToast: (message: string, type: ToastType) => void;
}

export const ImageGenScreen: React.FC<ImageGenScreenProps> = ({ settings, recentItems, onNewItem, onViewItem, onAddToast }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [progress, setProgress] = useState(0);

    const handleGenerate = async (params: GenerationParams, variants: number) => {
        setIsGenerating(true);
        setStatusMessage("Initializing generation...");
        setProgress(0);

        try {
            // --- GEMINI HANDLER ---
            if (params.provider === 'gemini') {
                if (!settings.geminiApiKey) throw new Error("Gemini API Key missing.");

                const newItemId = Date.now() + Math.random().toString(36);
                let base64Result = "";

                if (params.mediaType === 'video') {
                    // Video Generation (Veo)
                    setStatusMessage("Submitting to Veo... (This takes a moment)");
                    setProgress(10);
                    base64Result = await generateGeminiVideo(params, settings.geminiApiKey, (status) => {
                        setStatusMessage(status);
                        setProgress(prev => Math.min(prev + 5, 90));
                    });
                } else {
                    // Image Generation
                    setStatusMessage("Generating with Gemini...");
                    setProgress(30);
                    base64Result = await generateGeminiImage(params, settings.geminiApiKey);
                }

                const newItem: GalleryItem = {
                    id: newItemId,
                    base64: base64Result,
                    params: params,
                    createdAt: Date.now(),
                    mediaType: params.mediaType
                };
                onNewItem(newItem);
                onAddToast("Generated successfully!", 'success');
            }
            // --- VENICE HANDLER ---
            else {
                const baseSeed = params.seed;
                let completedCount = 0;

                for (let i = 0; i < variants; i++) {
                    const percentStart = Math.round((i / variants) * 100);
                    setProgress(percentStart);
                    setStatusMessage(`Generating variant ${i + 1} of ${variants}...`);

                    const currentSeed = baseSeed + i;
                    const requestParams = { ...params, seed: currentSeed };

                    try {
                        const result = await generateImage(requestParams, settings.veniceApiKey);
                        const compressed = await compressImage(result.images[0]);
                        const newItem: GalleryItem = {
                            id: Date.now() + Math.random().toString(36),
                            base64: compressed,
                            params: requestParams,
                            createdAt: Date.now(),
                            mediaType: 'image'
                        };
                        onNewItem(newItem);
                        completedCount++;
                    } catch (e: any) {
                        console.error(`Variant ${i + 1} failed:`, e);
                        onAddToast(`Variant ${i + 1} failed: ${e.message}`, 'error');
                    }
                }

                if (completedCount > 0) {
                    onAddToast(`Successfully generated ${completedCount} image${completedCount > 1 ? 's' : ''}!`, 'success');
                    setStatusMessage("Done!");
                }
            }
            setProgress(100);
        } catch (err: any) {
            console.error("Generation error:", err);

            let message = err.message || "Generation failed.";

            // Handle raw JSON object errors often returned by GenAI/Cloud SDKs
            if (err.error && err.error.message) {
                message = err.error.message;
            } else if (typeof err === 'object' && err.message) {
                message = err.message;
            }

            // Check for specific permission/leaked key errors
            if (
                message.includes('403') ||
                message.includes('PERMISSION_DENIED') ||
                message.toLowerCase().includes('leaked') ||
                message.toLowerCase().includes('expired')
            ) {
                message = "API Key Invalid or Leaked. Please check your API Key in Settings.";
            }

            onAddToast(message, 'error');
        } finally {
            setTimeout(() => {
                setIsGenerating(false);
                setProgress(0);
            }, 1000); // Wait a bit to show 100%
        }
    };

    const handleEnhance = async (item: GalleryItem) => {
        onViewItem(item);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
            <div className="lg:w-1/3 space-y-4">
                {isGenerating && (
                    <div className="bg-slate-900/30 border border-orange-500/50 text-orange-200 p-6 rounded-xl animate-fadeIn shadow-lg">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                            <span className="font-semibold text-center">{statusMessage}</span>
                        </div>
                        <ProgressBar progress={progress} label="Progress" />
                    </div>
                )}
                <ControlPanel
                    onGenerate={handleGenerate}
                    onClearHistory={() => { }}
                    isGenerating={isGenerating}
                    apiKey={settings.veniceApiKey}
                    geminiKey={settings.geminiApiKey}
                />
            </div>
            <div className="lg:w-2/3">
                <h3 className="text-xl font-bold text-white mb-4">Recent Generations</h3>
                <Gallery
                    items={recentItems.slice(0, 6)}
                    onEnhance={handleEnhance}
                    onView={onViewItem}
                    isLoading={isGenerating}
                />
            </div>
        </div>
    );
};