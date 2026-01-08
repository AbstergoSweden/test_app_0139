import React, { useState } from 'react';
import { GalleryItem } from '../types';
import { Button } from './Button';
import { Download, Trash2, Wand2, X, Copy, Check, Maximize2, Minimize2 } from 'lucide-react';
import { ProgressBar } from './ProgressBar';

interface ImageViewerProps {
    item: GalleryItem;
    onClose: () => void;
    onDelete: (id: string) => void;
    onEnhance: (item: GalleryItem) => void;
    isEnhancing?: boolean;
    enhanceProgress?: number;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
    item,
    onClose,
    onDelete,
    onEnhance,
    isEnhancing = false,
    enhanceProgress = 0
}) => {
    const [copied, setCopied] = useState(false);
    const [showDetails, setShowDetails] = useState(true);
    const isVideo = item.mediaType === 'video';

    const src = `data:${isVideo ? 'video/mp4' : 'image/jpeg'};base64,${item.base64}`;
    const filename = isVideo ? `veo_video_${item.params.seed}.mp4` : `venice_art_${item.params.seed}.jpeg`;

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = src;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCopyPrompt = () => {
        navigator.clipboard.writeText(item.params.prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/98 backdrop-blur-xl animate-fadeIn"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isEnhancing) onClose();
            }}
        >
            <div className="relative w-full h-full flex flex-col md:flex-row overflow-hidden pointer-events-auto">

                {/* Image/Video Area */}
                <div
                    className={`relative flex-1 flex items-center justify-center bg-black/20 transition-all duration-300 ease-in-out p-4 md:p-8
                    ${showDetails ? 'md:w-[calc(100%-24rem)]' : 'w-full'}`}
                    onClick={() => !isEnhancing && setShowDetails(!showDetails)}
                >
                    {isVideo ? (
                        <video
                            src={src}
                            controls
                            autoPlay
                            loop
                            className="max-w-full max-h-full shadow-2xl rounded-lg"
                        />
                    ) : (
                        <img
                            src={src}
                            alt={item.params.prompt}
                            className={`max-w-full max-h-full object-contain shadow-2xl transition-all duration-500 cursor-pointer
                            ${isEnhancing ? 'opacity-30 blur-sm scale-105' : 'opacity-100 scale-100 hover:scale-[1.01]'}`}
                            title={showDetails ? "Click to hide details" : "Click to show details"}
                        />
                    )}

                    {/* Toggle & Close Controls Overlay */}
                    <div className="absolute top-4 right-4 flex gap-3 z-50" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="p-2.5 bg-black/50 hover:bg-slate-800 rounded-full text-white transition border border-white/10 backdrop-blur-md group"
                            title={showDetails ? "Maximize Image" : "Show Details"}
                        >
                            {showDetails ? <Maximize2 className="w-5 h-5 group-hover:scale-110 transition" /> : <Minimize2 className="w-5 h-5 group-hover:scale-110 transition" />}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2.5 bg-black/50 hover:bg-red-900/50 rounded-full text-white transition border border-white/10 backdrop-blur-md group"
                            title="Close Preview"
                        >
                            <X className="w-5 h-5 group-hover:scale-110 transition" />
                        </button>
                    </div>

                    {isEnhancing && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                            <div className="bg-slate-900/90 p-8 rounded-2xl border border-red-500/50 shadow-2xl max-w-sm w-full backdrop-blur-xl animate-pulse">
                                <h3 className="text-xl font-bold text-white mb-4 text-center">Enhancing Image...</h3>
                                <ProgressBar progress={enhanceProgress} label="Processing" />
                                <p className="text-xs text-red-300 mt-4 text-center">Adding details and upscaling resolution</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Details Sidebar */}
                <div
                    className={`md:w-96 flex flex-col bg-slate-900 border-l border-slate-800 shadow-2xl shrink-0 transition-all duration-300 absolute md:relative right-0 h-full z-40
                    ${showDetails ? 'translate-x-0' : 'translate-x-full md:mr-[-24rem]'}
                    `}
                >
                    <div className="p-6 border-b border-slate-800 bg-slate-900">
                        <div className="flex justify-between items-start mb-2">
                            <h2 className="text-xl font-bold text-white">{isVideo ? 'Video Details' : 'Image Details'}</h2>
                            {item.params.enhanced && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900/50 text-red-200 border border-red-500/30">
                                    ✨ Enhanced
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500">
                            Created {new Date(item.createdAt || Date.now()).toLocaleDateString()} at {new Date(item.createdAt || Date.now()).toLocaleTimeString()}
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-900/95">
                        {/* Prompt */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prompt</h4>
                                <button
                                    onClick={handleCopyPrompt}
                                    className="text-slate-500 hover:text-white transition flex items-center gap-1 text-xs"
                                    title="Copy Prompt"
                                >
                                    {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                    {copied ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 hover:border-slate-600 transition shadow-inner">
                                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-light">{item.params.prompt}</p>
                            </div>
                        </div>

                        {/* Negative Prompt */}
                        {item.params.negative_prompt && (
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Negative Prompt</h4>
                                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 shadow-inner">
                                    <p className="text-xs text-slate-400 leading-relaxed">{item.params.negative_prompt}</p>
                                </div>
                            </div>
                        )}

                        {/* Tech Specs */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/30 hover:bg-slate-800/50 transition">
                                <span className="block text-xs text-slate-500 uppercase mb-1">Model</span>
                                <span className="block text-sm text-orange-400 font-medium truncate" title={item.params.model}>
                                    {item.params.model}
                                </span>
                            </div>
                            <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/30 hover:bg-slate-800/50 transition">
                                <span className="block text-xs text-slate-500 uppercase mb-1">Seed</span>
                                <span className="block text-sm text-slate-300 font-mono truncate" title={item.params.seed.toString()}>{item.params.seed}</span>
                            </div>
                            {item.params.geminiConfig?.imageSize && (
                                <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/30 hover:bg-slate-800/50 transition">
                                    <span className="block text-xs text-slate-500 uppercase mb-1">Size</span>
                                    <span className="block text-sm text-slate-300">{item.params.geminiConfig.imageSize}</span>
                                </div>
                            )}
                            {item.params.aspectRatio && (
                                <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/30 hover:bg-slate-800/50 transition">
                                    <span className="block text-xs text-slate-500 uppercase mb-1">Aspect Ratio</span>
                                    <span className="block text-sm text-slate-300">{item.params.aspectRatio}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-800 bg-slate-900 flex flex-col gap-3">
                        <Button
                            onClick={handleDownload}
                            variant="primary"
                            className="w-full justify-center py-3"
                            disabled={isEnhancing}
                        >
                            <Download className="w-5 h-5 mr-2" /> Download {isVideo ? 'Video' : 'Image'}
                        </Button>
                        <div className="flex gap-3">
                            {!isVideo && (
                                <Button
                                    onClick={() => onEnhance(item)}
                                    variant="enhance"
                                    className="flex-1 justify-center py-3"
                                    isLoading={isEnhancing}
                                    disabled={isEnhancing}
                                >
                                    <Wand2 className="w-4 h-4 mr-2" /> Upscale
                                </Button>
                            )}
                            <Button
                                onClick={() => {
                                    if (confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
                                        onDelete(item.id);
                                        onClose();
                                    }
                                }}
                                variant="danger"
                                className={`px-4 ${isVideo ? 'w-full' : ''}`}
                                disabled={isEnhancing}
                                title="Delete Item"
                            >
                                <Trash2 className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};