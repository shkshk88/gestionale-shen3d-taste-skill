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
 { value: 'all', label: 'invoices.filterAll', color: 'bg-gray-400', activeClass: 'bg-gray-800 text-white' },
 { value: 'received', label: 'cases.statuses.received', color: 'bg-blue-500', activeClass: 'bg-blue-600 text-white' },
 { value: 'in_progress', label: 'cases.statuses.in_progress', color: 'bg-orange-500', activeClass: 'bg-orange-500 text-white' },
 { value: 'qc', label: 'cases.statuses.qc', color: 'bg-blue-500', activeClass: 'bg-blue-500 text-white' },
 { value: 'shipped', label: 'cases.statuses.shipped', color: 'bg-green-500', activeClass: 'bg-green-500 text-white' },
];

const priorityFilters = [
 { value: 'all', label: 'invoices.filterAll', color: 'bg-gray-300', activeClass: 'bg-gray-800 text-white' },
 { value: 'normal', label: 'cases.priorities.normal', color: 'bg-green-500', activeClass: 'bg-green-500 text-white' },
 { value: 'urgent', label: 'cases.priorities.urgent', color: 'bg-orange-500', activeClass: 'bg-orange-500 text-white' },
 { value: 'rush', label: 'cases.priorities.rush', color: 'bg-red-500', activeClass: 'bg-red-500 text-white' },
];

const statusOptions = [
 { value: 'received', label: 'cases.statuses.received', color: 'bg-blue-500' },
 { value: 'in_progress', label: 'cases.statuses.in_progress', color: 'bg-orange-500' },
 { value: 'qc', label: 'cases.statuses.qc', color: 'bg-blue-500' },
 { value: 'shipped', label: 'cases.statuses.shipped', color: 'bg-green-500' },
];

const priorityOptions = [
 { value: 'normal', label: 'cases.priorities.normal', color: 'bg-green-500' },
 { value: 'urgent', label: 'cases.priorities.urgent', color: 'bg-orange-500' },
 { value: 'rush', label: 'cases.priorities.rush', color: 'bg-red-500' },
];

type SortField = 'client' | 'patient' | 'caseNumber' | 'dueDate';
type SortDirection = 'asc' | 'desc';

// Helper to format API data for display
const formatCaseForDisplay = (apiCase: any) => {
 const clientName = apiCase.client?.studioName || i18n.t('common.noData');
 const clientLogoUrl = apiCase.client?.logoUrl ?? null;

 const teethList = apiCase.teeth?.map((t: any) => t.toothNumber).join(', ') || i18n.t('common.noData');

 const firstTooth = apiCase.teeth?.[0];
 const workDetails = firstTooth
 ? `${firstTooth.workType} ${firstTooth.material}`
 : i18n.t('common.noData');

 const formatDate = (dateStr?: string | null) => {
 if (!dateStr) return '—';
 const date = new Date(dateStr);
 if (isNaN(date.getTime())) return '—';
 return date.toLocaleDateString(getDateLocale(), { day: 'numeric', month: 'short' });
 };

 const model3DFiles = (apiCase.files || []).filter((f: any) => f.fileType === 'stl' || f.fileType === 'ply');

 return {
 id: apiCase.id,
 caseNumber: apiCase.caseNumber,
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
 _raw: apiCase,
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
 <div className="fixed inset-0 z-[100] flex items-end md:items-start justify-center bg-gray-900/40 md:pt-12 pt-0">
 <div className="bg-white rounded-t-2xl md: w-full md:max-w-5xl mx-0 md:mx-4 overflow-hidden flex flex-col max-h-[90dvh] md:max-h-[85vh]">
 {/* Header */}
 <div className="bg-gray-800 p-4 flex items-center justify-between shrink-0">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-blue-600 flex items-center justify-center shrink-0">
 <FileText className="text-white" size={20} />
 </div>
 <div>
 <h3 className="text-white font-semibold font-display">{t('cases.pdfPreview')}</h3>
 <p className="text-white/60 text-sm">{caseItem?.caseNumber} - {caseItem?.patient}</p>
 </div>
 </div>
 <button
 onClick={onClose}
 className="w-8 h-8 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
 >
 <X size={18} />
 </button>
 </div>

 {/* Preview Area */}
 <div className="flex-1 bg-gray-50 p-4 overflow-auto">
 {loading ? (
 <div className="h-[500px] flex items-center justify-center">
 <div className="text-center">
 <div className="inline-block animate-spin h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
 <p className="mt-3 text-gray-500 text-sm">{t('cases.generatingPdf')}</p>
 </div>
 </div>
 ) : error ? (
 <div className="h-[500px] flex items-center justify-center">
 <div className="text-center">
 <p className="text-red-500 font-medium">{t('cases.errorGeneratingPdf')}</p>
 <p className="text-gray-400 text-sm mt-2">{error}</p>
 </div>
 </div>
 ) : pdfUrl ? (
 <iframe
 src={pdfUrl}
 className="w-full h-[65vh] bg-white "
 title={t('cases.pdfPreview')}
 />
 ) : (
 <div className="h-[500px] flex items-center justify-center">
 <p className="text-gray-500">{t('cases.pdfNotAvailable')}</p>
 </div>
 )}
 </div>

 {/* Footer */}
 <div className="p-4 border-t border-gray-100 flex gap-3 shrink-0 bg-white">
 <button
 onClick={onClose}
 className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
 >
 {t('common.close')}
 </button>
 <button
 onClick={handlePrint}
 className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium hover:bg-sky-700 transition-colors flex items-center justify-center gap-2"
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
 className="cursor-pointer hover:bg-gray-50/80 transition-colors select-none"
 >
 <div className="flex items-center gap-1">
 {label}
 {isActive ? (
 currentSort.direction === 'asc' ? (
 <ArrowUp size={14} className="text-blue-600" />
 ) : (
 <ArrowDown size={14} className="text-blue-600" />
 )
 ) : (
 <ArrowUpDown size={14} className="text-gray-400" />
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
 received: 'bg-gray-50 text-sky-700 border-sky-200',
 in_progress: 'bg-gray-50 text-amber-700 border-amber-200',
 qc: 'bg-gray-50 text-teal-700 border-teal-200',
 shipped: 'bg-gray-50 text-emerald-700 border-emerald-200',
 };
 return styles[value] || 'bg-gray-50 text-gray-700 border-gray-200';
 } else {
 const styles: Record<string, string> = {
 normal: 'bg-gray-50 text-emerald-700 border-emerald-200',
 urgent: 'bg-gray-50 text-amber-700 border-amber-200',
 rush: 'bg-red-50 text-red-700 border-red-200',
 };
 return styles[value] || 'bg-gray-50 text-gray-700 border-gray-200';
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
 className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold border cursor-pointer hover:opacity-80 transition-opacity ${getBadgeClass()}`}
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
 <div className="absolute top-full left-0 mt-1 w-48 bg-white -lg border border-gray-100 p-1.5 z-50">
 {options.map((option) => (
 <button
 key={option.value}
 onClick={(e) => {
 e.stopPropagation();
 onChange(option.value);
 setIsOpen(false);
 }}
 className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors
 ${value === option.value ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
 >
 <div className={`w-2.5 h-2.5 ${option.color}`} />
 {t(option.label)}
 {value === option.value && <Check size={14} className="ml-auto text-blue-600" />}
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
 {/* Header Title */}
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-gray-800 font-display">{t('cases.title')}</h1>
 <p className="text-sm text-gray-500 mt-0.5">{t('cases.subtitle', { count: stats.total })}</p>
 </div>
 <Link
 to="/admin/cases/new"
 className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium hover:bg-sky-700 transition-colors "
 >
 <Plus size={16} />
 {t('cases.newCase')}
 </Link>
 </div>

 {/* Compact Filter Bar */}
 <div className="relative -mx-2 px-2">
 <div className="pointer-events-none absolute inset-y-0 start-0 w-4 from-surface/95 to-transparent z-10" />
 <div className="pointer-events-none absolute inset-y-0 end-0 w-4 bg-gradient-to-l from-surface/95 to-transparent z-10" />
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
 shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
 transition-all duration-200 border
 ${isActive
 ? `${filter.activeClass} border-transparent `
 : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
 }
 `}
 >
 <span className={`w-2 h-2 ${filter.color}`} />
 {t(filter.label)}
 <span
 className={`text-[10px] px-1.5 py-0 min-w-[16px] text-center ${
 isActive ? 'bg-white/30' : 'bg-gray-100 text-gray-500'
 }`}
 >
 {count}
 </span>
 </button>
 );
 })}

 <div className="w-px h-5 bg-gray-200 shrink-0 mx-1" />

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
 shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
 transition-all duration-200 border
 ${isActive
 ? `${filter.activeClass} border-transparent `
 : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
 }
 `}
 >
 <span className={`w-2 h-2 ${filter.color}`} />
 {t(filter.label)}
 <span
 className={`text-[10px] px-1.5 py-0 min-w-[16px] text-center ${
 isActive ? 'bg-white/30' : 'bg-gray-100 text-gray-500'
 }`}
 >
 {count}
 </span>
 </button>
 );
 })}
 </div>
 </div>

 {/* Search */}
 <div className="flex items-center gap-4">
 <div className="relative flex-1 max-w-md">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
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
 <div className="bg-white border border-gray-100 p-12 text-center">
 <div className="inline-block animate-spin h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
 <p className="mt-4 text-gray-500">{t('common.loading')}</p>
 </div>
 ) : (
 <>
 {/* Mobile Card View */}
 <div className="md:hidden space-y-3">
 {filteredAndSortedCases.map((caseItem) => (
 <div
 key={caseItem.id}
 className="bg-white p-4 border border-gray-100 "
 onClick={() => handleRowClick(caseItem.id)}
 >
 {/* Header */}
 <div className="flex items-center gap-3 mb-3">
 <ClientAvatar
 studioName={caseItem.client}
 logoUrl={caseItem.clientLogoUrl}
 size={40}
 />
 <div className="flex-1 min-w-0">
 <p className="font-semibold text-sm text-gray-800 truncate">{caseItem.client}</p>
 <p className="text-xs text-gray-500 truncate">{caseItem.patient}</p>
 </div>
 <ChevronRight size={16} className="text-gray-300 shrink-0" />
 </div>

 {/* Work type + teeth count */}
 <div className="mb-3 pl-13">
 <p className="text-sm text-gray-700">
 {caseItem.workDetails}
 <span className="text-gray-400"> · {caseItem.teethCount} {t('dental.tooth', { count: caseItem.teethCount })}</span>
 </p>
 <p className="text-[10px] font-mono text-gray-400 mt-0.5">#{caseItem.caseNumber}</p>
 </div>

 {/* Date + Badges row */}
 <div className="flex items-center justify-between mb-3">
 <span className="text-xs text-gray-500 flex items-center gap-1">
 <Calendar size={12} className="text-gray-400" />
 {caseItem.dueDate}
 </span>
 <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
 <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold border ${
 caseItem.priority === 'normal' ? 'bg-gray-50 text-emerald-700 border-emerald-200' :
 caseItem.priority === 'urgent' ? 'bg-gray-50 text-amber-700 border-amber-200' :
 'bg-red-50 text-red-700 border-red-200'
 }`}>
 {t(`cases.priorities.${caseItem.priority}`)}
 </span>
 <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold border ${
 caseItem.status === 'received' ? 'bg-gray-50 text-sky-700 border-sky-200' :
 caseItem.status === 'in_progress' ? 'bg-gray-50 text-amber-700 border-amber-200' :
 caseItem.status === 'qc' ? 'bg-gray-50 text-teal-700 border-teal-200' :
 'bg-gray-50 text-emerald-700 border-emerald-200'
 }`}>
 {t(`cases.statuses.${caseItem.status}`)}
 </span>
 </div>
 </div>

 {/* Actions */}
 <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
 <button
 onClick={(e) => { e.stopPropagation(); setPdfPreviewCase(caseItem); }}
 className="w-9 h-9 bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
 title={t('cases.pdfPreview')}
 >
 <FileText size={18} />
 </button>
 <button
 onClick={(e) => { e.stopPropagation(); if (caseItem._raw) pdfService.generateCasePDF(caseItem._raw); }}
 className="w-9 h-9 bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
 title={t('cases.printPdf')}
 >
 <Printer size={18} />
 </button>
 {caseItem.has3D && (
 <button
 onClick={(e) => { e.stopPropagation(); setViewer3DCase(caseItem); }}
 className="w-9 h-9 bg-gray-100 flex items-center justify-center text-blue-600 hover:bg-gray-50 transition-colors"
 title={t('viewer3d.view3D')}
 >
 <Box size={18} />
 </button>
 )}
 </div>
 </div>
 ))}
 {filteredAndSortedCases.length === 0 && (
 <div className="py-12 text-center text-gray-500 text-sm">{t('common.noResults')}</div>
 )}
 </div>

 {/* Desktop Table View */}
 <div className="hidden md:block bg-white border border-gray-100 overflow-hidden">
 <div className="overflow-x-auto">
 <table className="table-modern w-full min-w-max">
 <thead>
 <tr className="bg-gray-50/60 border-b border-gray-100">
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
 className={`group cursor-pointer transition-colors border-b border-gray-50 last:border-0 ${
 index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
 } hover:bg-gray-50/60`}
 onClick={() => handleRowClick(caseItem.id)}
 >
 <td className="py-3">
 <div className="flex items-center gap-3">
 <ClientAvatar
 studioName={caseItem.client}
 logoUrl={caseItem.clientLogoUrl}
 size={40}
 />
 <div className="min-w-0">
 <p className="font-medium text-gray-800 truncate text-sm">{caseItem.client}</p>
 <p className="text-[10px] font-mono text-gray-400">#{caseItem.caseNumber}</p>
 </div>
 </div>
 </td>
 <td className="text-gray-700 font-medium text-sm py-3">{caseItem.patient}</td>
 <td className="py-3">
 <div className="flex items-start gap-3">
 <div className="flex-1 min-w-0">
 <p className="text-gray-800 text-sm">
 {caseItem.workDetails}
 <span className="text-gray-400"> · {caseItem.teethCount} {t('dental.tooth', { count: caseItem.teethCount })}</span>
 </p>
 <p className="text-xs text-gray-400 mt-0.5">Denti: {caseItem.teeth}</p>
 </div>
 {/* Action Buttons */}
 <div className="flex items-center gap-1.5 shrink-0">
 <button
 onClick={(e) => {
 e.stopPropagation();
 setPdfPreviewCase(caseItem);
 }}
 className="w-8 h-8 flex items-center justify-center text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-800 transition-colors"
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
 className="w-8 h-8 flex items-center justify-center text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-800 transition-colors"
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
 className="w-8 h-8 flex items-center justify-center text-blue-600 bg-gray-50 hover:bg-teal-100 transition-colors"
 title={t('viewer3d.view3D')}
 >
 <Box size={16} />
 </button>
 )}
 </div>
 </div>
 </td>
 <td className="py-3">
 <div className="flex items-center gap-2 text-gray-600 text-sm">
 <Calendar size={14} className="text-gray-400" />
 {caseItem.dueDate}
 </div>
 </td>
 <td className="py-3" onClick={(e) => e.stopPropagation()}>
 <EditableBadge
 type="priority"
 value={caseItem.priority}
 options={priorityOptions}
 onChange={(value) => handlePriorityChange(caseItem.id, value)}
 />
 </td>
 <td className="py-3" onClick={(e) => e.stopPropagation()}>
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
 </div>

 {filteredAndSortedCases.length === 0 && (
 <div className="py-12 text-center text-gray-500">{t('common.noResults')}</div>
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
