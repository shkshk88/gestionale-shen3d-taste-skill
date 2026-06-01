import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link, useNavigate } from 'react-router-dom';
import caseService from '../../../services/case.service';
import { useToast } from '../../../components/ui/use-toast';
import pdfService from '../../../services/pdf.service';
import { ClientAvatar } from '@/components/common/ClientAvatar';
import { getDateLocale } from '@/utils/locale';
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
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import whatsappService, { OrchestrationResult } from '@/services/whatsapp.service';
import { ChatWindow } from '@/components/chat';

import { Viewer3DModal } from '@/components/viewer3d/Viewer3DModal';

const statusOptions = [
  { value: 'received', label: 'cases.statuses.received', color: 'bg-amber-700' },
  { value: 'in_progress', label: 'cases.statuses.in_progress', color: 'bg-orange-600' },
  { value: 'qc', label: 'cases.statuses.qc', color: 'bg-green-700' },
  { value: 'shipped', label: 'cases.statuses.shipped', color: 'bg-green-600' },
];

const MATERIALS = [
  { code: 'ZR', color: 'bg-amber-700', icon: <Circle className="w-4 h-4 text-amber-800" />, label: 'dental.materials.ZR' },
  { code: 'EMAX', color: 'bg-violet-500', icon: <Diamond className="w-4 h-4 text-violet-600" />, label: 'dental.materials.EMAX' },
  { code: 'PMMA', color: 'bg-amber-400', icon: <Circle className="w-4 h-4 text-amber-600" />, label: 'dental.materials.PMMA' },
  { code: 'RES', color: 'bg-orange-500', icon: <Hexagon className="w-4 h-4 text-orange-600" />, label: 'dental.materials.RES' },
  { code: 'CR-CO', color: 'bg-stone-600', icon: <Octagon className="w-4 h-4 text-stone-600" />, label: 'dental.materials.CR-CO' },
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-elevated w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-stone-800 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-800 flex items-center justify-center shrink-0">
              <FileText className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-white font-semibold font-display">{t('cases.pdfPreview')}</h3>
              <p className="text-white/60 text-sm">{caseData?.caseNumber} - {caseData?.patientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 bg-stone-50 p-4 overflow-auto min-h-[400px]">
          {loading ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-amber-800 mx-auto mb-4" />
                <p className="text-stone-500">{t('cases.generatingPdf')}</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <p className="text-red-500 font-medium">{t('cases.errorGeneratingPdf')}</p>
                <p className="text-stone-400 text-sm mt-2">{error}</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-[60vh] bg-white rounded-xl shadow-soft"
              title={t('cases.pdfPreview')}
            />
          ) : (
            <div className="h-[400px] flex items-center justify-center">
              <p className="text-stone-500">{t('cases.pdfNotAvailable')}</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-stone-100 flex gap-3 shrink-0 bg-white">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-stone-100 text-stone-700 rounded-xl font-medium hover:bg-stone-200 transition-colors">
            {t('common.close')}
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 px-4 py-2.5 bg-amber-800 text-white rounded-xl font-medium hover:bg-sky-700 transition-colors flex items-center justify-center gap-2"
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
    return materialInfo?.color || 'bg-slate-300';
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
            : 'border-stone-200 text-stone-400 bg-white'
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
      <div className="flex justify-center gap-4 text-[9px] text-stone-400 uppercase tracking-wider">
        <span className="w-[224px] text-center">{t('dental.upperArchRight')}</span>
        <span className="w-[224px] text-center">{t('dental.upperArchLeft')}</span>
      </div>
      <div className="flex justify-center gap-4">
        <div className="flex gap-1">{lowerRight.map(num => <Tooth key={num} num={num} />)}</div>
        <div className="flex gap-1">{lowerLeft.map(num => <Tooth key={num} num={num} />)}</div>
      </div>
      <div className="flex justify-center gap-4 text-[9px] text-stone-400 uppercase tracking-wider">
        <span className="w-[224px] text-center">{t('dental.lowerArchRight')}</span>
        <span className="w-[224px] text-center">{t('dental.lowerArchLeft')}</span>
      </div>
    </div>
  );
}

export default function CaseDetail() {
  const navigate = useNavigate();
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
  const [waChecking, setWaChecking] = useState(false);
  const [waResult, setWaResult] = useState<OrchestrationResult | null>(null);
  const [showWaModal, setShowWaModal] = useState(false);

  const handleVerifyAndContact = async () => {
    if (!id) return;
    setWaChecking(true);
    try {
      const result = await whatsappService.triggerCase(id);
      setWaResult(result);
      setShowWaModal(true);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Errore verifica',
        description: err?.response?.data?.message || err.message,
      });
    } finally {
      setWaChecking(false);
    }
  };

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
          return date.toLocaleDateString(getDateLocale(), { day: 'numeric', month: 'short', year: 'numeric' });
        };

        // Format API data to match component structure
        const formattedData = {
          id: apiData.caseNumber,
          client: {
            name: apiData.client?.studioName || 'N/A',
            contact: apiData.client?.contactPerson || 'N/A',
            phone: apiData.client?.phone || '',
            email: apiData.client?.email || '',
            logoUrl: apiData.client?.logoUrl ?? null,
          },
          patient: apiData.patientName || 'N/A',
          patientNotes: apiData.patientNotes || '',
          status: apiData.status,
          priority: apiData.priority,
          receivedDate: formatDate(apiData.receivedDate),
          dueDate: apiData.dueDate ? formatDate(apiData.dueDate) : '—',
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

  const getStatusBadgeClass = (status: string) => {
    const styles: Record<string, string> = {
      received: 'bg-orange-50 text-sky-700 border-sky-200',
      in_progress: 'bg-orange-50 text-amber-700 border-amber-200',
      qc: 'bg-green-50 text-teal-700 border-teal-200',
      shipped: 'bg-green-50 text-emerald-700 border-emerald-200',
    };
    return styles[status] || 'bg-stone-50 text-stone-700 border-stone-200';
  };

  const getStatusDot = (status: string) => {
    const colors: Record<string, string> = {
      received: 'bg-amber-700',
      in_progress: 'bg-orange-600',
      qc: 'bg-green-700',
      shipped: 'bg-green-600',
    };
    return colors[status] || 'bg-stone-400';
  };

  const getPriorityBadgeClass = (priority: string) => {
    const styles: Record<string, string> = {
      normal: 'bg-green-50 text-emerald-700 border-emerald-200',
      urgent: 'bg-orange-50 text-amber-700 border-amber-200',
      rush: 'bg-red-50 text-red-700 border-red-200',
    };
    return styles[priority] || 'bg-stone-50 text-stone-700 border-stone-200';
  };

  const getPriorityDot = (priority: string) => {
    const colors: Record<string, string> = {
      normal: 'bg-green-600',
      urgent: 'bg-orange-600',
      rush: 'bg-red-500',
    };
    return colors[priority] || 'bg-stone-400';
  };

  const getMaterialColor = (material: string) => {
    const colors: Record<string, string> = {
      ZR: 'bg-amber-700',
      EMAX: 'bg-violet-500',
      PMMA: 'bg-amber-400',
      RES: 'bg-orange-500',
    };
    return colors[material] || 'bg-stone-500';
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

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.message || `HTTP ${response.status}`);
      }

      const uploaded = await response.json();
      const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString(getDateLocale(), { day: 'numeric', month: 'short', year: 'numeric' });
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
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: t('common.error'), description: error.message || t('cases.cannotUploadFile', 'Impossibile caricare il file'), variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-amber-800 mx-auto mb-4" />
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
          <Link to="/admin/cases" className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-800 text-white rounded-xl font-medium hover:bg-sky-700 transition-colors mt-4 shadow-soft">
            <ArrowLeft size={18} />
            {t('common.backToCases')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-100 pb-4 -mx-6 px-6 pt-2">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 hover:text-stone-800 hover:bg-stone-200 transition-colors shrink-0"
              title="Indietro"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0">
              {/* Client & Patient */}
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-stone-800 truncate font-display">{caseData.client.name}</h1>
                <span className="text-slate-300">/</span>
                <h2 className="text-lg font-semibold text-amber-800 truncate font-display">{caseData.patient}</h2>
              </div>
              {/* Case Number & Status/Priority Row */}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-stone-400 font-mono">{caseData.id}</span>
                <span className="text-slate-300">•</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeClass(caseData.status)}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(caseData.status)}`} />
                  {t(`cases.statuses.${caseData.status}`)}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getPriorityBadgeClass(caseData.priority)}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${getPriorityDot(caseData.priority)}`} />
                  {t(`cases.priorities.${caseData.priority}`)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowPdfPreview(true)}
              className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 text-white flex items-center justify-center transition-colors"
              title="PDF"
            >
              <FileText size={14} />
            </button>
            <button
              onClick={() => setShowFinancialModal(true)}
              className="w-9 h-9 rounded-xl bg-green-800 hover:bg-green-700 text-white flex items-center justify-center transition-colors"
              title={t('common.costs', { defaultValue: 'Costi' })}
            >
              <Receipt size={14} />
            </button>
            <button
              onClick={() => setShowViewer3DModal(true)}
              className="w-9 h-9 rounded-xl bg-amber-800 hover:bg-amber-700 text-white flex items-center justify-center transition-colors"
              title={t('viewer3d.view3D')}
            >
              <Box size={14} />
            </button>
            <button
              onClick={handleVerifyAndContact}
              disabled={waChecking}
              className="w-9 h-9 rounded-xl bg-green-800 hover:bg-green-700 text-white flex items-center justify-center transition-colors disabled:opacity-50"
              title="Verifica caso & contatta dentista via WhatsApp"
            >
              {waChecking ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />}
            </button>
            <div className="w-px h-6 bg-stone-200 mx-1" />
            <Link
              to={`/admin/cases/${id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-stone-800 rounded-xl font-medium text-sm border border-stone-200 hover:bg-stone-50 transition-colors shadow-soft"
            >
              <Edit size={14} />
              {t('common.edit')}
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-2">
        {/* Left Column - Case Details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Work Details Card */}
          <div className="bg-white rounded-xl border border-stone-100 shadow-soft p-5">
            <h2 className="text-base font-semibold text-stone-800 mb-4 font-display flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-orange-50 text-amber-800 flex items-center justify-center">
                <FileText size={16} />
              </span>
              {t('cases.workDetails')}
            </h2>

            {/* Dates - Compact Row */}
            <div className="flex items-center gap-4 mb-5 p-3 bg-stone-50/70 rounded-xl border border-stone-100">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-stone-400" />
                <span className="text-xs text-stone-500">{t('cases.receivedLabel')}</span>
                <span className="text-sm font-medium text-stone-700">{caseData.receivedDate}</span>
              </div>
              <div className="w-px h-4 bg-slate-300" />
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-green-700" />
                <span className="text-xs text-stone-500">Consegna:</span>
                <span className="text-sm font-semibold text-green-800">{caseData.dueDate}</span>
              </div>
            </div>

            {/* FDI Dental Schema */}
            <div className="mb-5 p-4 bg-stone-50/50 rounded-xl border border-stone-100">
              <h3 className="text-xs font-semibold text-stone-500 mb-3 uppercase tracking-wider">Schema Dentale FDI</h3>
              <FDIDentalSchema teeth={caseData.teeth} />
            </div>

            {/* Teeth List - Grouped by Work Type */}
            <div className="mb-5">
              <h3 className="text-xs font-semibold text-stone-500 mb-3 uppercase tracking-wider">Lavorazioni ({caseData.teeth.length} denti)</h3>
              <div className="space-y-2">
                {(() => {
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
                      className="flex items-center gap-3 p-3 bg-stone-50/50 rounded-xl border border-stone-100 hover:bg-stone-50 transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-xl ${getMaterialColor(group.material)} flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm`}>
                        {group.teeth.length > 1 ? `${group.teeth.length}x` : group.teeth[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-stone-800 text-sm">
                          {t(`dental.workTypes.${group.workType}`)}
                        </p>
                        <p className="text-xs text-stone-500">
                          {t(`dental.materials.${group.material}`)} • VITA {group.color}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[120px]">
                        {group.teeth.slice(0, 6).map((num: number) => (
                          <span key={num} className="w-5 h-5 rounded bg-white text-[10px] flex items-center justify-center text-stone-600 font-medium border border-stone-100">
                            {num}
                          </span>
                        ))}
                        {group.teeth.length > 6 && (
                          <span className="w-5 h-5 rounded bg-white text-[10px] flex items-center justify-center text-stone-400 border border-stone-100">
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
                <h3 className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider">Note</h3>
                <p className="p-4 bg-orange-50/70 border border-amber-100 rounded-xl text-stone-700 text-sm leading-relaxed">
                  {caseData.notes}
                </p>
              </div>
            )}

            {/* Patient Notes */}
            {caseData.patientNotes && (
              <div className="mt-4">
                <h3 className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider">Note Paziente</h3>
                <p className="p-4 bg-red-50/70 border border-red-100 rounded-xl text-red-700 text-sm leading-relaxed">
                  ⚠️ {caseData.patientNotes}
                </p>
              </div>
            )}
          </div>

          {/* Files Section */}
          <div className="bg-white rounded-xl border border-stone-100 shadow-soft p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-stone-800 flex items-center gap-2 font-display">
                <span className="w-8 h-8 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center">
                  <FileText size={16} />
                </span>
                File Allegati ({files.length})
              </h3>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-800 text-white rounded-xl text-xs font-medium hover:bg-sky-700 transition-colors disabled:opacity-60 shadow-sm"
              >
                {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                {isUploading ? t('common.uploading', 'Caricamento...') : t('common.uploadFile', 'Carica file')}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".stl,.ply,.jpg,.jpeg,.png,.heic,.webp"
                onChange={handleUploadFile}
              />
            </div>
            {files.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-6">{t('cases.noFiles', 'Nessun file allegato')}</p>
            ) : (
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-3 bg-stone-50/50 rounded-xl border border-stone-100 hover:bg-stone-50 transition-colors group"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                      ${file.type === 'stl' || file.type === 'ply' ? 'bg-orange-50 text-amber-800' :
                        file.type === 'image' ? 'bg-green-50 text-green-800' :
                        'bg-stone-100 text-stone-600'}`}>
                      {file.type === 'stl' || file.type === 'ply' ? <Box size={18} /> :
                       file.type === 'image' ? <Image size={18} /> :
                       <FileText size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-800 text-sm truncate">{file.name}</p>
                      <p className="text-xs text-stone-500">{file.size} • {file.date}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {(file.type === 'image') && (
                        <button
                          onClick={() => handlePreviewFile(file.id, file.type)}
                          className="w-8 h-8 rounded-lg bg-white border border-stone-100 flex items-center justify-center text-stone-500 hover:text-amber-800 transition-colors"
                          title={t('notifications.view')}
                        >
                          <Eye size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadFile(file.id, file.fileName || file.name)}
                        className="w-8 h-8 rounded-lg bg-white border border-stone-100 flex items-center justify-center text-stone-500 hover:text-amber-800 transition-colors"
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
        <div className="space-y-5">
          {/* Client Info Card */}
          <div className="bg-white rounded-xl border border-stone-100 shadow-soft p-5">
            <div className="flex items-center gap-3 mb-4">
              <ClientAvatar
                studioName={caseData.client.name}
                logoUrl={caseData.client.logoUrl}
                size={44}
                rounded="rounded-xl"
              />
              <div className="min-w-0">
                <p className="font-semibold text-stone-800 text-sm font-display truncate">{caseData.client.name}</p>
                <p className="text-xs text-stone-500">{caseData.client.contact}</p>
              </div>
            </div>
            <div className="space-y-2.5">
              <a href={`tel:${caseData.client.phone}`} className="flex items-center gap-3 text-sm text-stone-600 hover:text-amber-800 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-stone-50 flex items-center justify-center shrink-0">
                  <Phone size={16} className="text-stone-400" />
                </div>
                {caseData.client.phone}
              </a>
              <a href={`mailto:${caseData.client.email}`} className="flex items-center gap-3 text-sm text-stone-600 hover:text-amber-800 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-stone-50 flex items-center justify-center shrink-0">
                  <Mail size={16} className="text-stone-400" />
                </div>
                {caseData.client.email}
              </a>
            </div>
          </div>

          {/* Vertical Chat */}
          <div className="bg-white rounded-xl border border-stone-100 shadow-soft overflow-hidden flex flex-col">
            <div className="p-3 border-b border-stone-100 bg-stone-50/50">
              <h3 className="font-semibold text-sm text-stone-800 flex items-center gap-2 font-display">
                <MessageSquare size={16} className="text-amber-800" />
                {t('cases.chatTab', { defaultValue: 'Chat' })}
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
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-stone-900/40 backdrop-blur-sm pt-12">
          <div className="bg-white rounded-xl shadow-elevated w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-green-800 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Receipt className="text-white" size={20} />
                </div>
                <h3 className="text-white font-semibold font-display">Resoconto Costi</h3>
              </div>
              <button
                onClick={() => setShowFinancialModal(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
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
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-stone-100 last:border-0">
                      <div>
                        <p className="font-medium text-sm text-stone-800">{t(`dental.workTypes.${group.workType}`)}</p>
                        <p className="text-xs text-stone-500">{group.count}x {t(`dental.materials.${group.material}`)}</p>
                      </div>
                      <p className="font-semibold text-stone-800">₪{group.total}</p>
                    </div>
                  ));
                })()}
              </div>
              <div className="pt-4 border-t-2 border-stone-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-stone-800 font-display">Totale</span>
                  <span className="text-2xl font-bold text-green-800 font-display">₪{caseData.totalPrice}</span>
                </div>
                <p className="text-xs text-stone-500 text-right mt-1">{caseData.teeth.length} lavorazioni</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3D Viewer Modal */}
      <Viewer3DModal
        isOpen={showViewer3DModal}
        onClose={() => setShowViewer3DModal(false)}
        caseId={id || ''}
        title={caseData.client?.name}
        subtitle={caseData.patient}
      />

      {/* WhatsApp Verification Result Modal */}
      {showWaModal && waResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-elevated w-full max-w-lg overflow-hidden">
            <div
              className={`p-4 flex items-center justify-between ${
                waResult.verification.status === 'verified' ? 'bg-green-800' : 'bg-amber-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${waResult.verification.status === 'verified' ? 'bg-white/20' : 'bg-white/20'}`}>
                  {waResult.verification.status === 'verified' ? (
                    <CheckCircle2 className="text-white" size={20} />
                  ) : (
                    <AlertTriangle className="text-white" size={20} />
                  )}
                </div>
                <div>
                  <h3 className="text-white font-semibold font-display">
                    Caso {waResult.caseNumber} —{' '}
                    {waResult.verification.status === 'verified' ? 'completo' : 'incompleto'}
                  </h3>
                  <p className="text-white/70 text-xs">Verifica WhatsApp Agent</p>
                </div>
              </div>
              <button
                onClick={() => setShowWaModal(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {waResult.verification.missingItems.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold text-stone-600 mb-2">Dati mancanti</p>
                  <ul className="space-y-1.5">
                    {waResult.verification.missingItems.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-stone-700 bg-orange-50 rounded-xl px-3 py-2 border border-amber-100"
                      >
                        <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="bg-green-50 rounded-xl px-3 py-2 text-sm text-teal-700 flex items-center gap-2 border border-teal-100">
                  <CheckCircle2 size={16} />
                  Tutti i dati del caso sono completi.
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-stone-600 mb-2">Esito invio</p>
                {waResult.sendOutcome.skipped ? (
                  <div className="bg-stone-50 rounded-xl px-3 py-2 text-sm text-stone-700 border border-stone-100">
                    Nessun messaggio inviato.{' '}
                    <span className="text-stone-500">
                      Motivo:{' '}
                      <code className="text-xs bg-white px-1 py-0.5 rounded border border-stone-100">
                        {waResult.sendOutcome.reason}
                      </code>
                    </span>
                  </div>
                ) : (
                  <div
                    className={`rounded-xl px-3 py-2 text-sm border ${
                      waResult.sendOutcome.shadowOnly
                        ? 'bg-orange-50 text-sky-800 border-sky-100'
                        : 'bg-green-50 text-teal-800 border-teal-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {waResult.sendOutcome.shadowOnly ? (
                        <>
                          <MessageCircle size={14} />
                          <span className="font-semibold">Salvato in modalità SHADOW</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={14} />
                          <span className="font-semibold">Inviato via WhatsApp</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs">
                      Template:{' '}
                      <code className="bg-white px-1 py-0.5 rounded border border-stone-100">
                        {waResult.verification.recommendedTemplate}
                      </code>
                    </p>
                    <p className="text-xs mt-1">
                      Stato: <code className="bg-white px-1 py-0.5 rounded border border-stone-100">{waResult.sendOutcome.status}</code>
                    </p>
                    <p className="text-[11px] text-stone-500 mt-2">
                      Vedi il messaggio renderizzato in /admin/whatsapp
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Link
                  to="/admin/whatsapp"
                  className="px-3 py-2 rounded-xl bg-amber-800 text-white text-sm font-medium hover:bg-sky-700 transition-colors shadow-sm"
                  onClick={() => setShowWaModal(false)}
                >
                  Apri WhatsApp Log
                </Link>
                <button
                  onClick={() => setShowWaModal(false)}
                  className="px-3 py-2 rounded-xl bg-stone-100 text-stone-700 text-sm font-medium hover:bg-stone-200 transition-colors"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
