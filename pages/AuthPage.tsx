/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import Spinner from '../components/Spinner';

type AuthMode = 'signin' | 'signup' | 'forgot_password';

const logoUrl = "data:image/svg+xml,%3csvg width='300' height='60' viewBox='0 0 300 60' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cstyle%3e.heavy { font: 800 36px 'Inter', sans-serif; } .light { font: 500 36px 'Inter', sans-serif; }%3c/style%3e%3cdefs%3e%3clinearGradient id='icon-gradient' x1='0' y1='0' x2='48' y2='48'%3e%3cstop stop-color='%233B82F6'/%3e%3cstop offset='1' stop-color='%236366F1'/%3e%3c/linearGradient%3e%3c/defs%3e%3cpath d='M36 4H12C9.79 4 8 5.79 8 8V44C8 46.21 9.79 48 12 48H40C42.21 48 44 46.21 44 44V16L36 4ZM34 40H18V36H34V40ZM34 32H18V28H34V32ZM32 20H18V16H32V20Z' fill='url(%23icon-gradient)'/%3e%3cpath d='M34 16V6L44 16H34Z' fill='%23A5B4FC'/%3e%3ctext x='60' y='42' fill='%231E293B' class='heavy'%3eAiMEET%3c/text%3e%3ctext x='195' y='42' fill='%23475569' class='light'%3eNOTES%3c/text%3e%3c/svg%3e";

const AuthPage: React.FC = () => {
    const [mode, setMode] = useState<AuthMode>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const switchMode = (newMode: AuthMode) => {
        setEmail('');
        setPassword('');
        setError(null);
        setMessage(null);
        setMode(newMode);
    };

    const handleAuthAction = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setMessage('Check your email for the confirmation link!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                // Redirect will be handled by the App component's auth listener
            }
        } catch (err: any) {
            setError(err.error_description || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) throw error;
            setMessage('Check your email for the password reset link!');
        } catch (err: any) {
            setError(err.error_description || err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const renderForm = () => {
        if (mode === 'forgot_password') {
             return (
                <form onSubmit={handlePasswordReset}>
                    <div className="space-y-6">
                        <div>
                             <p className="text-center text-sm text-slate-600 mb-4">
                                Enter your email and we'll send you a link to reset your password.
                            </p>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                                Email address
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                            >
                                {loading ? <Spinner /> : 'Send Reset Link'}
                            </button>
                        </div>
                    </div>
                </form>
            );
        }
        
        // Sign In or Sign Up Form
        return (
             <form onSubmit={handleAuthAction}>
                <div className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                            Email address
                        </label>
                        <div className="mt-1">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password"  className="block text-sm font-medium text-slate-700">
                            Password
                        </label>
                        <div className="mt-1">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                         {mode === 'signup' && <p className="mt-2 text-xs text-slate-500">Password should be at least 6 characters.</p>}
                         {mode === 'signin' && (
                            <div className="text-right mt-2">
                               <button 
                                  type="button" 
                                  onClick={() => switchMode('forgot_password')} 
                                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                                >
                                    Forgot your password?
                                </button>
                            </div>
                         )}
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                        >
                            {loading ? <Spinner /> : (mode === 'signin' ? 'Sign In' : 'Sign Up')}
                        </button>
                    </div>
                </div>
            </form>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl p-8 border border-slate-200">
                <div className="mb-8 text-center">
                    <img 
                        src={logoUrl} 
                        alt="AiMEET NOTES Logo"
                        className="mx-auto w-48 mb-4"
                    />
                </div>
                 { mode !== 'forgot_password' ? (
                     <div className="mb-8">
                        <div className="flex border-b border-slate-200">
                            <button 
                                onClick={() => switchMode('signin')}
                                className={`w-1/2 py-4 text-center font-semibold transition-colors ${mode === 'signin' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Sign In
                            </button>
                            <button 
                                onClick={() => switchMode('signup')}
                                 className={`w-1/2 py-4 text-center font-semibold transition-colors ${mode === 'signup' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Sign Up
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="mb-8 text-center">
                        <h2 className="text-xl font-bold text-slate-800">Reset Your Password</h2>
                    </div>
                )}


                {renderForm()}

                {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
                        {error}
                    </div>
                )}
                 {message && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-md">
                        {message}
                    </div>
                )}
                
                {mode === 'forgot_password' && !message && (
                    <div className="mt-6 text-center">
                         <button 
                            type="button" 
                            onClick={() => switchMode('signin')} 
                            className="text-sm font-medium text-slate-600 hover:text-slate-500"
                          >
                            &larr; Back to Sign In
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthPage;