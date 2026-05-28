import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n/config';
import { Link, useNavigate } from 'react-router-dom';
import caseService from '../../../services/case.service';
import pdfService from '../../../services/pdf.service';
import { useToast } from '../../../components/ui/use-toast';
import { ClientAvatar } from '@/components/common/ClientAvatar';
import { getDateLocale } from '@/utils/locale';
import {
  Plus,
  Search,
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
} from 'lucide-react';
import { Viewer3DModal } from '@/components/viewer3d/Viewer3DModal';

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
  const clientLogoUrl = apiCase.client?.logoUrl ?? null;

  // Format teeth numbers
  const teethList = apiCase.teeth?.map((t: any) => t.toothNumber).join(', ') || i18n.t('common.noData');

  // Get first work type and material
  const firstTooth = apiCase.teeth?.[0];
  const workDetails = firstTooth
    ? `${firstTooth.workType} ${firstTooth.material}`
    : i18n.t('common.noData');

  // Format dates — return '—' when the input is empty/null/undefined so
  // cases without a due date don't render as "1 gen".
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(getDateLocale(), { day: 'numeric', month: 'short' });
  };

  // Get 3D files
  const model3DFiles = (apiCase.files || []).filter((f: any) => f.fileType === 'stl' || f.fileType === 'ply');

  return {
    id: apiCase.id, // Use UUID for routing
    caseNumber: apiCase.caseNumber, // Display caseNumber separately
    client: clientName,
    clientLogoUrl,
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
                {t(option.label)}
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
          {
            // Sort cases without a due date to the end
            const aTime = a.dueDateRaw ? new Date(a.dueDateRaw).getTime() : Number.POSITIVE_INFINITY;
            const bTime = b.dueDateRaw ? new Date(b.dueDateRaw).getTime() : Number.POSITIVE_INFINITY;
            comparison = aTime - bTime;
          }
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
      {/* Compact Filter Bar — scrollable on mobile with fade edges */}
      <div className="relative -mx-2 px-2">
        <div className="pointer-events-none absolute inset-y-0 start-0 w-4 bg-gradient-to-r from-mesh-shen3d/95 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 end-0 w-4 bg-gradient-to-l from-mesh-shen3d/95 to-transparent z-10" />
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
          <p className="mt-4 text-neutral-500">{t('common.loading')}</p>
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
                {/* Header — Cliente + Paziente primary */}
                <div className="flex items-center gap-3 mb-2">
                  <ClientAvatar
                    studioName={caseItem.client}
                    logoUrl={caseItem.clientLogoUrl}
                    size={36}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-neutral-800 truncate">{caseItem.client}</p>
                    <p className="text-xs text-neutral-600 truncate">{caseItem.patient}</p>
                  </div>
                  <ChevronRight size={16} className="text-neutral-300 shrink-0" />
                </div>

                {/* Work type + teeth count, case number secondary */}
                <div className="mb-2 pl-12">
                  <p className="text-sm text-neutral-700">
                    {caseItem.workDetails}
                    <span className="text-neutral-400"> · {caseItem.teethCount} {t('dental.tooth', { count: caseItem.teethCount })}</span>
                  </p>
                  <p className="text-[10px] font-mono text-neutral-400 mt-0.5">#{caseItem.caseNumber}</p>
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
                    onClick={(e) => { e.stopPropagation(); setPdfPreviewCase(caseItem); }}
                    className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 active:bg-slate-200"
                    title={t('cases.pdfPreview')}
                  >
                    <FileText size={18} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (caseItem._raw) pdfService.generateCasePDF(caseItem._raw); }}
                    className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 active:bg-slate-200"
                    title={t('cases.printPdf')}
                  >
                    <Printer size={18} />
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
                  <th>{t('cases.workDetails')}</th>
                  <SortableHeader
                    label={t('cases.dueDate')}
                    field="dueDate"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                  <th>{t('cases.priority')}</th>
                  <th>{t('cases.status')}</th>
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
                        <ClientAvatar
                          studioName={caseItem.client}
                          logoUrl={caseItem.clientLogoUrl}
                          size={40}
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-neutral-800 truncate">{caseItem.client}</p>
                          <p className="text-[10px] font-mono text-neutral-400">#{caseItem.caseNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-neutral-700 font-medium">{caseItem.patient}</td>
                    <td>
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-neutral-800">
                            {caseItem.workDetails}
                            <span className="text-neutral-400"> · {caseItem.teethCount} {t('dental.tooth', { count: caseItem.teethCount })}</span>
                          </p>
                          <p className="text-xs text-neutral-400">Denti: {caseItem.teeth}</p>
                        </div>
                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPdfPreviewCase(caseItem);
                            }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                            title={t('cases.pdfPreview')}
                          >
                            <FileText size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (caseItem._raw) {
                                pdfService.generateCasePDF(caseItem._raw);
                              }
                            }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                            title={t('cases.printPdf')}
                          >
                            <Printer size={16} />
                          </button>
                          {caseItem.has3D && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewer3DCase(caseItem);
                              }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-violet-600 bg-violet-50 hover:bg-violet-100 transition-colors"
                              title={t('viewer3d.view3D')}
                            >
                              <Box size={16} />
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
      {pdfPreviewCase && (
        <PDFPreviewModal
          caseItem={pdfPreviewCase}
          onClose={() => setPdfPreviewCase(null)}
        />
      )}

      {viewer3DCase && (
        <Viewer3DModal
          isOpen={!!viewer3DCase}
          onClose={() => setViewer3DCase(null)}
          title={viewer3DCase.client}
          subtitle={viewer3DCase.patient}
          files={(viewer3DCase.model3DFiles || []).map((f: any) => ({
            id: f.id,
            url: `${API_BASE}/files/${f.id}/preview`,
            name: f.fileName,
          }))}
        />
      )}
    </div>
  );
}
