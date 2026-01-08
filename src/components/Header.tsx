import React from 'react';

interface HeaderProps {
    userId?: string;
}

export const Header: React.FC<HeaderProps> = ({ userId }) => {
    return (
        <header className="text-center mb-8 animate-fadeIn">
            <div className="relative inline-block">
                <img 
                    src="https://preview.redd.it/73z6v668xffc1.jpeg?width=1055&format=pjpg&auto=webp&s=b15ae1f6d53d93bf004d8bbff24d5135026bbd2d" 
                    alt="App Logo" 
                    className="mx-auto h-24 w-24 rounded-full mb-4 object-cover border-4 border-slate-700 shadow-2xl hover:scale-105 transition-transform duration-300" 
                />
                <div className="absolute bottom-4 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-800"></div>
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">
                Venice.ai Image Studio
            </h1>
            <p className="text-slate-400 mt-2 max-w-lg mx-auto text-lg">
                Uncensored, raw image generation and enhancement with persistent history.
            </p>
            <div className="mt-4 text-sm text-slate-500 font-mono">
                {userId ? `User ID: ${userId}` : 'Connecting...'}
            </div>
        </header>
    );
};