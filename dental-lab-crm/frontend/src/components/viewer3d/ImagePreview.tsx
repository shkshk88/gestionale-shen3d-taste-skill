import { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download, Eye } from 'lucide-react';

interface ImagePreviewProps {
  fileId: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ImagePreview({ fileId, fileName, isOpen, onClose }: ImagePreviewProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const imageUrl = `${API_BASE_URL}/files/${fileId}/preview`;

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setImageLoaded(false);
      setImageError(false);
    }
  }, [isOpen, fileId]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case '0':
          handleReset();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, scale]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.25, 5));
  };

  const handleZoomOut = () => {
    setScale(prev => {
      const newScale = Math.max(prev / 1.25, 0.5);
      // Reset position if zooming out to 1 or less
      if (newScale <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => {
      const newScale = Math.min(Math.max(prev * delta, 0.5), 5);
      if (newScale <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart, scale]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDoubleClick = () => {
    if (scale !== 1) {
      handleReset();
    } else {
      setScale(2);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full h-full max-w-7xl max-h-screen mx-auto flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-neutral-900/90 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Eye size={20} className="text-green-400" />
            </div>
            <div>
              <h3 className="text-white font-medium text-sm truncate max-w-[300px] sm:max-w-[400px]">
                {fileName}
              </h3>
              <p className="text-neutral-400 text-xs">
                Zoom: {Math.round(scale * 100)}% • Trascina per muovere • Doppio click per reset
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Image Container */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden bg-neutral-950 cursor-grab active:cursor-grabbing"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
        >
          {/* Loading State */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
                <p className="text-white/50 text-sm">Caricamento immagine...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-3">
                  <X size={32} className="text-red-400" />
                </div>
                <p className="text-white/70 font-medium">Errore caricamento</p>
                <p className="text-white/40 text-sm mt-1">Impossibile caricare l&apos;immagine</p>
              </div>
            </div>
          )}

          {/* Image */}
          <img
            ref={imageRef}
            src={imageUrl}
            alt={fileName}
            className="absolute top-1/2 left-1/2 max-w-none select-none"
            style={{
              transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
              opacity: imageLoaded ? 1 : 0,
              cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
            }}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(true);
            }}
            draggable={false}
          />

          {/* Zoom indicator overlay */}
          {scale !== 1 && (
            <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-white/80 text-xs font-mono">
              {Math.round(scale * 100)}%
            </div>
          )}
        </div>

        {/* Controls Footer */}
        <div className="px-6 py-4 bg-neutral-900/90 backdrop-blur-md border-t border-white/10">
          <div className="flex items-center justify-between">
            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors"
                title="Zoom out (-)"
              >
                <ZoomOut size={18} />
              </button>

              <button
                onClick={handleReset}
                className="px-4 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
                title="Reset (0)"
              >
                <RotateCcw size={16} className="inline mr-1.5" />
                Reset
              </button>

              <button
                onClick={handleZoomIn}
                disabled={scale >= 5}
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors"
                title="Zoom in (+)"
              >
                <ZoomIn size={18} />
              </button>

              <span className="ml-3 text-white/40 text-xs hidden sm:inline">
                Scroll per zoom • Trascina per muovere
              </span>
            </div>

            {/* Action Buttons */}
            <button
              onClick={handleDownload}
              className="px-4 h-10 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Scarica</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImagePreview;
