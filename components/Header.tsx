/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';

interface HeaderProps {
    session: Session | null;
    currentView: string;
    onNavigateToNoteTaker: () => void;
    onNavigateToHistory: () => void;
    onNavigateToImageGenerator: () => void;
}

const logoUrl = "data:image/svg+xml,%3csvg width='300' height='60' viewBox='0 0 300 60' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cstyle%3e.heavy { font: 800 36px 'Inter', sans-serif; } .light { font: 500 36px 'Inter', sans-serif; }%3c/style%3e%3cdefs%3e%3clinearGradient id='icon-gradient' x1='0' y1='0' x2='48' y2='48'%3e%3cstop stop-color='%233B82F6'/%3e%3cstop offset='1' stop-color='%236366F1'/%3e%3c/linearGradient%3e%3c/defs%3e%3cpath d='M36 4H12C9.79 4 8 5.79 8 8V44C8 46.21 9.79 48 12 48H40C42.21 48 44 46.21 44 44V16L36 4ZM34 40H18V36H34V40ZM34 32H18V28H34V32ZM32 20H18V16H32V20Z' fill='url(%23icon-gradient)'/%3e%3cpath d='M34 16V6L44 16H34Z' fill='%23A5B4FC'/%3e%3ctext x='60' y='42' fill='%231E293B' class='heavy'%3eAiMEET%3c/text%3e%3ctext x='195' y='42' fill='%23475569' class='light'%3eNOTES%3c/text%3e%3c/svg%3e";

const Header: React.FC<HeaderProps> = ({ session, currentView, onNavigateToNoteTaker, onNavigateToHistory, onNavigateToImageGenerator }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getNavButtonClasses = (viewName: string) => {
        const active = currentView === viewName || (viewName === 'history' && currentView === 'note_detail');
        return `px-6 py-3 font-semibold text-center transition-colors ${active ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`;
    }

  return (
    <header className="w-full max-w-6xl mx-auto mb-12">
        <div className="relative flex justify-center items-center">
             <img 
                src={logoUrl} 
                alt="AiMEET NOTES Logo"
                className="mx-auto w-64 md:w-72"
            />
            {session && (
                <div className="absolute top-1/2 -translate-y-1/2 right-0" ref={dropdownRef}>
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center space-x-2 bg-white border border-slate-300 rounded-full p-2 hover:bg-slate-100 transition-colors"
                    >
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {session.user?.email?.[0].toUpperCase()}
                        </div>
                    </button>
                    {dropdownOpen && (
                        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 animate-fade-in">
                            <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                <div className="px-4 py-2 text-sm text-slate-700 border-b">
                                    <p className="font-semibold">Signed in as</p>
                                    <p className="truncate">{session.user.email}</p>
                                </div>
                                <button
                                    onClick={handleSignOut}
                                    className="w-full text-left block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                                    role="menuitem"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
        
        {session && (
            <nav className="mt-6">
                <div className="flex justify-center border-b border-slate-200">
                    <button onClick={onNavigateToNoteTaker} className={getNavButtonClasses('note_taker')}>
                        Note Taker
                    </button>
                    <button onClick={onNavigateToHistory} className={getNavButtonClasses('history')}>
                        History
                    </button>
                     <button onClick={onNavigateToImageGenerator} className={getNavButtonClasses('image_generator')}>
                        Image Generator
                    </button>
                </div>
            </nav>
        )}
    </header>
  );
};

export default Header;