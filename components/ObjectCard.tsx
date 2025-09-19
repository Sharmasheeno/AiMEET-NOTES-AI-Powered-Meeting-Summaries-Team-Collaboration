/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { Product } from '../types';

interface ObjectCardProps {
    product: Product;
    isSelected: boolean;
    onClick?: () => void;
    onTouchStart?: (e: React.TouchEvent) => void;
}

const ObjectCard: React.FC<ObjectCardProps> = ({ product, isSelected, onClick, onTouchStart }) => {
    const cardClasses = `
        bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 relative group h-full flex flex-col
        ${onClick ? 'cursor-grab' : ''}
        ${isSelected ? 'border-2 border-blue-500 shadow-xl scale-105' : 'border border-zinc-200 hover:shadow-xl hover:scale-105'}
    `;
    
    const handleDragStart = (e: React.DragEvent) => {
        // We only store the product ID to keep the dataTransfer payload small
        e.dataTransfer.setData('application/json', JSON.stringify(product));
        e.dataTransfer.effectAllowed = 'move';
        // Select the item when dragging starts for immediate visual feedback
        onClick?.(); 
    };

    return (
        <div 
            className={cardClasses} 
            onClick={onClick}
            draggable={!!onClick}
            onDragStart={handleDragStart}
            onTouchStart={onTouchStart}
            data-product-id={product.id}
        >
            <div className="aspect-square w-full bg-zinc-100 flex items-center justify-center p-2 flex-grow">
                <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform" 
                    // Prevent browser's default image drag behavior
                    onDragStart={(e) => e.preventDefault()}
                />
            </div>
            <div className="p-3 text-center flex-shrink-0">
                <h4 className="text-sm font-semibold text-zinc-700 truncate">{product.name}</h4>
            </div>
        </div>
    );
};

export default ObjectCard;
