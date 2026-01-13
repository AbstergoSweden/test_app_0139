import React, { useState, useMemo } from 'react';
import type { GalleryItem as IGalleryItem } from '../types';
import { GalleryItem } from './GalleryItem';
import { Filter, SortDesc, Layers, Image as ImageIcon, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 50;

interface GalleryProps {
  items: IGalleryItem[];
  onEnhance: (item: IGalleryItem) => void;
  onView: (item: IGalleryItem) => void;
  isLoading?: boolean;
}

export const Gallery: React.FC<GalleryProps> = ({ items, onEnhance, onView, isLoading }) => {
  const [filterModel, setFilterModel] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'model'>('date');
  const [currentPage, setCurrentPage] = useState(1);

  const uniqueModels = useMemo(() => {
    const models = new Set(items.map(i => i.params.model));
    return Array.from(models);
  }, [items]);

  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    if (filterModel !== 'all') {
      result = result.filter(item => item.params.model === filterModel);
    }

    result.sort((a, b) => {
      if (sortBy === 'date') {
        return (b.createdAt || 0) - (a.createdAt || 0);
      } else if (sortBy === 'model') {
        return a.params.model.localeCompare(b.params.model);
      }
      return 0;
    });

    return result;
  }, [items, filterModel, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedItems = filteredAndSortedItems.slice(startIndex, endIndex);
  
  const handleFilterChange = (value: string) => {
    setFilterModel(value);
    setCurrentPage(1);
  };
  
  const handleSortChange = (value: 'date' | 'model') => {
    setSortBy(value);
    setCurrentPage(1);
  };

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
            <span className="text-sm font-normal text-slate-500 ml-2">({filteredAndSortedItems.length} items)</span>
        </h2>
        
        <div className="flex gap-3">
            <div className="relative">
                <select 
                    value={filterModel}
                    onChange={(e) => handleFilterChange(e.target.value)}
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
                    onChange={(e) => handleSortChange(e.target.value as 'date' | 'model')}
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
        
        {paginatedItems.map((item) => (
          <div key={item.id} onClick={() => onView(item)} className="cursor-zoom-in relative group transition-transform hover:scale-[1.01]">
             <GalleryItem item={item} onEnhance={onEnhance} />
          </div>
        ))}
      </div>

      {/* Pagination Controls - only show if more than one page */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t border-slate-700">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 rounded-lg text-sm font-medium transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          
          <div className="flex items-center gap-2">
            {/* Page numbers with ellipsis for large page counts */}
            {totalPages <= 7 ? (
              // Show all pages if 7 or fewer
              Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    page === currentPage
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                >
                  {page}
                </button>
              ))
            ) : (
              // Show abbreviated pagination for many pages
              <>
                <button
                  onClick={() => setCurrentPage(1)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    1 === currentPage ? 'bg-orange-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                >
                  1
                </button>
                
                {currentPage > 3 && <span className="text-slate-500 px-1">...</span>}
                
                {Array.from({ length: 3 }, (_, i) => currentPage - 1 + i)
                  .filter(p => p > 1 && p < totalPages)
                  .map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        page === currentPage ? 'bg-orange-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))
                }
                
                {currentPage < totalPages - 2 && <span className="text-slate-500 px-1">...</span>}
                
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    totalPages === currentPage ? 'bg-orange-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>
          
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 rounded-lg text-sm font-medium transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* Items range indicator */}
      {totalPages > 1 && (
        <p className="text-center text-slate-500 text-sm mt-3">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedItems.length)} of {filteredAndSortedItems.length}
        </p>
      )}
    </div>
  );
};