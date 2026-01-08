import React, { useState, useMemo } from 'react';
import { GalleryItem as IGalleryItem } from '../types';
import { GalleryItem } from './GalleryItem';
import { Filter, SortDesc, Layers, Image as ImageIcon, Loader2 } from 'lucide-react';

interface GalleryProps {
  items: IGalleryItem[];
  onEnhance: (item: IGalleryItem) => void;
  onView: (item: IGalleryItem) => void;
  isLoading?: boolean;
}

export const Gallery: React.FC<GalleryProps> = ({ items, onEnhance, onView, isLoading }) => {
  const [filterModel, setFilterModel] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'model'>('date');

  // Extract unique models for filter dropdown
  const uniqueModels = useMemo(() => {
    const models = new Set(items.map(i => i.params.model));
    return Array.from(models);
  }, [items]);

  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // Filter
    if (filterModel !== 'all') {
      result = result.filter(item => item.params.model === filterModel);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'date') {
        // Sort by timestamp desc (newest first)
        return (b.createdAt || 0) - (a.createdAt || 0);
      } else if (sortBy === 'model') {
        return a.params.model.localeCompare(b.params.model);
      }
      return 0;
    });

    return result;
  }, [items, filterModel, sortBy]);

  if (items.length === 0 && !isLoading) {
    return (
      <div className="bg-slate-800/50 p-8 rounded-3xl shadow-lg flex flex-col items-center justify-center min-h-[40vh] border border-slate-700/50 border-dashed">
        <ImageIcon className="w-16 h-16 text-slate-600 mb-4" />
        <p className="text-slate-400 text-lg">Gallery is empty.</p>
        <p className="text-slate-500 text-sm">Generate some art to fill this space!</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 p-6 rounded-3xl shadow-xl border border-slate-700 min-h-[60vh]">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-orange-400" /> Full Gallery
            <span className="text-sm font-normal text-slate-500 ml-2">({items.length} items)</span>
        </h2>
        
        <div className="flex gap-3">
            <div className="relative">
                <select 
                    value={filterModel}
                    onChange={(e) => setFilterModel(e.target.value)}
                    className="bg-slate-700 text-white text-sm rounded-lg pl-9 pr-4 py-2 appearance-none focus:ring-2 focus:ring-orange-500 border-none outline-none cursor-pointer"
                >
                    <option value="all">All Models</option>
                    {uniqueModels.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
                <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-slate-700 text-white text-sm rounded-lg pl-9 pr-4 py-2 appearance-none focus:ring-2 focus:ring-orange-500 border-none outline-none cursor-pointer"
                >
                    <option value="date">Newest First</option>
                    <option value="model">Model Name</option>
                </select>
                <SortDesc className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
        {isLoading && [...Array(4)].map((_, i) => (
             <div key={`skeleton-${i}`} className="aspect-square bg-slate-800 rounded-xl overflow-hidden animate-pulse border border-slate-700 flex flex-col items-center justify-center shadow-lg">
                  <Loader2 className="w-10 h-10 text-orange-500/50 mb-3 animate-spin" />
                  <div className="h-2 w-20 bg-slate-700 rounded-full mb-2"></div>
                  <div className="h-2 w-12 bg-slate-700 rounded-full"></div>
             </div>
        ))}
        
        {filteredAndSortedItems.map((item) => (
          <div key={item.id} onClick={() => onView(item)} className="cursor-zoom-in relative group transition-transform hover:scale-[1.01]">
             <GalleryItem item={item} onEnhance={onEnhance} />
          </div>
        ))}
      </div>
    </div>
  );
};