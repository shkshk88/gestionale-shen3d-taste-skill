import { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  Calendar,
  FileText,
  Image as ImageIcon,
  Box,
  Download,
  MessageSquare,
  Loader2,
  Upload,
  FileDown,
  Eye
} from 'lucide-react';
import { ChatWindow } from '@/components/chat';
import caseService, { Case } from '../../services/case.service';
import api from '../../services/api';
import pdfService from '../../services/pdf.service';
import { ImageGalleryModal } from '@/components/viewer3d/ImageGalleryModal';
import { getDateLocale } from '@/utils/locale';

const Case3DViewer = lazy(() => import('@/components/viewer3d/Case3DViewer'));

export default function ClientCaseDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'chat' | 'files' | '3d'>('chat');
  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const loadCase = async () => {
      if (!id) {
        navigate('/portal/cases');
        return;
      }

      try {
        setLoading(true);
        const caseResponse = await caseService.getCaseById(id);
        setCaseData(caseResponse);

        if (caseResponse.files && caseResponse.files.length > 0) {
          const formattedFiles = caseResponse.files.map((file: any) => ({
            id: file.id,
            fileName: file.fileName,
            fileType: file.fileType,
            fileSize: file.fileSize,
            uploadedAt: file.uploadedAt,
            name: file.fileName,
            type: file.fileType,
            size: file.fileSize,
          }));
          setFiles(formattedFiles);
        } else {
          try {
            const filesData = await api.get<any[]>(`/files/case/${id}`);
            setFiles(filesData.map((file: any) => ({
              ...file,
              name: file.fileName,
              type: file.fileType,
              size: file.fileSize,
            })));
          } catch (error) {
            console.error('Error loading files:', error);
            setFiles([]);
          }
        }

        const generatedTimeline = [
          {
            id: '1',
            event: t('portal.caseReceived'),
            date: new Date(caseResponse.receivedDate).toLocaleDateString(getDateLocale(), {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            status: 'completed',
            icon: Package
          },
        ];

        if (caseResponse.status === 'in_progress' || caseResponse.status === 'qc' || caseResponse.status === 'shipped' || caseResponse.status === 'delivered') {
          generatedTimeline.push({
            id: '2',
            event: t('cases.statuses.in_progress'),
            date: '',
            status: caseResponse.status === 'in_progress' ? 'current' : 'completed',
            icon: Clock
          });
        }

        if (caseResponse.status === 'qc' || caseResponse.status === 'shipped' || caseResponse.status === 'delivered') {
          generatedTimeline.push({
            id: '3',
            event: t('cases.statuses.qc'),
            date: '',
            status: caseResponse.status === 'qc' ? 'current' : 'completed',
            icon: CheckCircle2
          });
        }

        if (caseResponse.status === 'shipped' || caseResponse.status === 'delivered') {
          generatedTimeline.push({
            id: '4',
            event: t('cases.statuses.shipped'),
            date: caseResponse.shippedDate ? new Date(caseResponse.shippedDate).toLocaleDateString(getDateLocale()) : '',
            status: caseResponse.status === 'shipped' ? 'current' : 'completed',
            icon: Truck
          });
        }

        if (caseResponse.status === 'delivered') {
          generatedTimeline.push({
            id: '5',
            event: t('cases.statuses.delivered'),
            date: '',
            status: 'completed',
            icon: CheckCircle2
          });
        }

        setTimeline(generatedTimeline);
      } catch (error) {
        console.error('Error loading case:', error);
        navigate('/portal/cases');
      } finally {
        setLoading(false);
      }
    };

    loadCase();
  }, [id, navigate]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'received':
        return { label: t('cases.statuses.received'), color: 'bg-sky-100 text-sky-700', icon: Package };
      case 'in_progress':
        return { label: t('cases.statuses.in_progress'), color: 'bg-amber-100 text-amber-700', icon: Clock };
      case 'qc':
        return { label: t('cases.statuses.qc'), color: 'bg-violet-100 text-violet-700', icon: CheckCircle2 };
      case 'shipped':
        return { label: t('cases.statuses.shipped'), color: 'bg-teal-100 text-teal-700', icon: Truck };
      case 'delivered':
        return { label: t('cases.statuses.delivered'), color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 };
      default:
        return { label: t('cases.statuses.in_progress'), color: 'bg-amber-100 text-amber-700', icon: Clock };
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'stl': return Box;
      case 'image': return ImageIcon;
      default: return FileText;
    }
  };

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/files/${fileId}/download`);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert(t('portal.downloadError'));
    }
  };

  const handlePreviewFile = (fileId: string, fileIndex: number) => {
    setCurrentImageIndex(fileIndex);
    setGalleryOpen(true);
  };

  const imageFiles = files.filter((f) =>
    (f.fileType || f.type) === 'image' ||
    (f.fileName || f.name)?.toLowerCase().match(/\.(jpg|jpeg|png|webp|heic)$/)
  );

  const handleDownloadPDF = async () => {
    if (!caseData) return;
    try {
      await pdfService.generateCasePDF(caseData as Case);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(t('portal.pdfError'));
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    try {
      setUploading(true);
      const filesArray = Array.from(selectedFiles);
      await api.uploadFiles(`/files/upload-multiple/${id}`, filesArray);
      const filesData = await api.get<any[]>(`/files/case/${id}`);
      setFiles(filesData);
      alert(t('portal.uploadSuccess'));
    } catch (error) {
      console.error('Error uploading files:', error);
      alert(t('portal.uploadError'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800 mx-auto mb-4"></div>
          <p className="text-stone-500">{t('common.loadingCase')}</p>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-stone-500">{t('common.caseNotFound')}</p>
          <Link to="/portal/cases" className="text-amber-800 hover:underline mt-4 inline-block">
            {t('common.backToCases')}
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(caseData.status);

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-lg bg-white shadow-sm border border-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-800 transition-all"
          title="Indietro"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-stone-800">{caseData.caseNumber}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            {caseData.priority === 'urgent' && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                {t('portal.urgentLabel')}
              </span>
            )}
            <button
              onClick={handleDownloadPDF}
              className="ml-auto w-8 h-8 rounded-lg bg-white shadow-sm border border-stone-100 flex items-center justify-center text-stone-500 hover:text-amber-800 hover:border-sky-200 transition-all"
              title={t('common.downloadPdf')}
            >
              <FileDown size={16} />
            </button>
          </div>
          <p className="text-xs text-stone-500 truncate">
            {caseData.patientName || t('common.noData')} - {caseData.teeth?.[0]?.workType ? t(`dental.workTypes.${caseData.teeth[0].workType}`, { defaultValue: caseData.teeth[0].workType }) : t('cases.workLabel')}
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-white rounded-xl border border-stone-100 shadow-sm p-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400">Invio:</span>
            <span className="font-medium text-stone-700">{new Date(caseData.receivedDate).toLocaleDateString(getDateLocale())}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400">Consegna:</span>
            <span className="font-medium text-stone-700">{caseData.dueDate ? new Date(caseData.dueDate).toLocaleDateString(getDateLocale()) : '—'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400">Materiale:</span>
            <span className="font-medium text-stone-700">{caseData.teeth?.[0]?.material ? t(`dental.materials.${caseData.teeth[0].material}`, { defaultValue: caseData.teeth[0].material }) : 'N/A'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400">Tipo:</span>
            <span className="font-medium text-stone-700">{caseData.teeth?.[0]?.workType ? t(`dental.workTypes.${caseData.teeth[0].workType}`, { defaultValue: caseData.teeth[0].workType }) : 'N/A'}</span>
          </div>
          {caseData.dueDate && (
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-stone-400">Giorni:</span>
              <span className={`font-semibold ${
                Math.ceil((new Date(caseData.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) < 0 ? 'text-red-600' : 'text-stone-700'
              }`}>
                {Math.ceil((new Date(caseData.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
              </span>
            </div>
          )}
        </div>

        {caseData.teeth && caseData.teeth.length > 0 && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-stone-100">
            <span className="text-xs text-stone-400">{t('portal.teethLabel')}</span>
            <div className="flex flex-wrap gap-1">
              {caseData.teeth.map((tooth: any) => (
                <span key={tooth.id} className="w-6 h-6 rounded-md bg-amber-800 text-white text-xs font-bold flex items-center justify-center">
                  {tooth.toothNumber}
                </span>
              ))}
            </div>
          </div>
        )}

        {(caseData.patientNotes || caseData.notesInternal) && (
          <div className="mt-2 pt-2 border-t border-stone-100 space-y-1">
            {caseData.patientNotes && (
              <div className="text-xs">
                <span className="text-stone-400">Note:</span>
                <span className="text-stone-600 ml-1">{caseData.patientNotes}</span>
              </div>
            )}
            {caseData.notesInternal && (
              <div className="text-xs bg-orange-50 p-1.5 rounded border border-amber-100">
                <span className="text-amber-600">Lab:</span>
                <span className="text-stone-600 ml-1">{caseData.notesInternal}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex-1 justify-center ${
            activeTab === 'chat'
              ? 'bg-white text-amber-800 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          <MessageSquare size={14} />
          Chat
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex-1 justify-center ${
            activeTab === 'files'
              ? 'bg-white text-amber-800 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          <FileText size={14} />
          File ({files.length})
        </button>
        <button
          onClick={() => setActiveTab('3d')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex-1 justify-center ${
            activeTab === '3d'
              ? 'bg-white text-amber-800 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          <Box size={14} />
          3D
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden">
        {activeTab === 'chat' && (
          <div className="h-[320px]">
            <ChatWindow
              caseId={id || ''}
              caseName={`${caseData.patientName || 'N/A'} - ${caseData.teeth?.[0]?.workType || 'Lavorazione'}`}
            />
          </div>
        )}

        {activeTab === 'files' && (
          <div className="p-3 space-y-2">
            <div className="flex justify-between items-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept=".jpg,.jpeg,.png,.heic,.webp,.stl,.ply"
                className="hidden"
              />
              <span className="text-xs text-stone-400">{files.length} file</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-800 text-white rounded-lg text-xs font-medium hover:bg-sky-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload size={14} />
                {uploading ? '...' : 'Carica'}
              </button>
            </div>
            {files.length > 0 ? (
              <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
                {files.map((file, index) => {
                  const FileIcon = getFileIcon(file.fileType || file.type);
                  const isImage = (file.fileType || file.type) === 'image' ||
                    (file.fileName || file.name)?.toLowerCase().match(/\.(jpg|jpeg|png|webp|heic)$/);
                  const is3D = (file.fileType || file.type) === 'stl' || (file.fileType || file.type) === 'ply';

                  return (
                    <div key={file.id} className="flex items-center justify-between p-2 bg-stone-100 rounded-lg group">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                          is3D ? 'bg-sky-100 text-amber-800' :
                          isImage ? 'bg-violet-100 text-violet-600' :
                          'bg-emerald-100 text-emerald-600'
                        }`}>
                          <FileIcon size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-stone-700 truncate">{file.fileName || file.name}</p>
                          <p className="text-[10px] text-stone-400">
                            {file.fileSize ? `${(file.fileSize / 1024 / 1024).toFixed(2)} MB` : file.size || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {isImage && (
                          <button
                            onClick={() => handlePreviewFile(file.id, imageFiles.findIndex(f => f.id === file.id))}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-stone-400 hover:bg-violet-100 hover:text-violet-600 transition-all flex-shrink-0"
                            title={t('notifications.view')}
                          >
                            <Eye size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDownloadFile(file.id, file.fileName || file.name)}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-stone-400 hover:bg-stone-200 hover:text-stone-600 transition-all flex-shrink-0"
                          title={t('common.download')}
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText size={32} className="mx-auto text-slate-300 mb-1" />
                <p className="text-xs text-stone-500">Nessun file</p>
              </div>
            )}
          </div>
        )}

        {activeTab === '3d' && (
          <Suspense
            fallback={
              <div className="h-[320px] flex items-center justify-center bg-stone-100">
                <div className="text-center">
                  <Loader2 size={32} className="mx-auto mb-2 text-amber-800 animate-spin" />
                  <p className="text-xs text-stone-500">Caricamento 3D...</p>
                </div>
              </div>
            }
          >
            <div className="h-[320px]">
              <Case3DViewer caseId={id || ''} />
            </div>
          </Suspense>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-stone-800 rounded-xl p-3 text-white shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Calendar size={14} className="text-sky-400" />
          <span className="text-xs font-medium">{t('cases.timeline')}</span>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
          {timeline.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="flex items-center flex-shrink-0">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                  item.status === 'completed' ? 'bg-white/20' :
                  item.status === 'current' ? 'bg-white text-stone-800' :
                  'bg-white/10 opacity-50'
                }`}>
                  <Icon size={12} />
                  <span className="text-[10px] font-medium whitespace-nowrap">{item.event}</span>
                </div>
                {index < timeline.length - 1 && (
                  <div className="w-4 h-px bg-white/30 mx-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <ImageGalleryModal
        files={imageFiles}
        currentIndex={currentImageIndex}
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        onDownload={handleDownloadFile}
      />
    </div>
  );
}
