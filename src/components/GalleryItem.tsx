import React, { useState, useEffect } from 'react';
import type { GalleryItem as IGalleryItem } from '../types';
import { Expand, Image as ImageIcon, Video as VideoIcon, Play } from 'lucide-react';

interface GalleryItemProps {
  item: IGalleryItem;
  onEnhance: (item: IGalleryItem) => void;
}

export const GalleryItem: React.FC<GalleryItemProps> = ({ item }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const isVideo = item.mediaType === 'video';
  const hasValidBase64 = item.base64 && item.base64.length > 100;

  const src = hasValidBase64
    ? `data:${isVideo ? 'video/mp4' : 'image/jpeg'};base64,${item.base64}`
    : '';

  // Delay showing content to prevent flicker during rapid state changes
  useEffect(() => {
    if (isLoaded && hasValidBase64) {
      const timer = setTimeout(() => setShowContent(true), 50);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isLoaded, hasValidBase64]);

  return (
    <div className="relative aspect-square bg-slate-800 rounded-xl overflow-hidden group shadow-lg border border-slate-700/50 hover:border-orange-500 transition-all transform hover:scale-[1.02]">

      {/* Skeleton / Icon Loader - show until content is fully ready */}
      {!showContent && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 animate-pulse z-10">
          {isVideo ? <VideoIcon className="w-10 h-10 text-slate-700 mb-2" /> : <ImageIcon className="w-10 h-10 text-slate-700 mb-2" />}
          <div className="h-2 w-16 bg-slate-800 rounded-full"></div>
        </div>
      )}

      {/* Only render media elements when we have valid base64 data */}
      {hasValidBase64 && (
        isVideo ? (
          <video
            src={src}
            className={`w-full h-full object-cover transition-opacity duration-300 ${showContent ? 'opacity-100' : 'opacity-0'}`}
            onLoadedData={() => setIsLoaded(true)}
            muted
            loop
            onMouseOver={(e) => e.currentTarget.play()}
            onMouseOut={(e) => e.currentTarget.pause()}
          />
        ) : (
          <img
            src={src}
            alt={item.params.prompt}
            className={`w-full h-full object-cover transition-opacity duration-300 ${showContent ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setIsLoaded(true)}
            loading="lazy"
          />
        )
      )}

      {/* Overlay */}
      <div className={`absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 z-20 ${!showContent ? 'hidden' : ''}`}>
        <p className="text-xs text-gray-200 line-clamp-2 mb-2 font-medium">{item.params.prompt}</p>
        <div className="flex justify-between items-center text-[10px] text-slate-400">
          <span className="truncate max-w-[80%]">{item.params.model}</span>
          {isVideo && <VideoIcon className="w-3 h-3 text-orange-400" />}
        </div>
      </div>

      {isVideo && showContent && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
          <div className="bg-black/40 rounded-full p-2 backdrop-blur-sm border border-white/10">
            <Play className="w-6 h-6 text-white fill-white" />
          </div>
        </div>
      )}

      <div className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 ${!showContent ? 'hidden' : ''}`}>
        <div className="bg-black/50 p-1.5 rounded-full backdrop-blur-sm">
          <Expand className="w-4 h-4 text-white" />
        </div>
      </div>
    </div>
  );
};