import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ImageFile {
  id: string;
  fileName: string;
  fileType: string;
}

interface ImageGalleryModalProps {
  files: ImageFile[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (fileId: string, fileName: string) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export function ImageGalleryModal({
  files,
  currentIndex,
  isOpen,
  onClose,
  onDownload,
}: ImageGalleryModalProps) {
  const [index, setIndex] = useState(currentIndex);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    setIndex(currentIndex);
    setZoom(1);
    setLoading(true);
  }, [currentIndex, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, index]);

  if (!isOpen || files.length === 0) return null;

  const currentFile = files[index];
  const imageUrl = `${API_URL}/files/${currentFile.id}/preview`;

  const goToPrev = () => {
    setIndex((prev) => (prev === 0 ? files.length - 1 : prev - 1));
    setZoom(1);
    setLoading(true);
  };

  const goToNext = () => {
    setIndex((prev) => (prev === files.length - 1 ? 0 : prev + 1));
    setZoom(1);
    setLoading(true);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50">
        <div className="flex items-center gap-3">
          <span className="text-white text-sm">
            {index + 1} / {files.length}
          </span>
          <span className="text-white/60 text-sm truncate max-w-[300px]">
            {currentFile.fileName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            title={t('viewer3d.zoomOutBtn')}
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-white text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            title={t('viewer3d.zoomInBtn')}
          >
            <ZoomIn size={18} />
          </button>

          {/* Download */}
          <button
            onClick={() => onDownload(currentFile.id, currentFile.fileName)}
            className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            title={t('viewer3d.downloadBtn')}
          >
            <Download size={18} />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 text-white hover:bg-red-500/80 transition-colors"
            title={t('viewer3d.closeEsc')}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Image Container */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* Navigation arrows */}
        {files.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
              title={t('viewer3d.previousArrow')}
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
              title={t('viewer3d.nextArrow')}
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Loading spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Image */}
        <img
          src={imageUrl}
          alt={currentFile.fileName}
          className="max-w-full max-h-full object-contain transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
          onLoad={() => setLoading(false)}
        />
      </div>

      {/* Thumbnails */}
      {files.length > 1 && (
        <div className="px-4 py-3 bg-black/50 flex gap-2 overflow-x-auto">
          {files.map((file, i) => (
            <button
              key={file.id}
              onClick={() => {
                setIndex(i);
                setZoom(1);
                setLoading(true);
              }}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                i === index ? 'border-card-teal' : 'border-transparent hover:border-white/30'
              }`}
            >
              <img
                src={`${API_URL}/files/${file.id}/preview`}
                alt={file.fileName}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Instructions */}
      <div className="px-4 py-2 bg-black/50 text-white/40 text-xs text-center">
        {t('viewer3d.galleryInstructions')}
      </div>
    </div>
  );
}

export default ImageGalleryModal;
