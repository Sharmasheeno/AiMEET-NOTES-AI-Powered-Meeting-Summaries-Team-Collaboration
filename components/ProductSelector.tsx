/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

interface ProductSelectorProps {
    productPrompt: string;
    onCustomPromptChange: (prompt: string) => void;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({ productPrompt, onCustomPromptChange }) => {
    return (
        <div className="w-full max-w-6xl mx-auto text-center animate-fade-in space-y-4">
            <div>
                <label htmlFor="product-prompt" className="block text-xl font-bold text-zinc-800 mb-2">
                    Describe The Product
                </label>
                <input
                    id="product-prompt"
                    type="text"
                    value={productPrompt}
                    onChange={(e) => onCustomPromptChange(e.target.value)}
                    placeholder="e.g., 'a futuristic chrome armchair'"
                    className="w-full max-w-lg mx-auto p-3 border-2 border-zinc-300 rounded-lg text-md text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                    aria-label="Describe the product to place in the scene"
                />
            </div>
        </div>
    );
};

export default ProductSelector;