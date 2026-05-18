import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import caseService from '../../../services/case.service';
import { useToast } from '../../../components/ui/use-toast';
import pdfService from '../../../services/pdf.service';
import {
  ArrowLeft,
  Edit,
  MessageSquare,
  Box,
  Image,
  FileText,
  Phone,
  Mail,
  Calendar,
  ChevronDown,
  Check,
  Download,
  Eye,
  Loader2,
  X,
  Circle,
  Diamond,
  Hexagon,
  Octagon,
  Square,
  Triangle,
  Receipt,
  Printer,
  Upload,
} from 'lucide-react';
import { ChatWindow } from '@/components/chat';

// Lazy load 3D viewer to avoid loading Three.js on every page
const Case3DViewer = lazy(() => import('@/components/viewer3d/Case3DViewer'));

const statusOptions = [
  { value: 'received', label: 'cases.statuses.received', color: 'bg-blue-500' },
  { value: 'in_progress', label: 'cases.statuses.in_progress', color: 'bg-amber-500' },
  { value: 'qc', label: 'cases.statuses.qc', color: 'bg-violet-500' },
  { value: 'shipped', label: 'cases.statuses.shipped', color: 'bg-emerald-500' },
];

const MATERIALS = [
  { code: 'ZR', color: 'bg-blue-500', icon: <Circle className="w-4 h-4 text-blue-600" />, label: 'dental.materials.ZR' },
  { code: 'EMAX', color: 'bg-violet-500', icon: <Diamond className="w-4 h-4 text-violet-600" />, label: 'dental.materials.EMAX' },
  { code: 'PMMA', color: 'bg-amber-400', icon: <Circle className="w-4 h-4 text-amber-600" />, label: 'dental.materials.PMMA' },
  { code: 'RES', color: 'bg-orange-500', icon: <Hexagon className="w-4 h-4 text-orange-600" />, label: 'dental.materials.RES' },
  { code: 'CR-CO', color: 'bg-slate-600', icon: <Octagon className="w-4 h-4 text-slate-600" />, label: 'dental.materials.CR-CO' },
  { code: 'CERAM', color: 'bg-orange-700', icon: <Square className="w-4 h-4 text-orange-800" />, label: 'dental.materials.CERAM' },
  { code: 'COMP', color: 'bg-cyan-500', icon: <Triangle className="w-4 h-4 text-cyan-600" />, label: 'dental.materials.COMP' },
];

// PDF Preview Modal Component
function PDFPreviewModal({
  caseData,
  onClose,
}: {
  caseData: any;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generatePreview = async () => {
      if (!caseData) {
        setError(t('cases.caseDataUnavailable'));
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const doc = await pdfService.generateCasePDFBlob(caseData);
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (err: any) {
        console.error('Error generating PDF:', err);
        setError(err.message || t('cases.errorGeneratingPdf'));
      } finally {
        setLoading(false);
      }
    };

    generatePreview();

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [caseData]);

  const handlePrint = () => {
    if (caseData) {
      pdfService.generateCasePDF(caseData);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-slate-800 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <FileText className="text-white" size={24} />
            <div>
              <h3 className="text-white font-semibold">{t('cases.pdfPreview')}</h3>
              <p className="text-white/70 text-sm">{caseData?.caseNumber} - {caseData?.patientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 bg-neutral-100 p-4 overflow-auto min-h-[400px]">
          {loading ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-brand-primary mx-auto mb-4" />
                <p className="text-neutral-500">{t('cases.generatingPdf')}</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <p className="text-red-500 font-medium">{t('cases.errorGeneratingPdf')}</p>
                <p className="text-neutral-400 text-sm mt-2">{error}</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-[60vh] bg-white shadow-lg rounded-lg"
              title={t('cases.pdfPreview')}
            />
          ) : (
            <div className="h-[400px] flex items-center justify-center">
              <p className="text-neutral-500">{t('cases.pdfNotAvailable')}</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-neutral-100 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 btn-secondary py-2">
            {t('common.close')}
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 btn-primary flex items-center justify-center gap-2 py-2"
          >
            <Printer size={16} />
            {t('cases.printPdf')}
          </button>
        </div>
      </div>
    </div>
  );
}

// FDI Dental Schema Component
function FDIDentalSchema({ teeth }: { teeth: any[] }) {
  const { t } = useTranslation();
  const selectedTeeth = new Map(teeth.map(t => [t.number, t]));

  const getToothColor = (material: string) => {
    const materialInfo = MATERIALS.find(m => m.code === material);
    return materialInfo?.color || 'bg-neutral-300';
  };

  const Tooth = ({ num }: { num: number }) => {
    const tooth = selectedTeeth.get(num);
    const isSelected = !!tooth;
    const colorClass = isSelected ? getToothColor(tooth.material) : 'bg-white';

    return (
      <div
        className={`
          w-6 h-8 rounded-md flex flex-col items-center justify-center text-[10px] font-semibold
          border-2 transition-all
          ${isSelected
            ? `${colorClass} border-transparent text-white shadow-md`
            : 'border-neutral-200 text-neutral-400 bg-white'
          }
        `}
        title={isSelected ? `${tooth.workType} - ${tooth.material}` : ''}
      >
        {num}
      </div>
    );
  };

  const upperRight = [18, 17, 16, 15, 14, 13, 12, 11];
  const upperLeft = [21, 22, 23, 24, 25, 26, 27, 28];
  const lowerLeft = [31, 32, 33, 34, 35, 36, 37, 38];
  const lowerRight = [48, 47, 46, 45, 44, 43, 42, 41];

  return (
    <div className="space-y-2">
      <div className="flex justify-center gap-4">
        <div className="flex gap-1">{upperRight.map(num => <Tooth key={num} num={num} />)}</div>
        <div className="flex gap-1">{upperLeft.map(num => <Tooth key={num} num={num} />)}</div>
      </div>
      <div className="flex justify-center gap-4 text-[9px] text-neutral-400 uppercase">
        <span className="w-[224px] text-center">{t('dental.upperArchRight')}</span>
        <span className="w-[224px] text-center">{t('dental.upperArchLeft')}</span>
      </div>
      <div className="flex justify-center gap-4">
        <div className="flex gap-1">{lowerRight.map(num => <Tooth key={num} num={num} />)}</div>
        <div className="flex gap-1">{lowerLeft.map(num => <Tooth key={num} num={num} />)}</div>
      </div>
      <div className="flex justify-center gap-4 text-[9px] text-neutral-400 uppercase">
        <span className="w-[224px] text-center">{t('dental.lowerArchRight')}</span>
        <span className="w-[224px] text-center">{t('dental.lowerArchLeft')}</span>
      </div>
    </div>
  );
}

export default function CaseDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState<any>(null);
  const [apiCaseData, setApiCaseData] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [showFinancialModal, setShowFinancialModal] = useState(false);
  const [showViewer3DModal, setShowViewer3DModal] = useState(false);

  // Load case data from API
  useEffect(() => {
    const loadCase = async () => {
      if (!id) {
        console.error('No case ID provided');
        return;
      }

      console.log('Loading case with ID:', id);

      try {
        setLoading(true);
        const apiData = await caseService.getCaseById(id);
        console.log('Case data loaded:', apiData);

        // Salva dati API originali per PDF
        setApiCaseData(apiData);

        // Format date helper
        const formatDate = (dateStr: string) => {
          const date = new Date(dateStr);
          return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
        };

        // Format API data to match component structure
        const formattedData = {
          id: apiData.caseNumber,
          client: {
            name: apiData.client?.studioName || 'N/A',
            contact: apiData.client?.contactPerson || 'N/A',
            phone: apiData.client?.phone || '',
            email: apiData.client?.email || '',
            avatarColor: 'bg-card-yellow',
          },
          patient: apiData.patientName || 'N/A',
          patientNotes: apiData.patientNotes || '',
          status: apiData.status,
          priority: apiData.priority,
          receivedDate: formatDate(apiData.receivedDate),
          dueDate: formatDate(apiData.dueDate),
          teeth: (apiData.teeth || []).map((tooth: any) => ({
            number: tooth.toothNumber,
            workType: tooth.workType,
            material: tooth.material,
            color: tooth.vitaColor || 'N/A',
            price: tooth.unitPrice || 0,
          })),
          notes: apiData.notesInternal || '',
          totalPrice: apiData.totalPrice || 0,
        };

        setCaseData(formattedData);

        // Load files if available
        if (apiData.files && apiData.files.length > 0) {
          const formattedFiles = apiData.files.map((file: any) => ({
            id: file.id,
            name: file.fileName,
            fileName: file.fileName,
            type: file.fileType,
            fileType: file.fileType,
            size: `${(file.fileSize / 1024 / 1024).toFixed(1)} MB`,
            fileSize: file.fileSize,
            date: formatDate(file.uploadedAt),
            uploadedAt: file.uploadedAt,
          }));
          setFiles(formattedFiles);
        }
      } catch (error: any) {
        console.error('Error loading case:', error);
        console.error('Error details:', error.message, error.response);
        toast({
          title: t('common.error'),
          description: error.message || t('cases.errorLoadingCase'),
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadCase();
  }, [id, toast]);

  const handleStatusChange = async (status: string) => {
    if (!id || !caseData) return;

    try {
      await caseService.updateCaseStatus(id, status as any);
      setCaseData({ ...caseData, status });
      toast({
        title: t('common.success'),
        description: t('cases.statusUpdated'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('cases.cannotUpdateStatus'),
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      received: 'badge badge-received',
      in_progress: 'badge badge-in-progress',
      qc: 'badge badge-qc',
      shipped: 'badge badge-shipped',
    };
    return styles[status] || 'badge';
  };

  const getMaterialColor = (material: string) => {
    const colors: Record<string, string> = {
      ZR: 'bg-blue-500',
      EMAX: 'bg-violet-500',
      PMMA: 'bg-amber-400',
      RES: 'bg-orange-500',
    };
    return colors[material] || 'bg-neutral-500';
  };

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiBase}/files/${fileId}/download`);
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

      toast({
        title: t('cases.downloadComplete'),
        description: fileName,
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: t('cases.downloadError'),
        description: t('cases.cannotDownloadFile'),
        variant: 'destructive',
      });
    }
  };

  const handlePreviewFile = (fileId: string, _fileType: string) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    window.open(`${apiUrl}/files/${fileId}/preview`, '_blank');
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/files/upload/${id}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const uploaded = await response.json();
      const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
      };

      setFiles(prev => [...prev, {
        id: uploaded.id,
        name: uploaded.fileName,
        fileName: uploaded.fileName,
        type: uploaded.fileType,
        fileType: uploaded.fileType,
        size: `${(uploaded.fileSize / 1024 / 1024).toFixed(1)} MB`,
        fileSize: uploaded.fileSize,
        date: formatDate(uploaded.uploadedAt),
        uploadedAt: uploaded.uploadedAt,
      }]);

      toast({ title: t('common.success'), description: uploaded.fileName });
    } catch (error) {
      toast({ title: t('common.error'), description: t('cases.cannotUploadFile', 'Impossibile caricare il file'), variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-primary mx-auto mb-4" />
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
          <Link to="/admin/cases" className="btn-primary mt-4 inline-flex items-center gap-2">
            <ArrowLeft size={18} />
            {t('common.backToCases')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b pb-4 -mx-6 px-6 pt-2">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/admin/cases"
              className="w-10 h-10 rounded-xl bg-white shadow-soft flex items-center justify-center text-neutral-500 hover:text-neutral-800 transition-colors shrink-0"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="min-w-0">
              {/* Client & Patient - Big and Visible */}
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-neutral-800 truncate">{caseData.client.name}</h1>
                <span className="text-neutral-300">/</span>
                <h2 className="text-lg font-semibold text-brand-primary truncate">{caseData.patient}</h2>
              </div>
              {/* Case Number & Status/Priority Row */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-neutral-400 font-mono">{caseData.id}</span>
                <span className="text-neutral-300">•</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  caseData.status === 'received' ? 'bg-blue-100 text-blue-700' :
                  caseData.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                  caseData.status === 'qc' ? 'bg-violet-100 text-violet-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    caseData.status === 'received' ? 'bg-blue-500' :
                    caseData.status === 'in_progress' ? 'bg-amber-500' :
                    caseData.status === 'qc' ? 'bg-violet-500' :
                    'bg-emerald-500'
                  }`} />
                  {t(`cases.statuses.${caseData.status}`)}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  caseData.priority === 'normal' ? 'bg-emerald-100 text-emerald-700' :
                  caseData.priority === 'urgent' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    caseData.priority === 'normal' ? 'bg-emerald-500' :
                    caseData.priority === 'urgent' ? 'bg-amber-500' :
                    'bg-red-500'
                  }`} />
                  {t(`cases.priorities.${caseData.priority}`)}
                </span>
              </div>
            </div>
          </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/admin/cases/${id}/edit`}
            className="btn-secondary flex items-center gap-2 py-1.5 px-3 text-sm"
          >
            <Edit size={16} />
            {t('common.edit')}
          </Link>
        </div>
        </div>
      </div>

      {/* Main Grid - with padding for sticky header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
        {/* Left Column - Case Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Work Details Card */}
          <div className="card-base p-4">
            <h2 className="text-base font-semibold text-neutral-800 mb-3">{t('cases.workDetails')}</h2>

            {/* Dates - Compact Row */}
            <div className="flex items-center gap-4 mb-4 p-2 bg-surface-secondary/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-neutral-400" />
                <span className="text-xs text-neutral-500">{t('cases.receivedLabel')}</span>
                <span className="text-sm font-medium text-neutral-700">{caseData.receivedDate}</span>
              </div>
              <div className="w-px h-4 bg-neutral-300" />
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-emerald-500" />
                <span className="text-xs text-neutral-500">Consegna:</span>
                <span className="text-sm font-semibold text-emerald-600">{caseData.dueDate}</span>
              </div>
            </div>

            {/* FDI Dental Schema */}
            <div className="mb-4 p-3 bg-surface-secondary/30 rounded-xl border border-neutral-100">
              <h3 className="text-xs font-medium text-neutral-500 mb-2">Schema Dentale FDI</h3>
              <FDIDentalSchema teeth={caseData.teeth} />
            </div>

            {/* Teeth List - Grouped by Work Type */}
            <div className="mb-4">
              <h3 className="text-xs font-medium text-neutral-500 mb-2">Lavorazioni ({caseData.teeth.length} denti)</h3>
              <div className="space-y-2">
                {(() => {
                  // Group teeth by workType + material
                  const groups = caseData.teeth.reduce((acc: any, tooth: any) => {
                    const key = `${tooth.workType}-${tooth.material}`;
                    if (!acc[key]) {
                      acc[key] = {
                        workType: tooth.workType,
                        material: tooth.material,
                        color: tooth.color,
                        teeth: [],
                      };
                    }
                    acc[key].teeth.push(tooth.number);
                    return acc;
                  }, {});

                  return Object.values(groups).map((group: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-2 bg-surface-secondary/50 rounded-lg"
                    >
                      <div className={`w-10 h-10 rounded-lg ${getMaterialColor(group.material)} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                        {group.teeth.length > 1 ? `${group.teeth.length}x` : group.teeth[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-800 text-sm">
                          {t(`dental.workTypes.${group.workType}`)}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {t(`dental.materials.${group.material}`)} • VITA {group.color}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[120px]">
                        {group.teeth.slice(0, 6).map((num: number) => (
                          <span key={num} className="w-5 h-5 rounded bg-white text-[10px] flex items-center justify-center text-neutral-600 font-medium">
                            {num}
                          </span>
                        ))}
                        {group.teeth.length > 6 && (
                          <span className="w-5 h-5 rounded bg-white text-[10px] flex items-center justify-center text-neutral-400">
                            +{group.teeth.length - 6}
                          </span>
                        )}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Notes */}
            {caseData.notes && (
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-2">Note</h3>
                <p className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-neutral-700">
                  {caseData.notes}
                </p>
              </div>
            )}

            {/* Patient Notes */}
            {caseData.patientNotes && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-neutral-500 mb-2">Note Paziente</h3>
                <p className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700">
                  ⚠️ {caseData.patientNotes}
                </p>
              </div>
            )}
          </div>

          {/* Files Section */}
          <div className="card-base p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-neutral-800 flex items-center gap-2">
                <FileText size={16} className="text-neutral-400" />
                File Allegati ({files.length})
              </h3>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white rounded-lg text-xs font-medium hover:bg-brand-primary/90 transition-colors disabled:opacity-60"
              >
                {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                {isUploading ? t('common.uploading', 'Caricamento...') : t('common.uploadFile', 'Carica file')}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".stl,.ply,.jpg,.jpeg,.png,.pdf"
                onChange={handleUploadFile}
              />
            </div>
            {files.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-4">{t('cases.noFiles', 'Nessun file allegato')}</p>
            ) : (
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-2 bg-surface-secondary/50 rounded-lg hover:bg-surface-secondary transition-colors group"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                      ${file.type === 'stl' || file.type === 'ply' ? 'bg-violet-100 text-violet-600' :
                        file.type === 'image' ? 'bg-purple-100 text-purple-600' :
                        'bg-blue-100 text-blue-600'}`}>
                      {file.type === 'stl' || file.type === 'ply' ? <Box size={16} /> :
                       file.type === 'image' ? <Image size={16} /> :
                       <FileText size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-800 text-sm truncate">{file.name}</p>
                      <p className="text-xs text-neutral-500">{file.size} • {file.date}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {(file.type === 'image') && (
                        <button
                          onClick={() => handlePreviewFile(file.id, file.type)}
                          className="w-7 h-7 rounded bg-white shadow-sm flex items-center justify-center text-neutral-500 hover:text-brand-primary"
                          title={t('notifications.view')}
                        >
                          <Eye size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadFile(file.id, file.fileName || file.name)}
                        className="w-7 h-7 rounded bg-white shadow-sm flex items-center justify-center text-neutral-500 hover:text-brand-primary"
                        title={t('common.download')}
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-4">
          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setShowPdfPreview(true)}
              className="flex flex-col items-center gap-2 p-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors"
            >
              <FileText size={24} />
              <span className="text-xs font-medium">PDF</span>
            </button>
            <button
              onClick={() => setShowFinancialModal(true)}
              className="flex flex-col items-center gap-2 p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors"
            >
              <Receipt size={24} />
              <span className="text-xs font-medium">Costi</span>
            </button>
            <button
              onClick={() => setShowViewer3DModal(true)}
              className="flex flex-col items-center gap-2 p-3 bg-violet-600 text-white rounded-xl hover:bg-violet-500 transition-colors"
            >
              <Box size={24} />
              <span className="text-xs font-medium">3D</span>
            </button>
          </div>

          {/* Client Info Card */}
          <div className="card-base p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg ${caseData.client.avatarColor} flex items-center justify-center text-white font-bold text-sm`}>
                {caseData.client.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-neutral-800 text-sm">{caseData.client.name}</p>
                <p className="text-xs text-neutral-500">{caseData.client.contact}</p>
              </div>
            </div>
            <div className="space-y-2">
              <a href={`tel:${caseData.client.phone}`} className="flex items-center gap-3 text-sm text-neutral-600 hover:text-brand-primary transition-colors">
                <Phone size={16} className="text-neutral-400" />
                {caseData.client.phone}
              </a>
              <a href={`mailto:${caseData.client.email}`} className="flex items-center gap-3 text-sm text-neutral-600 hover:text-brand-primary transition-colors">
                <Mail size={16} className="text-neutral-400" />
                {caseData.client.email}
              </a>
            </div>
          </div>

          {/* Vertical Chat */}
          <div className="card-base overflow-hidden flex flex-col">
            <div className="p-3 border-b border-neutral-100 bg-surface-secondary/50">
              <h3 className="font-semibold text-sm text-neutral-800 flex items-center gap-2">
                <MessageSquare size={16} className="text-brand-primary" />
                Chat Caso
              </h3>
            </div>
            <div className="h-[400px]">
              <ChatWindow caseId={id || ''} caseName={caseData.id} />
            </div>
          </div>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showPdfPreview && apiCaseData && (
        <PDFPreviewModal
          caseData={apiCaseData}
          onClose={() => setShowPdfPreview(false)}
        />
      )}

      {/* Financial Summary Modal */}
      {showFinancialModal && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-stone-200/80 backdrop-blur-sm pt-12">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-emerald-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Receipt className="text-white" size={24} />
                <h3 className="text-white font-semibold">Resoconto Costi</h3>
              </div>
              <button
                onClick={() => setShowFinancialModal(false)}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Cost Breakdown */}
              <div className="space-y-2">
                {(() => {
                  const groups = caseData.teeth.reduce((acc: any, tooth: any) => {
                    const key = `${tooth.workType}-${tooth.material}`;
                    if (!acc[key]) {
                      acc[key] = { workType: tooth.workType, material: tooth.material, count: 0, total: 0 };
                    }
                    acc[key].count++;
                    acc[key].total += tooth.price;
                    return acc;
                  }, {});
                  return Object.values(groups).map((group: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-neutral-100 last:border-0">
                      <div>
                        <p className="font-medium text-sm text-neutral-800">{t(`dental.workTypes.${group.workType}`)}</p>
                        <p className="text-xs text-neutral-500">{group.count}x {t(`dental.materials.${group.material}`)}</p>
                      </div>
                      <p className="font-semibold text-neutral-800">₪{group.total}</p>
                    </div>
                  ));
                })()}
              </div>
              <div className="pt-4 border-t-2 border-neutral-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-neutral-800">Totale</span>
                  <span className="text-2xl font-bold text-emerald-600">₪{caseData.totalPrice}</span>
                </div>
                <p className="text-xs text-neutral-500 text-right mt-1">{caseData.teeth.length} lavorazioni</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3D Viewer Modal */}
      {showViewer3DModal && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-stone-200/80 backdrop-blur-sm pt-12">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl mx-4 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-violet-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Box className="text-white" size={24} />
                <div>
                  <h3 className="text-white font-semibold">Visualizzatore 3D</h3>
                  <p className="text-white/70 text-sm">{caseData.id} - {caseData.patient}</p>
                </div>
              </div>
              <button
                onClick={() => setShowViewer3DModal(false)}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 bg-neutral-100 min-h-[500px]">
              <Suspense
                fallback={
                  <div className="h-[500px] flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 size={40} className="mx-auto mb-4 text-brand-primary animate-spin" />
                      <p className="text-neutral-500">Caricamento viewer 3D...</p>
                    </div>
                  </div>
                }
              >
                <Case3DViewer caseId={id || ''} />
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
