/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import { generateImageFromPrompt } from '../services/geminiService';
import Spinner from '../components/Spinner';

type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

const ImageGeneratorPage: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    const handleGenerateImage = useCallback(async (event: React.FormEvent) => {
        event.preventDefault();
        if (!prompt.trim()) {
            setError("Please enter a prompt to generate an image.");
            return;
        }

        setLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const imageB64 = await generateImageFromPrompt(prompt, aspectRatio);
            const imageUrl = `data:image/jpeg;base64,${imageB64}`;
            setGeneratedImage(imageUrl);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [prompt, aspectRatio]);
    
    const handleDownloadImage = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        const safePrompt = prompt.substring(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.download = `generated-image-${safePrompt}.jpeg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <div className="w-full max-w-4xl mx-auto animate-fade-in">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-800">AI Image Generator</h1>
                    <p className="text-slate-500 mt-2">Create stunning visuals for your notes and presentations with a simple text prompt.</p>
                </div>

                <form onSubmit={handleGenerateImage} className="space-y-6">
                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-slate-700 mb-1">
                            Your Prompt
                        </label>
                        <textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., A photorealistic image of a cat wearing a tiny business suit, working on a laptop"
                            className="w-full h-24 p-3 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            disabled={loading}
                        />
                    </div>
                    <div>
                         <label htmlFor="aspectRatio" className="block text-sm font-medium text-slate-700 mb-1">
                            Aspect Ratio
                        </label>
                        <select
                            id="aspectRatio"
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                            className="w-full p-3 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                            disabled={loading}
                        >
                            <option value="1:1">Square (1:1)</option>
                            <option value="16:9">Widescreen (16:9)</option>
                            <option value="9:16">Portrait (9:16)</option>
                            <option value="4:3">Landscape (4:3)</option>
                            <option value="3:4">Tall (3:4)</option>
                        </select>
                    </div>
                     <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
                        >
                            {loading ? <Spinner /> : 'Generate Image'}
                        </button>
                    </div>
                </form>

                {error && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
                        {error}
                    </div>
                )}

                <div className="mt-8">
                    <div className="w-full aspect-video bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
                        {loading && (
                             <div className="text-center flex flex-col items-center">
                                <Spinner className="text-slate-500" />
                                <p className="mt-2 text-slate-500">Generating your masterpiece...</p>
                            </div>
                        )}
                        {generatedImage && !loading && (
                            <img src={generatedImage} alt={prompt} className="w-full h-full object-contain" />
                        )}
                         {!generatedImage && !loading && (
                            <div className="text-center text-slate-500">
                                <p>Your generated image will appear here.</p>
                            </div>
                        )}
                    </div>
                     {generatedImage && !loading && (
                        <div className="mt-4 text-center">
                            <button
                                onClick={handleDownloadImage}
                                className="bg-white hover:bg-slate-100 text-slate-700 font-bold py-2 px-4 rounded-lg transition-colors shadow-sm border border-slate-300"
                            >
                                Download Image
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageGeneratorPage;