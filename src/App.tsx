import React, { useState, useEffect, useRef } from 'react';
import { UserData, AppView, AppSettings, GalleryItem, ChatSession } from './types';
import { saveUserData } from './services/secureStorage';
import { AuthScreen } from './components/AuthScreen';
import { ImageGenScreen } from './components/ImageGenScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { ChatScreen } from './components/ChatScreen';
import { Gallery } from './components/Gallery';
import { ImageViewer } from './components/ImageViewer';
import { Toast, ToastMessage, ToastType } from './components/Toast';
import { upscaleImage } from './services/veniceService';
import { compressImage } from './utils';
import { Palette, MessageSquare, Settings as SettingsIcon, LogOut, Layers, Code } from 'lucide-react';

export default function App() {
    const [user, setUser] = useState<UserData | null>(null);
    const [password, setPassword] = useState<string>('');
    const [currentView, setCurrentView] = useState<AppView>('auth');
    const [viewingItem, setViewingItem] = useState<GalleryItem | null>(null);

    // Enhancement State
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [enhanceProgress, setEnhanceProgress] = useState(0);
    const progressInterval = useRef<number | null>(null);

    // Toast State
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    // Debounced save ref to prevent rapid re-encryption on every state change
    const saveTimeoutRef = useRef<number | null>(null);

    // Toast helper needs to be available before the save effect
    const addToast = (message: string, type: ToastType = 'info') => {
        const id = Date.now().toString() + Math.random().toString();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    // Save user data with debouncing (2s delay) to avoid blocking UI
    useEffect(() => {
        if (user && password) {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = window.setTimeout(() => {
                saveUserData(user, password).catch((e: Error) => {
                    console.error('Save failed:', e);
                    addToast(e.message || 'Failed to save data', 'error');
                });
            }, 2000);
        }
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [user, password]);

    const handleAuthenticated = (userData: UserData, pass: string) => {
        setUser(userData);
        setPassword(pass);
        setCurrentView('image-gen');
    };

    const handleLogout = () => {
        setUser(null);
        setPassword('');
        setCurrentView('auth');
    };

    // --- State Handlers ---

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const updateSettings = (newSettings: AppSettings) => {
        setUser(prev => {
            if (!prev) return null;
            return { ...prev, settings: newSettings };
        });
        addToast("Settings saved successfully.", "success");
    };

    const addToGallery = (item: GalleryItem) => {
        setUser(prev => {
            if (!prev) return null;
            return { ...prev, gallery: [item, ...prev.gallery] };
        });
    };

    const updateGalleryItem = (updatedItem: GalleryItem) => {
        setUser(prev => {
            if (!prev) return null;
            const newGallery = prev.gallery.map(i => i.id === updatedItem.id ? updatedItem : i);
            return { ...prev, gallery: newGallery };
        });
    };

    const deleteGalleryItem = (id: string) => {
        setUser(prev => {
            if (!prev) return null;
            const newGallery = prev.gallery.filter(i => i.id !== id);
            return { ...prev, gallery: newGallery };
        });
        addToast("Image deleted.", "info");
    };

    const updateChats = (newChats: ChatSession[]) => {
        setUser(prev => {
            if (!prev) return null;
            return { ...prev, chats: newChats };
        });
    };

    const handleEnhance = async (item: GalleryItem) => {
        setIsEnhancing(true);
        setEnhanceProgress(0);

        // Start fake progress
        if (progressInterval.current) clearInterval(progressInterval.current);
        progressInterval.current = window.setInterval(() => {
            setEnhanceProgress(prev => {
                if (prev >= 90) return prev; // Cap at 90%
                const increment = Math.random() * 5 + 1; // Random increment 1-6%
                return Math.min(90, prev + increment);
            });
        }, 500); // Update every 500ms

        try {
            const resultBlob = await upscaleImage({
                image: item.base64,
                scale: 1,
                enhance: true,
                enhanceCreativity: 0.5
            }, user?.settings.veniceApiKey);

            // Finish progress
            if (progressInterval.current) clearInterval(progressInterval.current);
            setEnhanceProgress(100);

            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = (reader.result as string).split(',')[1];
                const compressed = await compressImage(base64);

                const newItem: GalleryItem = {
                    ...item,
                    base64: compressed,
                    params: { ...item.params, enhanced: true },
                    id: item.id + '_enhanced'
                };

                addToGallery(newItem);
                setViewingItem(newItem); // Switch view to enhanced item
                addToast("Image enhanced successfully!", "success");

                setTimeout(() => {
                    setIsEnhancing(false);
                    setEnhanceProgress(0);
                }, 500);
            };
            reader.readAsDataURL(resultBlob);
        } catch (e: any) {
            console.error(e);
            if (progressInterval.current) clearInterval(progressInterval.current);
            setIsEnhancing(false);
            setEnhanceProgress(0);
            addToast(e.message || "Enhancement failed. Check API key.", "error");
        }
    };


    if (!user || currentView === 'auth') {
        return <AuthScreen onAuthenticated={handleAuthenticated} />;
    }

    // --- Main Layout ---

    return (
        <div className="flex min-h-screen bg-gray-900 text-white font-sans">
            {/* Sidebar Navigation */}
            <aside className="w-20 lg:w-64 bg-gray-800 border-r border-gray-700 flex flex-col items-center lg:items-stretch py-6 gap-2 z-10">
                <div className="mb-8 px-4 flex items-center justify-center lg:justify-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0 relative">
                        <span className="font-bold text-lg">{user.username.charAt(0).toUpperCase()}</span>
                        {user.username === 'dev' && (
                            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-gray-800">
                                <Code className="w-3 h-3 text-black" />
                            </div>
                        )}
                    </div>
                    <div className="hidden lg:block overflow-hidden">
                        <span className="font-bold truncate block">{user.username}</span>
                        {user.username === 'dev' && <span className="text-xs text-green-400 font-mono">DEV MODE</span>}
                    </div>
                </div>

                <nav className="flex-1 w-full space-y-1 px-2">
                    <NavButton
                        active={currentView === 'image-gen'}
                        onClick={() => setCurrentView('image-gen')}
                        icon={<Palette />}
                        label="Generator"
                    />
                    <NavButton
                        active={currentView === 'gallery'}
                        onClick={() => setCurrentView('gallery')}
                        icon={<Layers />}
                        label="Gallery"
                    />
                    <NavButton
                        active={currentView === 'chat'}
                        onClick={() => setCurrentView('chat')}
                        icon={<MessageSquare />}
                        label="Chat"
                    />
                    <NavButton
                        active={currentView === 'settings'}
                        onClick={() => setCurrentView('settings')}
                        icon={<SettingsIcon />}
                        label="Settings"
                    />
                </nav>

                <div className="mt-auto px-2">
                    <NavButton
                        active={false}
                        onClick={handleLogout}
                        icon={<LogOut className="text-red-400" />}
                        label="Log Out"
                        variant="danger"
                    />
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-4 lg:p-8 overflow-y-auto relative">
                <header className="mb-8 flex justify-between items-center">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                        {currentView === 'image-gen' && 'Studio'}
                        {currentView === 'gallery' && 'Vault'}
                        {currentView === 'chat' && 'Assistant'}
                        {currentView === 'settings' && 'Configuration'}
                    </h1>
                </header>

                <div className="animate-fadeIn">
                    {currentView === 'image-gen' && (
                        <ImageGenScreen
                            settings={user.settings}
                            recentItems={user.gallery}
                            onNewItem={addToGallery}
                            onUpdateItem={updateGalleryItem}
                            onViewItem={setViewingItem}
                            onAddToast={addToast}
                        />
                    )}

                    {currentView === 'gallery' && (
                        <Gallery
                            items={user.gallery}
                            onEnhance={handleEnhance}
                            onView={setViewingItem}
                        />
                    )}

                    {currentView === 'chat' && (
                        <ChatScreen
                            settings={user.settings}
                            chats={user.chats}
                            onUpdateChats={updateChats}
                        />
                    )}

                    {currentView === 'settings' && (
                        <SettingsScreen
                            settings={user.settings}
                            onSave={updateSettings}
                        />
                    )}
                </div>
            </main>

            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end pointer-events-none gap-2">
                {toasts.map(toast => (
                    <div key={toast.id} className="pointer-events-auto">
                        <Toast toast={toast} onClose={removeToast} />
                    </div>
                ))}
            </div>

            {/* View Modal */}
            {viewingItem && (
                <ImageViewer
                    item={viewingItem}
                    onClose={() => setViewingItem(null)}
                    onDelete={deleteGalleryItem}
                    onEnhance={handleEnhance}
                    isEnhancing={isEnhancing}
                    enhanceProgress={enhanceProgress}
                />
            )}
        </div>
    );
}

// Helper Nav Component
const NavButton = ({ active, onClick, icon, label, variant = 'default' }: any) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
            ${active
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
            }
            ${variant === 'danger' ? 'hover:bg-red-900/30 hover:text-red-400' : ''}
        `}
    >
        <div className="shrink-0">{icon}</div>
        <span className="hidden lg:block font-medium">{label}</span>
    </button>
);