/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import ImageUploader from '../components/ImageUploader';
import ProductSelector from '../components/ProductSelector';
import AddProductModal from '../components/AddProductModal';
import DebugModal from '../components/DebugModal';
import TouchGhost from '../components/TouchGhost';
import Spinner from '../components/Spinner';
import { Product } from '../types';
import { placeObjectInScene } from '../services/geminiService';

// Pre-defined list of products
const defaultProducts: Product[] = [
    { id: 1, name: 'Modern Yellow Sofa', imageUrl: 'https://storage.googleapis.com/maker-suite-media/prompter-demos/product-photography/sofa.png' },
    { id: 2, name: 'Classic Wooden Chair', imageUrl: 'https://storage.googleapis.com/maker-suite-media/prompter-demos/product-photography/chair.png' },
    { id: 3, name: 'Potted Plant', imageUrl: 'https://storage.googleapis.com/maker-suite-media/prompter-demos/product-photography/plant.png' },
    { id: 4, name: 'Floor Lamp', imageUrl: 'https://storage.googleapis.com/maker-suite-media/prompter-demos/product-photography/lamp.png' },
];

const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const ImageGeneratorPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>(defaultProducts);
    const [sceneFile, setSceneFile] = useState<File | null>(null);
    const [sceneUrl, setSceneUrl] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    
    const [placementCoords, setPlacementCoords] = useState<{ x: number; y: number; xPercent: number; yPercent: number; } | null>(null);
    const [isAddProductModalOpen, setAddProductModalOpen] = useState(false);
    const [isDebugging, setIsDebugging] = useState(false);
    
    const [isDragging, setIsDragging] = useState(false);
    const [touchGhostPos, setTouchGhostPos] = useState<{ x: number, y: number } | null>(null);
    const [isTouchHoveringDropZone, setIsTouchHoveringDropZone] = useState(false);
    const [touchOrbPosition, setTouchOrbPosition] = useState<{ x: number, y: number } | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [finalPrompt, setFinalPrompt] = useState<string | null>(null);
    const [markedSceneUrl, setMarkedSceneUrl] = useState<string | null>(null);

    const sceneImageRef = useRef<HTMLImageElement>(null);
    const draggedProductRef = useRef<Product | null>(null);

    useEffect(() => {
        setPlacementCoords(null);
    }, [sceneFile, selectedProduct]);

    const handleSceneSelect = async (file: File) => {
        setSceneFile(file);
        setGeneratedImage(null);
        setError(null);
        try {
            const url = await fileToDataURL(file);
            setSceneUrl(url);
        } catch {
            setError('Could not read the selected scene file.');
        }
    };
    
    const handleAddOwnProduct = (file: File) => {
        const newProduct: Product = {
            id: `custom-${Date.now()}`,
            name: file.name.split('.').slice(0, -1).join('.') || 'Custom Product',
            imageUrl: URL.createObjectURL(file),
        };
        setProducts(prev => [...prev, newProduct]);
        setSelectedProduct(newProduct);
        setAddProductModalOpen(false);
    };

    const handleProductDrop = (
        position: { x: number, y: number }, 
        relativePosition: { xPercent: number; yPercent: number; }
    ) => {
        setPlacementCoords({ ...position, ...relativePosition });
    };

    const createMarkedScene = (): Promise<string> => {
        return new Promise((resolve, reject) => {
            if (!sceneUrl || !placementCoords) {
                return reject(new Error("Missing scene or placement coordinates."));
            }
            
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error("Could not get canvas context."));

                ctx.drawImage(img, 0, 0);

                const markerX = (placementCoords.xPercent / 100) * img.naturalWidth;
                const markerY = (placementCoords.yPercent / 100) * img.naturalHeight;

                ctx.beginPath();
                ctx.arc(markerX, markerY, Math.min(img.naturalWidth, img.naturalHeight) * 0.01, 0, 2 * Math.PI, false);
                ctx.fillStyle = 'red';
                ctx.fill();
                
                const dataUrl = canvas.toDataURL('image/png');
                setMarkedSceneUrl(dataUrl);
                resolve(dataUrl);
            };
            img.onerror = () => reject(new Error("Failed to load scene image onto canvas."));
            img.src = sceneUrl;
        });
    };

    const handleGenerate = async () => {
        if (!sceneFile || !selectedProduct || !placementCoords) {
            setError("Please upload a scene, select a product, and place it in the scene.");
            return;
        }

        setLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const markedScene = await createMarkedScene();
            const prompt = `Taking the user-provided scene with a red marker and the separate user-provided product image, realistically place the product into the scene at the location of the red marker. The marker indicates the center of where the product should be placed. Adjust the product for lighting, shadows, and perspective to match the scene. Do not show the red marker in the final output.`;
            setFinalPrompt(prompt);

            const resultB64 = await placeObjectInScene(markedScene, selectedProduct.imageUrl, prompt);
            setGeneratedImage(`data:image/png;base64,${resultB64}`);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during image generation.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };
    
    const handleTouchStart = (e: React.TouchEvent, product: Product) => {
        draggedProductRef.current = product;
        setIsDragging(true);
        setTouchGhostPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        setTouchGhostPos({ x: touch.clientX, y: touch.clientY });

        const dropZone = document.elementFromPoint(touch.clientX, touch.clientY);
        if (dropZone && dropZone.getAttribute('data-dropzone-id') === 'scene-dropzone') {
            setIsTouchHoveringDropZone(true);
            const rect = dropZone.getBoundingClientRect();
            setTouchOrbPosition({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
        } else {
            setIsTouchHoveringDropZone(false);
            setTouchOrbPosition(null);
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!isDragging || !draggedProductRef.current) return;
        setIsDragging(false);
        setTouchGhostPos(null);
        setTouchOrbPosition(null);
        setIsTouchHoveringDropZone(false);

        const touch = e.changedTouches[0];
        const dropZoneEl = document.elementFromPoint(touch.clientX, touch.clientY);

        if (dropZoneEl && dropZoneEl.getAttribute('data-dropzone-id') === 'scene-dropzone' && sceneImageRef.current) {
            const img = sceneImageRef.current;
            const containerRect = dropZoneEl.getBoundingClientRect();
            const { naturalWidth, naturalHeight } = img;
            const { width: containerWidth, height: containerHeight } = containerRect;

            const imageAspectRatio = naturalWidth / naturalHeight;
            const containerAspectRatio = containerWidth / containerHeight;
            let renderedWidth, renderedHeight;
            if (imageAspectRatio > containerAspectRatio) {
              renderedWidth = containerWidth;
              renderedHeight = containerWidth / imageAspectRatio;
            } else {
              renderedHeight = containerHeight;
              renderedWidth = containerHeight * imageAspectRatio;
            }
            const offsetX = (containerWidth - renderedWidth) / 2;
            const offsetY = (containerHeight - renderedHeight) / 2;
            const pointX = touch.clientX - containerRect.left;
            const pointY = touch.clientY - containerRect.top;
            const imageX = pointX - offsetX;
            const imageY = pointY - offsetY;

            if (imageX >= 0 && imageX <= renderedWidth && imageY >= 0 && imageY <= renderedHeight) {
                const xPercent = (imageX / renderedWidth) * 100;
                const yPercent = (imageY / renderedHeight) * 100;
                setPlacementCoords({ x: pointX, y: pointY, xPercent, yPercent });
            }
        }
        draggedProductRef.current = null;
    };


    const isGenerateDisabled = loading || !sceneFile || !selectedProduct || !placementCoords;

    return (
        <div 
            className="w-full max-w-6xl mx-auto animate-fade-in space-y-8"
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <TouchGhost imageUrl={isDragging ? draggedProductRef.current?.imageUrl || null : null} position={touchGhostPos} />
            <AddProductModal 
                isOpen={isAddProductModalOpen}
                onClose={() => setAddProductModalOpen(false)}
                onFileSelect={handleAddOwnProduct}
            />
            <DebugModal
                isOpen={isDebugging}
                onClose={() => setIsDebugging(false)}
                imageUrl={markedSceneUrl}
                prompt={finalPrompt}
            />

            <div className="text-center">
                <h1 className="text-3xl font-extrabold text-zinc-800">AI Product Placement</h1>
                <p className="text-zinc-500 mt-2 max-w-2xl mx-auto">Upload a scene, pick a product, and place it anywhere. Our AI will blend it in realistically.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="space-y-8">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-800 mb-2">1. Upload Your Scene</h2>
                        <ImageUploader 
                            id="scene-dropzone"
                            onFileSelect={handleSceneSelect}
                            imageUrl={sceneUrl}
                            isDropZone={!!sceneUrl && !!selectedProduct}
                            onProductDrop={handleProductDrop}
                            persistedOrbPosition={placementCoords}
                            ref={sceneImageRef}
                            isTouchHovering={isTouchHoveringDropZone}
                            touchOrbPosition={touchOrbPosition}
                        />
                         {sceneUrl && !selectedProduct && (
                            <p className="text-center text-sm text-zinc-500 mt-2">Now select a product below to place it in the scene!</p>
                        )}
                        {sceneUrl && selectedProduct && !placementCoords && (
                             <p className="text-center text-sm text-zinc-500 mt-2">Now click or drop the selected product onto your scene!</p>
                        )}
                    </div>
                     <div>
                        <h2 className="text-xl font-bold text-zinc-800 mb-2">2. Select a Product</h2>
                        <div 
                            onTouchStart={(e) => {
                                const target = e.target as HTMLElement;
                                const card = target.closest('[data-product-id]');
                                if (card) {
                                    const productId = card.getAttribute('data-product-id');
                                    const product = products.find(p => p.id.toString() === productId);
                                    if(product) {
                                        setSelectedProduct(product);
                                        handleTouchStart(e, product)
                                    };
                                }
                            }}
                        >
                            <ProductSelector
                                products={products}
                                selectedProduct={selectedProduct}
                                onSelect={setSelectedProduct}
                                onAddOwnProductClick={() => setAddProductModalOpen(true)}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6 sticky top-8">
                     <h2 className="text-xl font-bold text-zinc-800 mb-2">3. Generate Your Image</h2>
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-zinc-200">
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

                    <div className="w-full aspect-video bg-zinc-100 border-2 border-dashed border-zinc-300 rounded-lg flex items-center justify-center overflow-hidden relative">
                        {loading && (
                             <div className="text-center flex flex-col items-center">
                                <Spinner className="text-zinc-500" />
                                <p className="mt-2 text-zinc-500">Generating your masterpiece...</p>
                            </div>
                        )}
                        {generatedImage && !loading && (
                            <>
                                <img src={`data:image/png;base64,${generatedImage}`} alt="Generated scene with product" className="w-full h-full object-contain" />
                                <button
                                    onClick={() => setIsDebugging(true)}
                                    className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-opacity-80 transition-all z-10 shadow-lg"
                                >
                                    Debug
                                </button>
                            </>
                        )}
                         {!generatedImage && !loading && (
                            <div className="text-center text-zinc-500">
                                <p>Your generated image will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageGeneratorPage;
