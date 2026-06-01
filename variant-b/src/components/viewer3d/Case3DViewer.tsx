import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Dental3DViewer from './Dental3DViewer';
import api from '@/services/api';

interface Case3DViewerProps {
  caseId: string;
}

interface CaseFile {
  id: string;
  fileName: string;
  fileType: string;
  filePath: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export function Case3DViewer({ caseId }: Case3DViewerProps) {
  const { t } = useTranslation();
  const [files, setFiles] = useState<Array<{ id: string; url: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFiles = async () => {
      try {
        setLoading(true);
        const filesData = await api.get<CaseFile[]>(`/files/case/${caseId}`);

        // Filter only PLY and STL files
        const modelFiles = filesData.filter(
          (f) => f.fileType === 'ply' || f.fileType === 'stl' ||
                 f.fileName.toLowerCase().endsWith('.ply') ||
                 f.fileName.toLowerCase().endsWith('.stl')
        );

        // Convert to viewer format — use /api/files/:id/preview so Vercel proxy works
        const viewerFiles = modelFiles.map(f => ({
          id: f.id,
          url: `${API_BASE}/files/${f.id}/preview`,
          name: f.fileName
        }));

        setFiles(viewerFiles);
      } catch (err) {
        console.error('Error loading 3D files:', err);
        setError(t('viewer3d.cannotLoadFiles'));
      } finally {
        setLoading(false);
      }
    };

    if (caseId) {
      loadFiles();
    }
  }, [caseId]);

  if (loading) {
    return (
      <div className="h-[320px] flex items-center justify-center bg-neutral-100 rounded-2xl">
        <div className="text-center">
          <Loader2 size={32} className="mx-auto mb-2 text-card-teal animate-spin" />
          <p className="text-xs text-neutral-500">{t('viewer3d.loadingModels')}</p>
        </div>
      </div>
    );
  }

  if (error || files.length === 0) {
    return (
      <div className="h-[320px] flex items-center justify-center bg-neutral-100 rounded-2xl">
        <div className="text-center">
          <p className="text-sm text-neutral-500">{t('viewer3d.noFilesAvailable')}</p>
          <p className="text-xs text-neutral-400 mt-1">
            {error || t('viewer3d.loadFilesToView')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Dental3DViewer
      files={files}
      caseId={caseId}
    />
  );
}

export default Case3DViewer;
