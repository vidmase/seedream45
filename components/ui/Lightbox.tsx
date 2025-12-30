import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download, ChevronLeft, ChevronRight } from 'lucide-react';

interface LightboxProps {
    images: string[];
    initialIndex: number;
    isOpen: boolean;
    onClose: () => void;
    onDownload?: (url: string) => void;
}

export const Lightbox: React.FC<LightboxProps> = ({
    images,
    initialIndex,
    isOpen,
    onClose,
    onDownload
}) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setCurrentIndex(initialIndex);
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }, [initialIndex, isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            switch (e.key) {
                case 'Escape':
                    onClose();
                    break;
                case 'ArrowLeft':
                    prevImage();
                    break;
                case 'ArrowRight':
                    nextImage();
                    break;
                case '+':
                case '=':
                    zoomIn();
                    break;
                case '-':
                    zoomOut();
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, currentIndex]);

    // Prevent body scroll when lightbox is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const nextImage = () => {
        if (images.length > 1) {
            setCurrentIndex((prev) => (prev + 1) % images.length);
            resetZoom();
        }
    };

    const prevImage = () => {
        if (images.length > 1) {
            setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
            resetZoom();
        }
    };

    const zoomIn = () => setScale((s) => Math.min(s + 0.5, 5));
    const zoomOut = () => setScale((s) => Math.max(s - 0.5, 0.5));
    const resetZoom = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.2 : 0.2;
        setScale((s) => Math.min(Math.max(s + delta, 0.5), 5));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (scale > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && scale > 1) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => setIsDragging(false);

    // Touch handlers for mobile pinch-to-zoom
    const [touchDistance, setTouchDistance] = useState<number | null>(null);

    const getTouchDistance = (touches: React.TouchList) => {
        if (touches.length < 2) return null;
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            setTouchDistance(getTouchDistance(e.touches));
        } else if (e.touches.length === 1 && scale > 1) {
            setIsDragging(true);
            setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2 && touchDistance !== null) {
            const newDistance = getTouchDistance(e.touches);
            if (newDistance !== null) {
                const delta = (newDistance - touchDistance) * 0.01;
                setScale((s) => Math.min(Math.max(s + delta, 0.5), 5));
                setTouchDistance(newDistance);
            }
        } else if (e.touches.length === 1 && isDragging && scale > 1) {
            setPosition({
                x: e.touches[0].clientX - dragStart.x,
                y: e.touches[0].clientY - dragStart.y
            });
        }
    };

    const handleTouchEnd = () => {
        setTouchDistance(null);
        setIsDragging(false);
    };

    const handleDoubleClick = () => {
        if (scale === 1) {
            setScale(2);
        } else {
            resetZoom();
        }
    };

    if (!isOpen) return null;

    const currentImage = images[currentIndex];

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-200"
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110 backdrop-blur-md border border-white/10"
            >
                <X size={24} />
            </button>

            {/* Toolbar */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-surface/80 backdrop-blur-xl rounded-2xl px-4 py-2 border border-white/10 shadow-2xl">
                <button
                    onClick={zoomOut}
                    disabled={scale <= 0.5}
                    className="p-2 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                    title="Zoom Out (-)"
                >
                    <ZoomOut size={20} />
                </button>
                <span className="text-xs font-mono text-slate-400 w-12 text-center">{Math.round(scale * 100)}%</span>
                <button
                    onClick={zoomIn}
                    disabled={scale >= 5}
                    className="p-2 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                    title="Zoom In (+)"
                >
                    <ZoomIn size={20} />
                </button>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <button
                    onClick={resetZoom}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                    title="Reset Zoom"
                >
                    <RotateCcw size={18} />
                </button>
                {onDownload && (
                    <>
                        <div className="w-px h-6 bg-white/10 mx-1" />
                        <button
                            onClick={() => onDownload(currentImage)}
                            className="p-2 text-slate-400 hover:text-primary transition-colors"
                            title="Download"
                        >
                            <Download size={18} />
                        </button>
                    </>
                )}
            </div>

            {/* Image Container */}
            <div
                className="w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onDoubleClick={handleDoubleClick}
            >
                <img
                    src={currentImage}
                    alt="Fullscreen view"
                    className="max-w-none select-none transition-transform duration-100"
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        maxHeight: scale === 1 ? '90vh' : 'none',
                        maxWidth: scale === 1 ? '90vw' : 'none',
                    }}
                    draggable={false}
                />
            </div>

            {/* Navigation Arrows */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={prevImage}
                        className="absolute left-6 top-1/2 -translate-y-1/2 z-50 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110 backdrop-blur-md border border-white/10"
                    >
                        <ChevronLeft size={28} />
                    </button>
                    <button
                        onClick={nextImage}
                        className="absolute right-6 top-1/2 -translate-y-1/2 z-50 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110 backdrop-blur-md border border-white/10"
                    >
                        <ChevronRight size={28} />
                    </button>
                </>
            )}

            {/* Image Counter */}
            {images.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-surface/80 backdrop-blur-xl rounded-full px-4 py-2 border border-white/10">
                    <span className="text-sm font-bold text-white">{currentIndex + 1}</span>
                    <span className="text-slate-500 mx-1">/</span>
                    <span className="text-sm text-slate-400">{images.length}</span>
                </div>
            )}

            {/* Hint */}
            <div className="absolute bottom-6 right-6 text-[10px] text-slate-600 uppercase tracking-widest">
                Double-click to zoom • Scroll to adjust • Drag to pan
            </div>
        </div>
    );
};
