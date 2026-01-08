import React from 'react';

interface ProgressBarProps {
    progress: number;
    label?: string;
    showPercentage?: boolean;
    className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
    progress, 
    label, 
    showPercentage = true,
    className = ''
}) => {
    // Ensure progress is between 0 and 100
    const clampedProgress = Math.min(100, Math.max(0, progress));

    return (
        <div className={`w-full ${className}`}>
            <div className="flex justify-between mb-1">
                {label && <span className="text-sm font-medium text-orange-200">{label}</span>}
                {showPercentage && <span className="text-sm font-medium text-orange-200">{Math.round(clampedProgress)}%</span>}
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5 border border-slate-600">
                <div 
                    className="bg-orange-600 h-2.5 rounded-full transition-all duration-300 ease-out relative overflow-hidden" 
                    style={{ width: `${clampedProgress}%` }}
                >
                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] w-full h-full" 
                         style={{ backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)', backgroundSize: '200% 100%' }}>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
};