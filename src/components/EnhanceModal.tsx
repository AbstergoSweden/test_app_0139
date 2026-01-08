import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface EnhanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (prompt: string, creativity: number) => void;
}

export const EnhanceModal: React.FC<EnhanceModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [prompt, setPrompt] = useState('');
    const [creativity, setCreativity] = useState(0.5);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(prompt, creativity);
        setPrompt(''); // Reset
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Enhance Image">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="enhance-prompt" className="block text-sm font-medium text-gray-300 mb-2">Enhancement Prompt (Optional)</label>
                    <input 
                        type="text" 
                        id="enhance-prompt" 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder-gray-500" 
                        placeholder="e.g., cinematic lighting, hyperrealistic, 8k" 
                    />
                </div>
                <div>
                    <label htmlFor="enhance-creativity" className="block text-sm font-medium text-gray-300 mb-2">
                        Creative Intensity: <span className="text-blue-400 font-bold">{creativity}</span>
                    </label>
                    <input 
                        id="enhance-creativity" 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.05" 
                        value={creativity} 
                        onChange={(e) => setCreativity(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" 
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Conservative</span>
                        <span>Balanced</span>
                        <span>Wild</span>
                    </div>
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="primary">Enhance</Button>
                </div>
            </form>
        </Modal>
    );
};
