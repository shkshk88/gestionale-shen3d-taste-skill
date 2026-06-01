import { lazy, Suspense, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Box, Loader2 } from 'lucide-react';

// Lazy so Three.js only loads when a viewer modal is actually opened.
const Dental3DViewer = lazy(() => import('./Dental3DViewer'));
const Case3DViewer = lazy(() => import('./Case3DViewer'));

interface ModelFile {
  id: string;
  url: string;
  name: string;
}

interface Viewer3DModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  /** Load all 3D files of a case (preferred). */
  caseId?: string;
  /** Or pass explicit files directly. */
  files?: ModelFile[];
}

/**
 * Unified, minimal 3D viewer modal used across the app (orders list, case detail,
 * case form). Neutral header, no sidebar — multiple files are managed inside the
 * viewer's own control panel.
 */
export function Viewer3DModal({ isOpen, onClose, title, subtitle, caseId, files }: Viewer3DModalProps) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const fallback = (
    <div className="h-[500px] flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-neutral-400" />
    </div>
  );

  // Portal to body so the fixed overlay centers in the viewport regardless of any
  // transformed ancestor (otherwise it anchors to a long page and appears off-screen).
  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Minimal neutral header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-neutral-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
              <Box size={16} className="text-neutral-500" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-neutral-800 truncate" dir="auto">
                {title || 'Viewer 3D'}
              </h3>
              {subtitle && (
                <p className="text-xs text-neutral-400 truncate" dir="auto">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-500 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body — the viewer's own panel handles file selection/visibility/opacity */}
        <div className="bg-neutral-950">
          <Suspense fallback={fallback}>
            {caseId ? <Case3DViewer caseId={caseId} /> : <Dental3DViewer files={files || []} />}
          </Suspense>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default Viewer3DModal;
