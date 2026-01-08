import React, { useState, useEffect } from 'react';
import { UserData } from '../types';
import { loginUser, registerUser, getRegisteredUsers, getLastUser, setLastUser, DEV_USER } from '../services/secureStorage';
import { Button } from './Button';
import { Lock, AlertCircle, User as UserIcon } from 'lucide-react';

interface AuthScreenProps {
    onAuthenticated: (userData: UserData, password: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const knownUsers = getRegisteredUsers();

    // Memory: Load last user on mount
    useEffect(() => {
        const lastUser = getLastUser();
        if (lastUser && knownUsers.includes(lastUser)) {
            setUsername(lastUser);
        } else if (knownUsers.length > 0) {
            setUsername(knownUsers[0]);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        
        // Small delay to prevent UI freezing immediately during crypto ops
        await new Promise(r => setTimeout(r, 100));

        try {
            // DEV MODE CHECK
            if (username === 'dev' && password === 'dev') {
                onAuthenticated(DEV_USER, 'dev');
                return;
            }

            if (mode === 'register') {
                const user = await registerUser(username, password);
                setLastUser(username);
                onAuthenticated(user, password);
            } else {
                const user = await loginUser(username, password);
                setLastUser(username);
                onAuthenticated(user, password);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 w-full max-w-md animate-fadeIn">
                <div className="text-center mb-8">
                    <div className="bg-orange-600/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-orange-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Venice Studio</h1>
                    <p className="text-slate-400">Secure, localized AI workspace.</p>
                </div>

                {error && (
                    <div className="bg-red-900/30 border border-red-500 text-red-200 p-3 rounded-xl mb-6 flex items-center gap-2 text-sm">
                        <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                list="known-users"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-xl p-3 pl-10 text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                placeholder="Enter username"
                                required
                                autoComplete="off"
                            />
                            <UserIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                            <datalist id="known-users">
                                {knownUsers.map(u => <option key={u} value={u} />)}
                            </datalist>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-xl p-3 text-white focus:ring-2 focus:ring-orange-500 outline-none"
                            placeholder="Enter password"
                            required
                        />
                    </div>

                    <Button variant="primary" className="w-full py-3 text-lg mt-4" isLoading={loading}>
                        {mode === 'login' ? 'Unlock Vault' : 'Create Vault'}
                    </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-slate-700 text-center">
                    {mode === 'login' ? (
                        <p className="text-slate-400 text-sm">
                            New here? <button onClick={() => { setMode('register'); setUsername(''); }} className="text-orange-400 hover:text-orange-300 font-semibold ml-1">Create User</button>
                        </p>
                    ) : (
                        <p className="text-slate-400 text-sm">
                            Already exist? <button onClick={() => { setMode('login'); setUsername(''); }} className="text-orange-400 hover:text-orange-300 font-semibold ml-1">Login</button>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};