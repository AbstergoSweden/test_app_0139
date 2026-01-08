import React, { useState, useRef, useEffect } from 'react';
import { ControlPanel } from './ControlPanel';
import type { GalleryItem, GenerationParams, AppSettings } from '../types';
import { generateImage } from '../services/veniceService';
import { generateGeminiImage, generateGeminiVideo } from '../services/geminiService';
import { compressImage } from '../utils';
import { Gallery } from './Gallery';

import type { ToastType } from './Toast';
import { ProgressBar } from './ProgressBar';

interface ImageGenScreenProps {
    settings: AppSettings;
    recentItems: GalleryItem[];
    onNewItem: (item: GalleryItem) => void;
    onUpdateItem: (item: GalleryItem) => void;
    onViewItem: (item: GalleryItem) => void;
    onAddToast: (message: string, type: ToastType) => void;
}

// Placeholder item for optimistic UI
interface PendingItem extends GalleryItem {
    isPending: true;
}

export const ImageGenScreen: React.FC<ImageGenScreenProps> = ({ settings, recentItems, onNewItem, onUpdateItem: _onUpdateItem, onViewItem, onAddToast }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [progress, setProgress] = useState(0);
    const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
    
    // Track current generation to allow cancellation
    const generationAbortRef = useRef<AbortController | null>(null);
    
    // Clean up pending items on unmount
    useEffect(() => {
        return () => {
            if (generationAbortRef.current) {
                generationAbortRef.current.abort();
            }
        };
    }, []);

    // Create optimistic placeholder item
    const createPendingItem = (params: GenerationParams, index: number): PendingItem => ({
        id: `pending-${Date.now()}-${index}`,
        base64: '', // Empty - will show skeleton
        params,
        createdAt: Date.now(),
        mediaType: params.mediaType || 'image',
        isPending: true,
    });

    // Replace pending item with real item
    const resolvePendingItem = (pendingId: string, realItem: GalleryItem) => {
        setPendingItems(prev => prev.filter(p => p.id !== pendingId));
        onNewItem(realItem);
    };

    // Remove failed pending item
    const rejectPendingItem = (pendingId: string) => {
        setPendingItems(prev => prev.filter(p => p.id !== pendingId));
    };

    const handleGenerate = async (params: GenerationParams, variants: number) => {
        setIsGenerating(true);
        setStatusMessage("Initializing generation...");
        setProgress(0);
        
        // Create abort controller for this generation
        generationAbortRef.current = new AbortController();

        try {
            // --- GEMINI HANDLER ---
            if (params.provider === 'gemini') {
                if (!settings.geminiApiKey) throw new Error("Gemini API Key missing.");

                // Add optimistic pending item
                const pendingItem = createPendingItem(params, 0);
                setPendingItems(prev => [pendingItem, ...prev]);

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
                
                // Replace pending with real item (optimistic update complete)
                resolvePendingItem(pendingItem.id, newItem);
                onAddToast("Generated successfully!", 'success');
            }
            // --- VENICE HANDLER ---
            else {
                const baseSeed = params.seed;
                let completedCount = 0;

                // Add optimistic pending items for all variants
                const pendingItemsList: PendingItem[] = [];
                for (let i = 0; i < variants; i++) {
                    const pending = createPendingItem({ ...params, seed: baseSeed + i }, i);
                    pendingItemsList.push(pending);
                }
                setPendingItems(prev => [...pendingItemsList, ...prev]);

                for (let i = 0; i < variants; i++) {
                    const percentStart = Math.round((i / variants) * 100);
                    setProgress(percentStart);
                    setStatusMessage(`Generating variant ${i + 1} of ${variants}...`);

                    const currentSeed = baseSeed + i;
                    const requestParams = { ...params, seed: currentSeed };
                    const pendingItem = pendingItemsList[i];

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
                        
                        // Replace this pending item with real item
                        resolvePendingItem(pendingItem.id, newItem);
                        completedCount++;
                    } catch (e: unknown) {
                        const message = e instanceof Error ? e.message : 'Unknown error';
                        console.error(`Variant ${i + 1} failed:`, e);
                        onAddToast(`Variant ${i + 1} failed: ${message}`, 'error');
                        // Remove failed pending item
                        rejectPendingItem(pendingItem.id);
                    }
                }

                if (completedCount > 0) {
                    onAddToast(`Successfully generated ${completedCount} image${completedCount > 1 ? 's' : ''}!`, 'success');
                    setStatusMessage("Done!");
                }
            }
            setProgress(100);
        } catch (err: unknown) {
            console.error("Generation error:", err);
            
            // Clear all pending items on error
            setPendingItems([]);

            let message = err instanceof Error ? err.message : "Generation failed.";

            // Handle raw JSON object errors often returned by GenAI/Cloud SDKs
            if (typeof err === 'object' && err !== null) {
                const errObj = err as { error?: { message?: string }; message?: string };
                if (errObj.error?.message) {
                    message = errObj.error.message;
                } else if (errObj.message) {
                    message = errObj.message;
                }
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
            generationAbortRef.current = null;
            setTimeout(() => {
                setIsGenerating(false);
                setProgress(0);
            }, 1000); // Wait a bit to show 100%
        }
    };

    const handleEnhance = async (item: GalleryItem) => {
        onViewItem(item);
    };
    
    // Combine pending items with recent items for display
    // Filter out pending items from the combined list to show them separately with loading state
    const displayItems = [...pendingItems, ...recentItems];

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
                    items={displayItems.slice(0, 6)}
                    onEnhance={handleEnhance}
                    onView={onViewItem}
                    isLoading={isGenerating && pendingItems.length === 0}
                />
            </div>
        </div>
    );
};