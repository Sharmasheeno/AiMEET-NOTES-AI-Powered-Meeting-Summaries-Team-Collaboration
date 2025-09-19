/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import Spinner from '../components/Spinner';
import { generateImageFromPrompt } from '../services/geminiService';

type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

const aspectRatios: { value: AspectRatio; label: string }[] = [
    { value: '1:1', label: 'Square' },
    { value: '16:9', label: 'Widescreen' },
    { value: '9:16', label: 'Portrait' },
    { value: '4:3', label: 'Landscape' },
    { value: '3:4', label: 'Tall' },
];

const ImageGeneratorPage: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError("Please enter a prompt to generate an image.");
            return;
        }

        setLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const resultB64 = await generateImageFromPrompt(prompt, aspectRatio);
            setGeneratedImage(`data:image/jpeg;base64,${resultB64}`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during image generation.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const isGenerateDisabled = loading || !prompt.trim();

    return (
        <div className="w-full max-w-4xl mx-auto animate-fade-in space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-extrabold text-zinc-800">AI Image Generator</h1>
                <p className="text-zinc-500 mt-2 max-w-2xl mx-auto">Describe any image you can imagine, and our AI will bring it to life.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg border border-zinc-200 space-y-6">
                <div>
                    <label htmlFor="image-prompt" className="block text-lg font-bold text-zinc-800 mb-2">
                        Your Prompt
                    </label>
                    <textarea
                        id="image-prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., A photo of a raccoon wearing a tiny trench coat and holding a magnifying glass, cinematic lighting."
                        className="w-full p-3 border-2 border-zinc-300 rounded-lg text-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow h-28"
                        aria-label="Describe the image you want to generate"
                    />
                </div>

                <div>
                    <label className="block text-lg font-bold text-zinc-800 mb-3">
                        Aspect Ratio
                    </label>
                    <div className="flex flex-wrap gap-3">
                        {aspectRatios.map(({ value, label }) => (
                            <button
                                key={value}
                                onClick={() => setAspectRatio(value)}
                                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                                    aspectRatio === value 
                                        ? 'bg-blue-600 text-white shadow' 
                                        : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
                                }`}
                            >
                                {label} ({value})
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerateDisabled}
                        className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                    >
                        {loading ? <Spinner /> : '✨ Generate Image'}
                    </button>
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
                            {error}
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full aspect-video bg-zinc-100 border-2 border-dashed border-zinc-300 rounded-lg flex items-center justify-center overflow-hidden relative">
                {loading && (
                     <div className="text-center flex flex-col items-center">
                        <Spinner className="text-zinc-500" />
                        <p className="mt-2 text-zinc-500">Generating your masterpiece...</p>
                    </div>
                )}
                {generatedImage && !loading && (
                    <img src={generatedImage} alt="Generated image based on prompt" className="w-full h-full object-contain" />
                )}
                {!generatedImage && !loading && (
                    <div className="text-center text-zinc-500">
                        <p>Your generated image will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageGeneratorPage;
