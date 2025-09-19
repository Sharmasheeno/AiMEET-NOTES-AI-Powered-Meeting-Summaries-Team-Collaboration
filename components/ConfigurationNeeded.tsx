/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

const ConfigurationNeeded: React.FC = () => {
    return (
        <div className="w-full max-w-2xl mx-auto text-center bg-white p-8 rounded-xl shadow-lg border border-yellow-300">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Configuration Required</h1>
            <p className="text-slate-600 mb-6">
                This application requires a connection to a Supabase backend, but the necessary environment variables are missing.
            </p>
            <div className="text-left bg-slate-50 p-4 rounded-lg border">
                <p className="font-semibold text-slate-700">To fix this, please:</p>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-slate-600">
                    <li>Create a project on <a href="https://supabase.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Supabase</a>.</li>
                    <li>Find your Project URL and anon Key in the API settings.</li>
                    <li>Set them as environment variables named <code className="bg-slate-200 text-sm px-1 rounded">SUPABASE_URL</code> and <code className="bg-slate-200 text-sm px-1 rounded">SUPABASE_ANON_KEY</code>.</li>
                    <li>Refresh the application.</li>
                </ol>
            </div>
        </div>
    );
};

export default ConfigurationNeeded;
