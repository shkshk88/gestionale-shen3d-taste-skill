import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2, FileText } from 'lucide-react';
import documentsService from '@/services/documents.service';
import type { UnbilledCase } from '@/services/billing.service';
import { ClientAvatar } from '@/components/common/ClientAvatar';
import { useToast } from '@/components/ui/use-toast';
import { getDateLocale } from '@/utils/locale';

interface Props {
 open: boolean;
 onClose: () => void;
 clientId: string;
 clientName: string;
 clientLogo: string | null;
 cases: UnbilledCase[];
}

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function getCaseDate(c: UnbilledCase): Date {
 return new Date(c.shippedDate || c.receivedDate);
}

function getMonthKey(c: UnbilledCase): string {
 const d = getCaseDate(c);
 return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function GenerateReportModal({
 open, onClose, clientId, clientName, clientLogo, cases,
}: Props) {
 const { t } = useTranslation();
 const { toast } = useToast();

 const monthLabel = (key: string): string => {
 const [year, m] = key.split('-');
 return `${t(`calendar.months.${MONTH_KEYS[parseInt(m, 10) - 1]}`)} ${year}`;
 };
 const [selectedIds, setSelectedIds] = useState<string[]>([]);
 const [loading, setLoading] = useState(false);

 useEffect(() => {
 if (open) {
 setSelectedIds(cases.map((c) => c.id));
 }
 }, [open, cases]);

 // Group cases by year-month
 const monthGroups = useMemo(() => {
 const map = new Map<string, UnbilledCase[]>();
 for (const c of cases) {
 const k = getMonthKey(c);
 if (!map.has(k)) map.set(k, []);
 map.get(k)!.push(c);
 }
 return Array.from(map.entries())
 .sort(([a], [b]) => a.localeCompare(b))
 .map(([key, list]) => ({
 key,
 label: monthLabel(key),
 cases: list.sort(
 (a, b) => getCaseDate(a).getTime() - getCaseDate(b).getTime(),
 ),
 total: list.reduce((s, c) => s + c.totalPrice, 0),
 }));
 }, [cases]);

 const selectedTotal = useMemo(
 () =>
 cases
 .filter((c) => selectedIds.includes(c.id))
 .reduce((s, c) => s + c.totalPrice, 0),
 [selectedIds, cases],
 );

 const toggleCase = (id: string) =>
 setSelectedIds((prev) =>
 prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
 );

 const toggleMonth = (monthKey: string) => {
 const ids = cases.filter((c) => getMonthKey(c) === monthKey).map((c) => c.id);
 const allSelected = ids.every((id) => selectedIds.includes(id));
 if (allSelected) {
 setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
 } else {
 setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
 }
 };

 const handleGenerate = async () => {
 if (selectedIds.length === 0) {
 toast({ variant: 'destructive', title: t('billing.toast.select_at_least_one') });
 return;
 }
 setLoading(true);
 try {
 const url = await documentsService.generatePreviewReport({
 clientId,
 caseIds: selectedIds,
 });
 window.open(url, '_blank');
 setTimeout(() => URL.revokeObjectURL(url), 60_000);
 onClose();
 } catch (e: any) {
 toast({
 variant: 'destructive',
 title: t('billing.toast.load_error'),
 description: e?.response?.data?.message || e.message,
 });
 } finally {
 setLoading(false);
 }
 };

 if (!open) return null;

 return (
 <div
 className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 "
 onClick={onClose}
 >
 <div
 className="w-full sm:max-w-lg bg-white rounded-t-3xl sm: overflow-hidden flex flex-col"
 style={{ maxHeight: '92vh' }}
 onClick={(e) => e.stopPropagation()}
 >
 {/* Header */}
 <div className="flex items-center gap-3 p-4 border-b border-gray-100 shrink-0 from-green-50/80 to-transparent">
 <ClientAvatar studioName={clientName} logoUrl={clientLogo} size={36} />
 <div className="flex-1 min-w-0">
 <p className="text-[10px] text-emerald-700 uppercase tracking-wide font-semibold">
 {t('billing.report_modal.label')}
 </p>
 <p className="text-sm font-semibold text-gray-800 truncate">{clientName}</p>
 </div>
 <button
 onClick={onClose}
 className="w-8 h-8 hover:bg-gray-100 flex items-center justify-center text-gray-400"
 >
 <X size={15} />
 </button>
 </div>

 {/* Hint banner */}
 <div className="px-4 py-2.5 bg-gray-50/60 border-b border-emerald-100 text-[11px] text-green-800">
 {t('billing.report_modal.description')}
 </div>

 {/* Body */}
 <div className="overflow-y-auto flex-1 p-3 space-y-3">
 {monthGroups.map((mg) => {
 const monthIds = mg.cases.map((c) => c.id);
 const allSelected = monthIds.every((id) => selectedIds.includes(id));
 const someSelected = monthIds.some((id) => selectedIds.includes(id));
 return (
 <div
 key={mg.key}
 className="border border-gray-100 overflow-hidden"
 >
 {/* Month header */}
 <label
 className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${
 allSelected
 ? 'bg-gray-50'
 : someSelected
 ? 'bg-gray-50/50'
 : 'bg-gray-50'
 }`}
 >
 <input
 type="checkbox"
 checked={allSelected}
 ref={(el) => {
 if (el) el.indeterminate = !allSelected && someSelected;
 }}
 onChange={() => toggleMonth(mg.key)}
 className="w-4 h-4 accent-green-600 shrink-0"
 />
 <span className="text-xs font-bold text-gray-800 flex-1">
 {mg.label}
 </span>
 <span className="text-[10px] text-gray-500">
 {t('billing.report_modal.cases_in_month', { count: mg.cases.length })}
 </span>
 <span className="text-xs font-semibold text-gray-700">
 ₪{mg.total.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
 </span>
 </label>

 {/* Cases */}
 <div className="divide-y divide-neutral-100">
 {mg.cases.map((c) => (
 <label
 key={c.id}
 className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-gray-50/60"
 >
 <input
 type="checkbox"
 checked={selectedIds.includes(c.id)}
 onChange={() => toggleCase(c.id)}
 className="w-4 h-4 accent-green-600 shrink-0"
 />
 <span className="font-mono text-xs text-blue-600 shrink-0">
 {c.caseNumber}
 </span>
 <span className="text-xs text-gray-700 truncate flex-1">
 {c.patientName || (
 <span className="text-gray-300">—</span>
 )}
 </span>
 <span className="text-[10px] text-gray-400 shrink-0">
 {getCaseDate(c).toLocaleDateString(getDateLocale(), {
 day: '2-digit',
 month: '2-digit',
 })}
 </span>
 <span className="text-xs font-semibold text-gray-700 shrink-0">
 ₪{c.totalPrice.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
 </span>
 </label>
 ))}
 </div>
 </div>
 );
 })}
 </div>

 {/* Footer */}
 <div className="border-t border-gray-100 p-4 bg-gray-50/60 shrink-0">
 <div className="flex items-center justify-between mb-3">
 <p className="text-xs text-gray-500">
 {t('billing.report_modal.selected_count', { count: selectedIds.length, total: cases.length })}
 </p>
 <p className="text-xl font-bold text-emerald-700">
 ₪{selectedTotal.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
 </p>
 </div>
 <div className="flex gap-2">
 <button
 onClick={onClose}
 className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 hover:bg-gray-100"
 >
 {t('common.cancel')}
 </button>
 <button
 onClick={handleGenerate}
 disabled={loading || selectedIds.length === 0}
 className="flex-[2] py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {loading ? (
 <Loader2 size={14} className="animate-spin" />
 ) : (
 <FileText size={14} />
 )}
 {loading ? t('billing.report_modal.generating') : t('billing.report_modal.generate')}
 </button>
 </div>
 </div>
 </div>
 </div>
 );
}
