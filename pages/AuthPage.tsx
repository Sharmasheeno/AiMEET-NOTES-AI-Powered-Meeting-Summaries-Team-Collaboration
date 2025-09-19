/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import Spinner from '../components/Spinner';

type AuthMode = 'signin' | 'signup';

const logoBase64 = "data:image/png;base64,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";

const AuthPage: React.FC = () => {
    const [mode, setMode] = useState<AuthMode>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

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

    return (
        <div className="w-full max-w-md mx-auto animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl p-8 border border-slate-200">
                <div className="mb-8 text-center">
                    <img 
                        src={logoBase64} 
                        alt="AiMEET NOTES Logo"
                        className="mx-auto w-48 mb-4"
                    />
                </div>
                <div className="mb-8">
                    <div className="flex border-b border-slate-200">
                        <button 
                            onClick={() => setMode('signin')}
                            className={`w-1/2 py-4 text-center font-semibold transition-colors ${mode === 'signin' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Sign In
                        </button>
                        <button 
                            onClick={() => setMode('signup')}
                             className={`w-1/2 py-4 text-center font-semibold transition-colors ${mode === 'signup' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Sign Up
                        </button>
                    </div>
                </div>

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

            </div>
        </div>
    );
};

export default AuthPage;