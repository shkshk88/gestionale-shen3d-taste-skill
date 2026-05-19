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

// Lazy load 3D viewer
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

  // Image gallery modal state
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

        // Load files from case data or fetch separately
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
          // Fallback: try to fetch files separately
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

        // Generate timeline from case data
        const generatedTimeline = [
          {
            id: '1',
            event: t('portal.caseReceived'),
            date: new Date(caseResponse.receivedDate).toLocaleDateString('it-IT', {
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
            date: caseResponse.shippedDate ? new Date(caseResponse.shippedDate).toLocaleDateString('it-IT') : '',
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
        return { label: t('cases.statuses.received'), color: 'bg-blue-100 text-blue-700', icon: Package };
      case 'in_progress':
        return { label: t('cases.statuses.in_progress'), color: 'bg-amber-100 text-amber-700', icon: Clock };
      case 'qc':
        return { label: t('cases.statuses.qc'), color: 'bg-violet-100 text-violet-700', icon: CheckCircle2 };
      case 'shipped':
        return { label: t('cases.statuses.shipped'), color: 'bg-cyan-100 text-cyan-700', icon: Truck };
      case 'delivered':
        return { label: t('cases.statuses.delivered'), color: 'bg-green-100 text-green-700', icon: CheckCircle2 };
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

  // Get image files for gallery
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

      // Upload files using API service
      await api.uploadFiles(`/files/upload-multiple/${id}`, filesArray);

      // Reload files after upload
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-neutral-500">{t('common.loadingCase')}</p>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-neutral-500">{t('common.caseNotFound')}</p>
          <Link to="/portal/cases" className="text-card-teal hover:underline mt-4 inline-block">
            {t('common.backToCases')}
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(caseData.status);

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Header Compatto */}
      <div className="flex items-center gap-3">
        <Link
          to="/portal/cases"
          className="w-8 h-8 rounded-lg bg-white shadow-soft flex items-center justify-center text-neutral-500 hover:text-neutral-800 transition-all"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-neutral-800">{caseData.caseNumber}</h1>
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
              className="ml-auto w-8 h-8 rounded-lg bg-white shadow-soft flex items-center justify-center text-neutral-500 hover:text-card-teal hover:border-card-teal border border-transparent transition-all"
              title={t('common.downloadPdf')}
            >
              <FileDown size={16} />
            </button>
          </div>
          <p className="text-xs text-neutral-500 truncate">
            {caseData.patientName || t('common.noData')} - {caseData.teeth?.[0]?.workType ? t(`dental.workTypes.${caseData.teeth[0].workType}`, caseData.teeth[0].workType) : t('cases.workLabel')}
          </p>
        </div>
      </div>

      {/* Info Box Compatto */}
      <div className="card-base p-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400">Invio:</span>
            <span className="font-medium text-neutral-700">{new Date(caseData.receivedDate).toLocaleDateString('it-IT')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400">Consegna:</span>
            <span className="font-medium text-neutral-700">{new Date(caseData.dueDate).toLocaleDateString('it-IT')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400">Materiale:</span>
            <span className="font-medium text-neutral-700">{caseData.teeth?.[0]?.material ? t(`dental.materials.${caseData.teeth[0].material}`, caseData.teeth[0].material) : 'N/A'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400">Tipo:</span>
            <span className="font-medium text-neutral-700">{caseData.teeth?.[0]?.workType ? t(`dental.workTypes.${caseData.teeth[0].workType}`, caseData.teeth[0].workType) : 'N/A'}</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-neutral-400">Giorni:</span>
            <span className={`font-semibold ${
              Math.ceil((new Date(caseData.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) < 0 ? 'text-red-600' : 'text-neutral-700'
            }`}>
              {Math.ceil((new Date(caseData.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
            </span>
          </div>
        </div>

        {/* Denti selezionati */}
        {caseData.teeth && caseData.teeth.length > 0 && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-neutral-100">
            <span className="text-xs text-neutral-400">{t('portal.teethLabel')}</span>
            <div className="flex flex-wrap gap-1">
              {caseData.teeth.map((tooth: any) => (
                <span key={tooth.id} className="w-6 h-6 rounded-md bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
                  {tooth.toothNumber}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Note (se presenti) */}
        {(caseData.patientNotes || caseData.notesInternal) && (
          <div className="mt-2 pt-2 border-t border-neutral-100 space-y-1">
            {caseData.patientNotes && (
              <div className="text-xs">
                <span className="text-neutral-400">Note:</span>
                <span className="text-neutral-600 ml-1">{caseData.patientNotes}</span>
              </div>
            )}
            {caseData.notesInternal && (
              <div className="text-xs bg-amber-50 p-1.5 rounded">
                <span className="text-amber-600">Lab:</span>
                <span className="text-neutral-600 ml-1">{caseData.notesInternal}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tab Navigation Compatta */}
      <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex-1 justify-center ${
            activeTab === 'chat'
              ? 'bg-white text-card-teal shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <MessageSquare size={14} />
          Chat
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex-1 justify-center ${
            activeTab === 'files'
              ? 'bg-white text-card-teal shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <FileText size={14} />
          File ({files.length})
        </button>
        <button
          onClick={() => setActiveTab('3d')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex-1 justify-center ${
            activeTab === '3d'
              ? 'bg-white text-card-teal shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <Box size={14} />
          3D
        </button>
      </div>

      {/* Tab Content */}
      <div className="card-base overflow-hidden">
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
              <span className="text-xs text-neutral-400">{files.length} file</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card-teal text-white rounded-lg text-xs font-medium hover:bg-card-teal/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <div key={file.id} className="flex items-center justify-between p-2 bg-surface-secondary rounded-lg group">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                          is3D ? 'bg-blue-100 text-blue-600' :
                          isImage ? 'bg-purple-100 text-purple-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          <FileIcon size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-neutral-700 truncate">{file.fileName || file.name}</p>
                          <p className="text-[10px] text-neutral-400">
                            {file.fileSize ? `${(file.fileSize / 1024 / 1024).toFixed(2)} MB` : file.size || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {isImage && (
                          <button
                            onClick={() => handlePreviewFile(file.id, imageFiles.findIndex(f => f.id === file.id))}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-neutral-400 hover:bg-purple-100 hover:text-purple-600 transition-all flex-shrink-0"
                            title={t('notifications.view')}
                          >
                            <Eye size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDownloadFile(file.id, file.fileName || file.name)}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 transition-all flex-shrink-0"
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
                <FileText size={32} className="mx-auto text-neutral-300 mb-1" />
                <p className="text-xs text-neutral-500">Nessun file</p>
              </div>
            )}
          </div>
        )}

        {activeTab === '3d' && (
          <Suspense
            fallback={
              <div className="h-[320px] flex items-center justify-center bg-neutral-100">
                <div className="text-center">
                  <Loader2 size={32} className="mx-auto mb-2 text-card-teal animate-spin" />
                  <p className="text-xs text-neutral-500">Caricamento 3D...</p>
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

      {/* Timeline Compatta */}
      <div className="card-teal p-3 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Calendar size={14} />
          <span className="text-xs font-medium">{t('cases.timeline')}</span>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
          {timeline.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="flex items-center flex-shrink-0">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                  item.status === 'completed' ? 'bg-white/20' :
                  item.status === 'current' ? 'bg-white text-card-teal' :
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

      {/* Image Gallery Modal */}
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
