import { useState, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n/config';
import { Link, useNavigate } from 'react-router-dom';
import caseService from '../../../services/case.service';
import pdfService from '../../../services/pdf.service';
import { useToast } from '../../../components/ui/use-toast';
import {
  Plus,
  Search,
  Eye,
  Calendar,
  Box,
  FileText,
  Printer,
  X,
  ChevronDown,
  ChevronRight,
  Check,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  ExternalLink,
} from 'lucide-react';

// Lazy load 3D viewer to avoid loading Three.js on every page
const Dental3DViewer = lazy(() => import('@/components/viewer3d/Dental3DViewer'));

const statusFilters = [
  { value: 'all', label: 'invoices.filterAll', color: 'bg-slate-500', navClass: 'nav-pill' },
  { value: 'received', label: 'cases.statuses.received', color: 'bg-blue-500', navClass: 'bg-blue-500 text-white' },
  { value: 'in_progress', label: 'cases.statuses.in_progress', color: 'bg-amber-500', navClass: 'bg-amber-500 text-white' },
  { value: 'qc', label: 'cases.statuses.qc', color: 'bg-violet-500', navClass: 'bg-violet-500 text-white' },
  { value: 'shipped', label: 'cases.statuses.shipped', color: 'bg-emerald-500', navClass: 'bg-emerald-500 text-white' },
];

const priorityFilters = [
  { value: 'all', label: 'invoices.filterAll', color: 'bg-slate-400', navClass: 'nav-pill' },
  { value: 'normal', label: 'cases.priorities.normal', color: 'bg-emerald-500', navClass: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'urgent', label: 'cases.priorities.urgent', color: 'bg-amber-500', navClass: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'rush', label: 'cases.priorities.rush', color: 'bg-red-500', navClass: 'bg-red-100 text-red-700 border-red-200' },
];

const statusOptions = [
  { value: 'received', label: 'cases.statuses.received', color: 'bg-blue-500' },
  { value: 'in_progress', label: 'cases.statuses.in_progress', color: 'bg-amber-500' },
  { value: 'qc', label: 'cases.statuses.qc', color: 'bg-violet-500' },
  { value: 'shipped', label: 'cases.statuses.shipped', color: 'bg-emerald-500' },
];

const priorityOptions = [
  { value: 'normal', label: 'cases.priorities.normal', color: 'bg-emerald-500' },
  { value: 'urgent', label: 'cases.priorities.urgent', color: 'bg-amber-500' },
  { value: 'rush', label: 'cases.priorities.rush', color: 'bg-red-500' },
];

type SortField = 'client' | 'patient' | 'caseNumber' | 'dueDate';
type SortDirection = 'asc' | 'desc';

// Helper to format API data for display
const formatCaseForDisplay = (apiCase: any) => {
  const clientName = apiCase.client?.studioName || i18n.t('common.noData');
  const clientInitial = clientName.charAt(0).toUpperCase();

  // Generate a consistent color based on client name
  const colors = ['bg-card-yellow', 'bg-card-teal', 'bg-card-navy', 'bg-card-olive', 'bg-card-rose'];
  const colorIndex = clientName.charCodeAt(0) % colors.length;

  // Format teeth numbers
  const teethList = apiCase.teeth?.map((t: any) => t.toothNumber).join(', ') || i18n.t('common.noData');

  // Get first work type and material
  const firstTooth = apiCase.teeth?.[0];
  const workDetails = firstTooth
    ? `${firstTooth.workType} ${firstTooth.material}`
    : i18n.t('common.noData');

  // Format dates
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  };

  // Get 3D files
  const model3DFiles = (apiCase.files || []).filter((f: any) => f.fileType === 'stl' || f.fileType === 'ply');

  return {
    id: apiCase.id, // Use UUID for routing
    caseNumber: apiCase.caseNumber, // Display caseNumber separately
    client: clientName,
    clientInitial,
    clientColor: colors[colorIndex],
    patient: apiCase.patientName || i18n.t('common.noData'),
    receivedDate: formatDate(apiCase.receivedDate),
    workDetails,
    teeth: teethList,
    teethCount: apiCase.teeth?.length || 0,
    dueDate: formatDate(apiCase.dueDate),
    dueDateRaw: apiCase.dueDate,
    priority: apiCase.priority,
    status: apiCase.status,
    has3D: model3DFiles.length > 0,
    model3DFiles,
    price: apiCase.totalPrice ? `₪${apiCase.totalPrice}` : i18n.t('common.noData'),
    totalPrice: apiCase.totalPrice || 0,
    _raw: apiCase, // Keep original for modals
  };
};

// Quick View Modal Component
function QuickViewModal({
  caseItem,
  onClose,
  onOpenFull,
}: {
  caseItem: any;
  onClose: () => void;
  onOpenFull: () => void;
}) {
  const { t } = useTranslation();

  if (!caseItem) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-start justify-center bg-stone-200/80 backdrop-blur-sm md:pt-12 pt-0">
      <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-4xl mx-0 md:mx-4 overflow-hidden max-h-[85dvh] md:max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-brand-primary p-4 flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm">{caseItem.caseNumber}</p>
            <h3 className="text-white font-semibold text-lg">{caseItem.patient}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-8 space-y-6 overflow-y-auto flex-1">
          {/* Client */}
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl ${caseItem.clientColor} flex items-center justify-center text-white font-bold text-2xl`}>
              {caseItem.clientInitial}
            </div>
            <div>
              <p className="text-sm text-neutral-500">{t('cases.studio')}</p>
              <p className="font-semibold text-neutral-800 text-xl">{caseItem.client}</p>
            </div>
          </div>

          {/* Work Details */}
          <div className="bg-surface-secondary rounded-2xl p-6">
            <p className="text-sm text-neutral-500 mb-3">{t('cases.workLabel')}</p>
            <p className="font-semibold text-neutral-800 text-lg">{caseItem.workDetails}</p>
            <p className="text-sm text-neutral-500 mt-2">{t('cases.teethLabel')} {caseItem.teeth}</p>
          </div>

          {/* Grid Info */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-2xl p-4">
              <p className="text-sm text-blue-600 mb-2">{t('cases.dueLabel')}</p>
              <p className="font-semibold text-blue-800 text-lg">{caseItem.dueDate}</p>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-4">
              <p className="text-sm text-emerald-600 mb-2">{t('cases.total')}</p>
              <p className="font-semibold text-emerald-800 text-lg">{caseItem.price}</p>
            </div>
          </div>

          {/* Status & Priority */}
          <div className="flex items-center gap-3">
            <span className={`badge badge-${caseItem.status} text-sm px-4 py-2`}>
              {t(`cases.statuses.${caseItem.status}`)}
            </span>
            <span className={`badge badge-priority-${caseItem.priority} text-sm px-4 py-2`}>
              {t(`cases.priorities.${caseItem.priority}`)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 btn-secondary"
          >
            Chiudi
          </button>
          <button
            onClick={onOpenFull}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            <ExternalLink size={16} />
            Apri pagina completa
          </button>
        </div>
      </div>
    </div>
  );
}

// PDF Preview Modal Component
function PDFPreviewModal({
  caseItem,
  onClose,
}: {
  caseItem: any;
  onClose: () => void;
}) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const generatePreview = async () => {
      if (!caseItem?._raw) {
        setError(t('cases.caseDataUnavailable'));
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        // Generate PDF and get blob URL for preview
        const doc = await pdfService.generateCasePDFBlob(caseItem._raw);
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
  }, [caseItem]);

  const handlePrint = () => {
    if (caseItem?._raw) {
      pdfService.generateCasePDF(caseItem._raw);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-start justify-center bg-stone-200/80 backdrop-blur-sm md:pt-12 pt-0">
      <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-5xl mx-0 md:mx-4 overflow-hidden flex flex-col max-h-[90dvh] md:max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="text-white" size={24} />
            <div>
              <h3 className="text-white font-semibold">{t('cases.pdfPreview')}</h3>
              <p className="text-white/70 text-sm">{caseItem?.caseNumber} - {caseItem?.patient}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Preview Area */}
        <div className="flex-1 bg-neutral-100 p-4 overflow-auto">
          {loading ? (
            <div className="h-[500px] flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
                <p className="mt-4 text-neutral-500">Generazione PDF...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-[500px] flex items-center justify-center">
              <div className="text-center">
                <p className="text-red-500 font-medium">{t('cases.errorGeneratingPdf')}</p>
                <p className="text-neutral-400 text-sm mt-2">{error}</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-[65vh] bg-white shadow-lg"
              title={t('cases.pdfPreview')}
            />
          ) : (
            <div className="h-[500px] flex items-center justify-center">
              <p className="text-neutral-500">PDF non disponibile</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 btn-secondary"
          >
            Chiudi
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            <Printer size={16} />
            {t('cases.printPdf')}
          </button>
        </div>
      </div>
    </div>
  );
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// 3D Viewer Modal Component
function Viewer3DModal({
  caseItem,
  onClose,
}: {
  caseItem: any;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const modelFiles = caseItem?.model3DFiles || [];

  // Auto-select first file
  useEffect(() => {
    if (modelFiles.length > 0 && !selectedFile) {
      setSelectedFile(modelFiles[0]);
    }
  }, [modelFiles]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-start justify-center bg-stone-200/80 backdrop-blur-sm md:pt-12 pt-0">
      <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-6xl mx-0 md:mx-4 overflow-hidden flex flex-col max-h-[90dvh] md:max-h-[85vh]">
        {/* Header */}
        <div className="bg-card-navy p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Box className="text-white" size={24} />
            <div>
              <h3 className="text-white font-semibold">Visualizzatore 3D</h3>
              <p className="text-white/70 text-sm">{caseItem?.caseNumber} - {caseItem?.patient}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Sidebar - File List */}
          <div className="w-full md:w-64 bg-surface-secondary p-4 border-b md:border-b-0 md:border-r border-neutral-200 shrink-0 max-h-[30vh] md:max-h-none overflow-y-auto">
            <h4 className="font-medium text-neutral-800 mb-3 flex items-center gap-2">
              <Box size={16} />
              {t('cases.threeDFiles', { count: modelFiles.length })}
            </h4>
            <div className="space-y-2">
              {modelFiles.map((file: any) => (
                <button
                  key={file.id}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    selectedFile?.id === file.id
                      ? 'bg-brand-primary text-white'
                      : 'bg-white hover:bg-neutral-100 text-neutral-700'
                  }`}
                >
                  <p className={`font-medium text-sm truncate ${selectedFile?.id === file.id ? 'text-white' : 'text-neutral-800'}`}>
                    {file.fileName}
                  </p>
                  <p className={`text-xs ${selectedFile?.id === file.id ? 'text-white/70' : 'text-neutral-500'}`}>
                    {(file.fileSize / 1024 / 1024).toFixed(1)} MB
                  </p>
                </button>
              ))}
            </div>

            {/* Download All */}
            <div className="mt-4 pt-4 border-t border-neutral-200">
              <p className="text-xs text-neutral-500 mb-2">Download</p>
              {modelFiles.map((file: any) => (
                <a
                  key={file.id}
                  href={`${API_BASE}/files/${file.id}/download`}
                  download
                  className="flex items-center gap-2 text-sm text-brand-primary hover:underline mb-1"
                >
                  <Download size={14} />
                  {file.fileName}
                </a>
              ))}
            </div>
          </div>

          {/* 3D Viewer */}
          <div className="flex-1 bg-[#5D5A87] min-h-0">
            {selectedFile ? (
              <Suspense
                fallback={
                  <div className="h-full min-h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                      <p className="mt-4 text-white">Caricamento viewer 3D...</p>
                    </div>
                  </div>
                }
              >
                <div className="h-full min-h-[300px]">
                  <Dental3DViewer
                    files={[
                      { id: selectedFile.id, url: `${API_BASE}/files/${selectedFile.id}/preview`, name: selectedFile.fileName || t('cases.threeDFiles', { count: 1 }) }
                    ]}
                    caseId={caseItem?.id}
                  />
                </div>
              </Suspense>
            ) : (
              <div className="h-full min-h-[300px] flex items-center justify-center">
                <div className="text-center text-white">
                  <Box size={48} className="mx-auto mb-4 opacity-50" />
                  <p>{t('cases.no3DFilesSelected')}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 flex justify-end">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}

// Sortable Header Component
function SortableHeader({
  label,
  field,
  currentSort,
  onSort,
}: {
  label: string;
  field: SortField;
  currentSort: { field: SortField; direction: SortDirection };
  onSort: (field: SortField) => void;
}) {
  const isActive = currentSort.field === field;

  return (
    <th
      onClick={() => onSort(field)}
      className="cursor-pointer hover:bg-surface-secondary/80 transition-colors select-none"
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive ? (
          currentSort.direction === 'asc' ? (
            <ArrowUp size={14} className="text-brand-primary" />
          ) : (
            <ArrowDown size={14} className="text-brand-primary" />
          )
        ) : (
          <ArrowUpDown size={14} className="text-neutral-400" />
        )}
      </div>
    </th>
  );
}

// Editable Badge Component
function EditableBadge({
  type,
  value,
  options,
  onChange,
}: {
  type: 'status' | 'priority';
  value: string;
  options: typeof statusOptions | typeof priorityOptions;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  const getBadgeClass = () => {
    if (type === 'status') {
      const styles: Record<string, string> = {
        received: 'badge badge-received',
        in_progress: 'badge badge-in-progress',
        qc: 'badge badge-qc',
        shipped: 'badge badge-shipped',
      };
      return styles[value] || 'badge';
    } else {
      const styles: Record<string, string> = {
        normal: 'badge badge-priority-normal',
        urgent: 'badge badge-priority-urgent',
        rush: 'badge badge-priority-rush',
      };
      return styles[value] || 'badge';
    }
  };

  const getLabel = () => {
    if (type === 'status') {
      return t(`cases.statuses.${value}`);
    } else {
      return t(`cases.priorities.${value}`);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`${getBadgeClass()} flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity`}
      >
        {getLabel()}
        <ChevronDown size={12} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-soft-lg p-2 z-50">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                  ${value === option.value ? 'bg-surface-secondary' : 'hover:bg-surface-secondary'}`}
              >
                <div className={`w-3 h-3 rounded-full ${option.color}`} />
                {option.label}
                {value === option.value && <Check size={14} className="ml-auto text-brand-primary" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function CaseList() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');
  const [activePriorityFilter, setActivePriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ field: SortField; direction: SortDirection }>({
    field: 'dueDate',
    direction: 'asc',
  });

  // Modal states
  const [quickViewCase, setQuickViewCase] = useState<any>(null);
  const [pdfPreviewCase, setPdfPreviewCase] = useState<any>(null);
  const [viewer3DCase, setViewer3DCase] = useState<any>(null);

  // Load cases from API
  useEffect(() => {
    const loadCases = async () => {
      try {
        setLoading(true);
        const data = await caseService.getCases({
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });
        // Format API data for display
        const formattedCases = data.map(formatCaseForDisplay);
        setCases(formattedCases);
      } catch (error) {
        console.error('Error loading cases:', error);
        toast({
          title: t('common.error'),
          description: t('cases.errorLoadingCases'),
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadCases();
  }, []);

  const handleSort = (field: SortField) => {
    setSortConfig((current) => ({
      field,
      direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleStatusChange = async (caseId: string, newStatus: string) => {
    try {
      await caseService.updateCaseStatus(caseId, newStatus as any);
      setCases((prev) =>
        prev.map((c) => (c.id === caseId ? { ...c, status: newStatus } : c))
      );
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

  const handlePriorityChange = async (caseId: string, newPriority: string) => {
    try {
      await caseService.updateCase(caseId, { priority: newPriority as any });
      setCases((prev) =>
        prev.map((c) => (c.id === caseId ? { ...c, priority: newPriority } : c))
      );
      toast({
        title: t('common.success'),
        description: t('cases.priorityUpdated'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('cases.cannotUpdatePriority'),
        variant: 'destructive',
      });
    }
  };

  const handleRowClick = (caseId: string) => {
    navigate(`/admin/cases/${caseId}`);
  };

  // Filter and sort cases
  const filteredAndSortedCases = cases
    .filter((c) => {
      if (activeStatusFilter !== 'all' && c.status !== activeStatusFilter) return false;
      if (activePriorityFilter !== 'all' && c.priority !== activePriorityFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const caseNumber = c.caseNumber?.toLowerCase() || '';
        const clientName = c.client?.toLowerCase() || '';
        const patientName = c.patient?.toLowerCase() || '';

        if (
          !caseNumber.includes(query) &&
          !clientName.includes(query) &&
          !patientName.includes(query)
        ) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      const { field, direction } = sortConfig;
      let comparison = 0;

      switch (field) {
        case 'client':
          comparison = a.client.localeCompare(b.client);
          break;
        case 'patient':
          comparison = a.patient.localeCompare(b.patient);
          break;
        case 'caseNumber':
          comparison = a.caseNumber.localeCompare(b.caseNumber);
          break;
        case 'dueDate':
          comparison = new Date(a.dueDateRaw).getTime() - new Date(b.dueDateRaw).getTime();
          break;
      }

      return direction === 'asc' ? comparison : -comparison;
    });

  const stats = {
    total: cases.length,
    status: {
      received: cases.filter((c) => c.status === 'received').length,
      in_progress: cases.filter((c) => c.status === 'in_progress').length,
      qc: cases.filter((c) => c.status === 'qc').length,
      shipped: cases.filter((c) => c.status === 'shipped').length,
    },
    priority: {
      normal: cases.filter((c) => c.priority === 'normal').length,
      urgent: cases.filter((c) => c.priority === 'urgent').length,
      rush: cases.filter((c) => c.priority === 'rush').length,
    },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Compact Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {/* Status Filters */}
        {statusFilters.map((filter) => {
          const count = filter.value === 'all'
            ? stats.total
            : stats.status[filter.value as keyof typeof stats.status] || 0;
          const isActive = activeStatusFilter === filter.value;

          return (
            <button
              key={filter.value}
              onClick={() => setActiveStatusFilter(filter.value)}
              className={`
                shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                transition-all duration-200
                ${isActive
                  ? filter.navClass
                  : 'bg-white text-neutral-600 hover:bg-neutral-100'
                }
              `}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${filter.color}`} />
              {t(filter.label)}
              <span
                className={`text-[10px] px-1 py-0 rounded-full min-w-[16px] text-center ${
                  isActive ? 'bg-white/30' : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}

        <div className="w-px h-5 bg-neutral-200 shrink-0 mx-1" />

        {/* Priority Filters */}
        {priorityFilters.map((filter) => {
          const count = filter.value === 'all'
            ? stats.total
            : stats.priority[filter.value as keyof typeof stats.priority] || 0;
          const isActive = activePriorityFilter === filter.value;

          return (
            <button
              key={filter.value}
              onClick={() => setActivePriorityFilter(filter.value)}
              className={`
                shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                transition-all duration-200 border
                ${isActive
                  ? filter.navClass
                  : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                }
              `}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${filter.color}`} />
              {t(filter.label)}
              <span
                className={`text-[10px] px-1 py-0 rounded-full min-w-[16px] text-center ${
                  isActive ? 'bg-white/50' : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}

        <div className="flex-1" />

        <Link
          to="/admin/cases/new"
          className="shrink-0 btn-primary flex items-center gap-1 text-xs px-3 py-1.5 rounded-full"
        >
          <Plus size={14} />
          {t('cases.newCase')}
        </Link>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-modern pl-11"
          />
        </div>
      </div>

      {/* Cases Table / Cards */}
      {loading ? (
        <div className="card-base p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
          <p className="mt-4 text-neutral-500">Caricamento casi...</p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredAndSortedCases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 active:scale-[0.98] transition-transform"
                onClick={() => handleRowClick(caseItem.id)}
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-2.5">
                  <div className={`w-9 h-9 rounded-xl ${caseItem.clientColor} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                    {caseItem.clientInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-neutral-800 truncate">{caseItem.client}</p>
                    <p className="text-xs text-neutral-500 truncate">{caseItem.patient}</p>
                  </div>
                  <ChevronRight size={16} className="text-neutral-300 shrink-0" />
                </div>

                {/* Work + Case Number */}
                <div className="mb-2.5">
                  <p className="text-sm text-neutral-700 font-medium">{caseItem.workDetails}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-neutral-400 font-mono">#{caseItem.caseNumber}</span>
                    <span className="text-xs text-neutral-400">• Denti: {caseItem.teeth}</span>
                  </div>
                </div>

                {/* Date + Badges row */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-neutral-500 flex items-center gap-1">
                    <Calendar size={12} />
                    {caseItem.dueDate}
                  </span>
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      caseItem.priority === 'normal' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      caseItem.priority === 'urgent' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {t(`cases.priorities.${caseItem.priority}`)}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      caseItem.status === 'received' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      caseItem.status === 'in_progress' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                      caseItem.status === 'qc' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                      'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      {t(`cases.statuses.${caseItem.status}`)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-neutral-100" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setQuickViewCase(caseItem); }}
                    className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 active:bg-slate-100"
                    title={t('cases.quickView')}
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setPdfPreviewCase(caseItem); }}
                    className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 active:bg-slate-100"
                    title={t('cases.pdfPreview')}
                  >
                    <FileText size={16} />
                  </button>
                  {caseItem.has3D && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setViewer3DCase(caseItem); }}
                      className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-violet-500 active:bg-violet-50"
                      title={t('viewer3d.view3D')}
                    >
                      <Box size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {filteredAndSortedCases.length === 0 && (
              <div className="py-12 text-center text-neutral-500 text-sm">{t('common.noResults')}</div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block card-base overflow-x-auto">
            <table className="table-modern w-full min-w-max">
              <thead>
                <tr className="bg-surface-secondary/50">
                  <SortableHeader
                    label={t('cases.client')}
                    field="client"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label={t('cases.patient')}
                    field="patient"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label={t('cases.caseNumber')}
                    field="caseNumber"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                  <th>{t('cases.workDetails')}</th>
                  <SortableHeader
                    label={t('cases.dueDate')}
                    field="dueDate"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                  <th>{t('cases.priority')}</th>
                  <th>{t('cases.status')}</th>
                  <th className="text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedCases.map((caseItem, index) => (
                  <tr
                    key={caseItem.id}
                    className={`group cursor-pointer transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-100'
                    } hover:bg-blue-50`}
                    onClick={() => handleRowClick(caseItem.id)}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl ${caseItem.clientColor} flex items-center justify-center text-white font-medium`}
                        >
                          {caseItem.clientInitial}
                        </div>
                        <span className="font-medium text-neutral-800">{caseItem.client}</span>
                      </div>
                    </td>
                    <td className="text-neutral-600">{caseItem.patient}</td>
                    <td>
                      <span className="font-mono text-sm text-neutral-800">
                        {caseItem.caseNumber}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-neutral-800">{caseItem.workDetails}</p>
                          <p className="text-xs text-neutral-400">Denti: {caseItem.teeth}</p>
                        </div>
                        {/* Action Buttons - Small & Subtle */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPdfPreviewCase(caseItem);
                            }}
                            className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            title={t('cases.pdfPreview')}
                          >
                            <FileText size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (caseItem._raw) {
                                pdfService.generateCasePDF(caseItem._raw);
                              }
                            }}
                            className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            title={t('cases.printPdf')}
                          >
                            <Printer size={12} />
                          </button>
                          {caseItem.has3D && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewer3DCase(caseItem);
                              }}
                              className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-violet-500 hover:bg-violet-50 transition-colors"
                              title={t('viewer3d.view3D')}
                            >
                              <Box size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-neutral-600">
                        <Calendar size={14} className="text-neutral-400" />
                        {caseItem.dueDate}
                      </div>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <EditableBadge
                        type="priority"
                        value={caseItem.priority}
                        options={priorityOptions}
                        onChange={(value) => handlePriorityChange(caseItem.id, value)}
                      />
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <EditableBadge
                        type="status"
                        value={caseItem.status}
                        options={statusOptions}
                        onChange={(value) => handleStatusChange(caseItem.id, value)}
                      />
                    </td>
                    <td>
                      <div className="flex items-center justify-end">
                        {/* Quick View (Eye) - Opens popup, not navigation */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuickViewCase(caseItem);
                          }}
                          className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center text-neutral-500 hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
                          title={t('cases.quickView')}
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredAndSortedCases.length === 0 && (
              <div className="py-12 text-center text-neutral-500">{t('common.noResults')}</div>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      {quickViewCase && (
        <QuickViewModal
          caseItem={quickViewCase}
          onClose={() => setQuickViewCase(null)}
          onOpenFull={() => {
            setQuickViewCase(null);
            navigate(`/admin/cases/${quickViewCase.id}`);
          }}
        />
      )}

      {pdfPreviewCase && (
        <PDFPreviewModal
          caseItem={pdfPreviewCase}
          onClose={() => setPdfPreviewCase(null)}
        />
      )}

      {viewer3DCase && (
        <Viewer3DModal
          caseItem={viewer3DCase}
          onClose={() => setViewer3DCase(null)}
        />
      )}
    </div>
  );
}
