import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Loader2, FolderOpen, ChevronRight, AlertCircle } from 'lucide-react';
import api from '@/services/api';
import Case3DViewer from '@/components/viewer3d/Case3DViewer';
import { ClientAvatar } from '@/components/common/ClientAvatar';

interface CaseWithFiles {
  id: string;
  caseNumber: string;
  patientName?: string;
  client: { studioName: string; logoUrl?: string | null };
  teeth?: Array<{ toothNumber: number; workType: string; material: string }>;
  files: Array<{ id: string; fileName: string; fileType: string }>;
  createdAt: string;
  status: string;
}

export default function Viewer3DPage() {
  const { t } = useTranslation();
  const [cases, setCases] = useState<CaseWithFiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  useEffect(() => {
    const loadCases = async () => {
      try {
        setLoading(true);
        const response = await api.get<{ data: CaseWithFiles[]; total: number }>('/cases?take=100');
        const all: CaseWithFiles[] = response.data ?? [];
        const withFiles = all.filter(c =>
          c.files?.some(f =>
            f.fileType === 'stl' || f.fileType === 'ply' ||
            f.fileName?.toLowerCase().endsWith('.stl') ||
            f.fileName?.toLowerCase().endsWith('.ply')
          )
        );
        setCases(withFiles);
        if (withFiles.length > 0) setSelectedCaseId(withFiles[0].id);
      } catch (err) {
        console.error('Error loading cases:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCases();
  }, []);

  const selectedCase = cases.find(c => c.id === selectedCaseId);

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      in_progress: 'bg-amber-100 text-amber-700',
      received: 'bg-blue-100 text-blue-700',
      qc: 'bg-purple-100 text-purple-700',
      shipped: 'bg-green-100 text-green-700',
    };
    const labelKey = `cases.statuses.${status}`;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? 'bg-neutral-100 text-neutral-600'}`}>
        {t(labelKey, { defaultValue: status })}
      </span>
    );
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {loading ? (
        <div className="h-[500px] flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-neutral-400" />
        </div>
      ) : cases.length === 0 ? (
        <div className="h-[500px] flex flex-col items-center justify-center gap-3 text-neutral-400">
          <AlertCircle size={40} />
          <p className="text-sm">{t('viewer3d.noFilesAvailable', { defaultValue: 'Nessun caso con file 3D caricati' })}</p>
          <p className="text-xs text-neutral-300">{t('viewer3d.uploadToView', { defaultValue: 'Carica file STL o PLY su un caso per vederli qui' })}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Case Selector Sidebar */}
          <div className="space-y-4">
            <div className="card-base p-4">
              <h3 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                <FolderOpen size={18} className="text-neutral-400" />
                {t('viewer3d.casesWithScans', { defaultValue: 'Casi con scan 3D' })}
                <span className="ml-auto text-xs text-neutral-400">{cases.length}</span>
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {cases.map((c) => {
                  const active = selectedCaseId === c.id;
                  const firstType = c.teeth?.[0]?.workType;
                  const teethList = c.teeth?.map((tooth) => tooth.toothNumber).join(', ');
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCaseId(c.id)}
                      className={`w-full text-left p-2.5 rounded-xl transition-all ${
                        active ? 'bg-brand-primary text-white' : 'bg-surface-secondary hover:bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <ClientAvatar
                          studioName={c.client?.studioName || '?'}
                          logoUrl={c.client?.logoUrl}
                          size={36}
                          rounded="rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm truncate ${active ? 'text-white' : 'text-neutral-800'}`} dir="auto">
                            {c.client?.studioName}
                          </p>
                          {c.patientName && (
                            <p className={`text-xs truncate ${active ? 'text-white/80' : 'text-neutral-600'}`} dir="auto">
                              {c.patientName}
                            </p>
                          )}
                          {(firstType || teethList) && (
                            <p className={`text-[11px] truncate ${active ? 'text-white/60' : 'text-neutral-400'}`}>
                              {firstType ? t(`dental.workTypes.${firstType}`, { defaultValue: firstType }) : ''}
                              {teethList ? ` · ${teethList}` : ''}
                            </p>
                          )}
                        </div>
                        <ChevronRight size={16} className={active ? 'text-white' : 'text-neutral-400'} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Case Info */}
            {selectedCase && (
              <div className="card-base p-4">
                <h3 className="font-semibold text-neutral-800 mb-3">{t('viewer3d.caseDetails', { defaultValue: 'Dettagli caso' })}</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-neutral-400">{t('viewer3d.caseId', { defaultValue: 'Numero caso' })}</p>
                    <p className="font-medium text-neutral-800">{selectedCase.caseNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400">{t('cases.client')}</p>
                    <p className="font-medium text-neutral-800">{selectedCase.client?.studioName}</p>
                  </div>
                  {selectedCase.patientName && (
                    <div>
                      <p className="text-xs text-neutral-400">{t('cases.patient')}</p>
                      <p className="font-medium text-neutral-800">{selectedCase.patientName}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-neutral-400">{t('cases.status')}</p>
                    <div className="mt-1">{getStatusBadge(selectedCase.status)}</div>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400">{t('viewer3d.filesCount', { defaultValue: 'File 3D' })}</p>
                    <p className="font-medium text-neutral-800">
                      {selectedCase.files.filter(f =>
                        f.fileType === 'stl' || f.fileType === 'ply' ||
                        f.fileName?.toLowerCase().endsWith('.stl') ||
                        f.fileName?.toLowerCase().endsWith('.ply')
                      ).length}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Mouse controls help */}
            <div className="bg-card-navy/5 border border-card-navy/10 rounded-2xl p-4">
              <h4 className="font-medium text-neutral-800 mb-2">{t('viewer3d.mouseControlsTitle', { defaultValue: 'Controlli mouse' })}</h4>
              <ul className="text-sm text-neutral-600 space-y-1">
                <li>• <strong>SX</strong> - {t('viewer3d.rotateView', { defaultValue: 'Ruota' })}</li>
                <li>• <strong>DX</strong> - {t('viewer3d.panView', { defaultValue: 'Pan' })}</li>
                <li>• <strong>{t('viewer3d.scroll', { defaultValue: 'Scroll' })}</strong> - {t('viewer3d.zoomInOut', { defaultValue: 'Zoom' })}</li>
              </ul>
            </div>
          </div>

          {/* 3D Viewer */}
          <div className="lg:col-span-3">
            <div className="card-base overflow-hidden">
              {selectedCase && (
                <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                      <Box size={20} className="text-brand-primary" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-neutral-800">{selectedCase.caseNumber}</h2>
                      <p className="text-sm text-neutral-500">{selectedCase.client?.studioName}</p>
                    </div>
                  </div>
                  {getStatusBadge(selectedCase.status)}
                </div>
              )}
              <div className="h-[550px]">
                {selectedCaseId && <Case3DViewer key={selectedCaseId} caseId={selectedCaseId} />}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
