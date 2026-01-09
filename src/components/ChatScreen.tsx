import React, { useState, useRef, useEffect } from 'react';
import type { AppSettings, ChatSession, ChatMessage, Model } from '../types';
import { Button } from './Button';
import { Send, Bot, User as UserIcon, PlusCircle, Trash2, Globe, BrainCircuit, Paperclip, X } from 'lucide-react';

import { fetchModels, generateChatResponse } from '../services/veniceService';
import { generateGeminiChat } from '../services/geminiService';
import { compressImage } from '../utils';

interface ChatScreenProps {
    settings: AppSettings;
    chats: ChatSession[];
    onUpdateChats: (chats: ChatSession[]) => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ settings, chats, onUpdateChats }) => {
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [veniceModels, setVeniceModels] = useState<Model[]>([]);
    const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
    const [systemPrompt, setSystemPrompt] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // New Features State
    const [useThinking, setUseThinking] = useState(false);
    const [useSearch, setUseSearch] = useState(false);
    const [attachments, setAttachments] = useState<{ type: 'image' | 'video', base64: string, mimeType: string }[]>([]);

    const activeChat = chats.find(c => c.id === activeChatId);

    useEffect(() => {
        const loadModels = async () => {
            if (settings.veniceApiKey) {
                const models = await fetchModels('text', settings.veniceApiKey);
                setVeniceModels(models);
            }
        };
        loadModels();
    }, [settings.veniceApiKey]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeChat?.messages]);

    const createNewChat = () => {
        const newChat: ChatSession = {
            id: Date.now().toString(),
            name: 'New Chat',
            model: selectedModel,
            messages: [],
            systemPrompt: systemPrompt,
            config: {
                useThinking,
                useSearch
            }
        };
        onUpdateChats([newChat, ...chats]);
        setActiveChatId(newChat.id);
        setSystemPrompt('');
        setUseThinking(false);
        setUseSearch(false);
    };

    const deleteChat = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onUpdateChats(chats.filter(c => c.id !== id));
        if (activeChatId === id) setActiveChatId(null);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');

            if (!isImage && !isVideo) continue;

            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = (reader.result as string).split(',')[1];
                let processedBase64 = base64;
                if (isImage) {
                    processedBase64 = await compressImage(base64, 0.7);
                }
                setAttachments(prev => [...prev, {
                    type: isImage ? 'image' : 'video',
                    base64: processedBase64,
                    mimeType: file.type
                }]);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const sendMessage = async () => {
        if ((!input.trim() && attachments.length === 0) || !activeChatId || !activeChat) return;

        const userMsg: ChatMessage = {
            role: 'user',
            content: input,
            timestamp: Date.now(),
            attachments: attachments.length > 0 ? attachments : undefined
        };

        onUpdateChats(chats.map(c =>
            c.id === activeChatId
                ? { ...c, messages: [...c.messages, userMsg] }
                : c
        ));

        setInput('');
        setAttachments([]);
        setIsLoading(true);

        try {
            let responseText = "";
            const modelName = activeChat.model;

            if (modelName.startsWith('gemini')) {
                const apiKey = settings.geminiApiKey || process.env.API_KEY;
                if (!apiKey) throw new Error("Gemini API Key missing");

                // Use Enhanced Chat Service
                responseText = await generateGeminiChat(
                    [...activeChat.messages, userMsg],
                    apiKey,
                    activeChat.systemPrompt,
                    activeChat.config
                );

            } else if (settings.veniceApiKey) {
                // Venice (Standard Text)
                responseText = await generateChatResponse(
                    [...activeChat.messages, userMsg],
                    modelName,
                    settings.veniceApiKey,
                    activeChat.systemPrompt
                );
            } else {
                throw new Error("No API key available for this model.");
            }

            const aiMsg: ChatMessage = { role: 'model', content: responseText, timestamp: Date.now() };

            onUpdateChats(chats.map(c => {
                if (c.id === activeChatId) {
                    const updatedMessages = [...c.messages, userMsg, aiMsg];
                    const updatedName = c.name === 'New Chat' && userMsg.content
                        ? userMsg.content.slice(0, 30) + '...'
                        : c.name;
                    return { ...c, messages: updatedMessages, name: updatedName };
                }
                return c;
            }));

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error occurred";
            const errorMsg: ChatMessage = { role: 'model', content: "Error: " + message, timestamp: Date.now() };
            onUpdateChats(chats.map(c =>
                c.id === activeChatId
                    ? { ...c, messages: [...c.messages, errorMsg] }
                    : c
            ));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-140px)] bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 shadow-xl">
            <div className="w-1/3 md:w-1/4 bg-slate-900 border-r border-slate-700 flex flex-col">
                <div className="p-4 border-b border-slate-700">
                    <Button onClick={createNewChat} className="w-full flex items-center justify-center gap-2 text-sm">
                        <PlusCircle className="w-4 h-4" /> New Chat
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {chats.map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => setActiveChatId(chat.id)}
                            className={`p-3 rounded-xl cursor-pointer flex justify-between items-center group ${activeChatId === chat.id ? 'bg-orange-600/20 border border-orange-500/50' : 'hover:bg-slate-800 border border-transparent'}`}
                        >
                            <div className="truncate text-sm text-slate-300 font-medium">{chat.name}</div>
                            <button onClick={(e) => deleteChat(chat.id, e)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex flex-col bg-slate-800/50">
                {activeChat ? (
                    <>
                        <div className="p-4 border-b border-slate-700 bg-slate-800 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-white flex items-center gap-2">{activeChat.name}</h3>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-xs text-orange-400 bg-orange-900/30 px-2 py-0.5 rounded flex items-center gap-1">
                                        <Globe className="w-3 h-3" /> {activeChat.model}
                                    </span>
                                    {activeChat.config?.useThinking && (
                                        <span className="text-xs text-red-400 bg-red-900/30 px-2 py-0.5 rounded flex items-center gap-1">
                                            <BrainCircuit className="w-3 h-3" /> Thinking
                                        </span>
                                    )}
                                    {activeChat.config?.useSearch && (
                                        <span className="text-xs text-orange-300 bg-orange-900/30 px-2 py-0.5 rounded flex items-center gap-1">
                                            <Globe className="w-3 h-3" /> Search
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {activeChat.messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-orange-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
                                        <div className="flex items-center gap-2 mb-1 opacity-50 text-[10px] uppercase font-bold">
                                            {msg.role === 'user' ? <UserIcon className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                                            {msg.role}
                                        </div>
                                        {msg.attachments && msg.attachments.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {msg.attachments.map((att, idx) => (
                                                    <div key={idx} className="relative rounded-lg overflow-hidden border border-white/20">
                                                        {att.type === 'image' ? (
                                                            <img src={`data:${att.mimeType};base64,${att.base64}`} alt="attachment" className="h-20 w-auto object-cover" />
                                                        ) : (
                                                            <div className="h-20 w-20 bg-slate-900 flex items-center justify-center text-xs">Video</div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 bg-slate-900 border-t border-slate-700">
                            {/* Attachments Preview */}
                            {attachments.length > 0 && (
                                <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                                    {attachments.map((att, idx) => (
                                        <div key={idx} className="relative group">
                                            {att.type === 'image' ? (
                                                <img src={`data:${att.mimeType};base64,${att.base64}`} className="h-16 w-16 object-cover rounded-lg border border-slate-600" />
                                            ) : (
                                                <div className="h-16 w-16 bg-slate-800 rounded-lg border border-slate-600 flex items-center justify-center text-xs">VID</div>
                                            )}
                                            <button
                                                onClick={() => removeAttachment(idx)}
                                                className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 text-white shadow-sm"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-3 rounded-xl bg-slate-800 border border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700 transition"
                                    title="Attach Image or Video"
                                >
                                    <Paperclip className="w-5 h-5" />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    multiple
                                    accept="image/*,video/*"
                                    onChange={handleFileSelect}
                                />
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                                    placeholder="Ask anything..."
                                    className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                                <Button onClick={sendMessage} disabled={isLoading || (!input.trim() && attachments.length === 0)} variant="primary" className="px-4">
                                    <Send className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <Bot className="w-16 h-16 text-slate-700 mb-4" />
                        <h2 className="text-xl font-bold text-white mb-4">Select or Create a Chat</h2>

                        <div className="bg-slate-700/50 p-6 rounded-2xl border border-slate-700 w-full max-w-md text-left space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Model Selection</label>
                                <select
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white text-sm"
                                >
                                    <optgroup label="Direct Gemini (Unfiltered)">
                                        <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                                        <option value="gemini-3-pro-preview">Gemini 3 Pro</option>
                                    </optgroup>
                                    {veniceModels.length > 0 && (
                                        <optgroup label="Venice.ai (Uncensored)">
                                            {veniceModels.map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </optgroup>
                                    )}
                                </select>
                            </div>

                            {selectedModel.includes('gemini') && (
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={useThinking}
                                            onChange={(e) => { setUseThinking(e.target.checked); if (e.target.checked) setUseSearch(false); }}
                                            className="rounded border-slate-600 bg-slate-800 text-orange-500"
                                        />
                                        Thinking Mode
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={useSearch}
                                            onChange={(e) => { setUseSearch(e.target.checked); if (e.target.checked) setUseThinking(false); }}
                                            className="rounded border-slate-600 bg-slate-800 text-orange-500"
                                        />
                                        Google Search
                                    </label>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">System Instructions</label>
                                <textarea
                                    value={systemPrompt}
                                    onChange={(e) => setSystemPrompt(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white text-sm h-20"
                                    placeholder="e.g. You are a creative writer..."
                                />
                            </div>
                            <Button onClick={createNewChat} className="w-full">Initialize Session</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};