import React, { useState } from 'react';
import type { AppSettings } from '../types';
import { Button } from './Button';
import { Save, Lock, Key } from 'lucide-react';

interface SettingsScreenProps {
    settings: AppSettings;
    onSave: (newSettings: AppSettings) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ settings, onSave }) => {
    const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
    const [saved, setSaved] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(localSettings);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="max-w-2xl mx-auto bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-700">
                <div className="p-3 bg-slate-700 rounded-xl">
                    <Key className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">API Configuration</h2>
                    <p className="text-slate-400 text-sm">Keys are encrypted with your password.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Venice.ai API Key</label>
                    <input 
                        type="password"
                        value={localSettings.veniceApiKey || ''}
                        onChange={(e) => setLocalSettings({...localSettings, veniceApiKey: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-600 rounded-xl p-4 text-white focus:ring-2 focus:ring-orange-500 font-mono text-sm tracking-wider"
                        placeholder="sk-..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Gemini API Key</label>
                    <input 
                        type="password"
                        value={localSettings.geminiApiKey || ''}
                        onChange={(e) => setLocalSettings({...localSettings, geminiApiKey: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-600 rounded-xl p-4 text-white focus:ring-2 focus:ring-orange-500 font-mono text-sm tracking-wider"
                        placeholder="AIza..."
                    />
                </div>

                <div className="pt-4 flex items-center justify-between">
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Stored locally & encrypted
                    </p>
                    <Button type="submit" variant="primary" className="flex items-center gap-2">
                        {saved ? 'Saved!' : 'Save & Lock'} <Save className="w-4 h-4" />
                    </Button>
                </div>
            </form>
        </div>
    );
};