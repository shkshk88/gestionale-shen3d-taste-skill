import { useEffect } from 'react';
import { X, Box } from 'lucide-react';
import Dental3DViewer from './Dental3DViewer';

interface Viewer3DModalProps {
  fileId: string;
  fileName: string;
  fileType: 'stl' | 'ply';
  isOpen: boolean;
  onClose: () => void;
}

export function Viewer3DModal({ fileId, fileName, fileType, isOpen, onClose }: Viewer3DModalProps) {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  // For now, we use a single URL for the file
  // In a real scenario with upper/lower jaws, you'd need separate file IDs
  const fileUrl = `${API_BASE_URL}/files/${fileId}/preview`;

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

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full h-full max-w-7xl max-h-screen mx-auto flex flex-col p-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-neutral-900/90 backdrop-blur-md border-b border-white/10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Box size={20} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-medium text-sm truncate max-w-[300px] sm:max-w-[400px]">
                {fileName}
              </h3>
              <p className="text-neutral-400 text-xs">
                {fileType.toUpperCase()} • Visualizzatore 3D
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

        {/* 3D Viewer Container */}
        <div className="flex-1 relative bg-neutral-950 rounded-b-2xl overflow-hidden">
          <Dental3DViewer
            upperJawUrl={fileType === 'ply' ? fileUrl : undefined}
            caseId={fileId}
          />
        </div>
      </div>
    </div>
  );
}

export default Viewer3DModal;
