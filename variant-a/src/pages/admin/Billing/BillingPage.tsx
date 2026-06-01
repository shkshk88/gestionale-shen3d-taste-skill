import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  FileCheck,
  Receipt,
  BarChart3,
  Plus,
  Download,
  FileSpreadsheet,
  MessageCircle,
  Calendar,
  Search,
  CheckCircle,
  Inbox,
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw,
  MoreHorizontal,
  Eye,
  Trash2,
  Ban,
  Pencil,
  Send,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ClientAvatar } from '@/components/common/ClientAvatar';
import billingService, { UnbilledGroup } from '@/services/billing.service';
import documentsService, {
  BillingDocument,
  DocumentStatus,
  DocumentType,
} from '@/services/documents.service';
import CreateDocumentModal from './CreateDocumentModal';
import GenerateReportModal from './GenerateReportModal';
import PaymentMethodModal from './PaymentMethodModal';
import { TYPES_REQUIRING_PAYMENTS, PaymentItem } from '@/services/documents.service';
import { getDateLocale } from '@/utils/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ─── Tab config ────────────────────────────────────────────────────────────────

type TabId =
  | 'unbilled'
  | 'invoice_order'
  | 'tax_invoice'
  | 'receipt_invoice'
  | 'receipt'
  | 'price_quote'
  | 'credit_note';

interface TabDef {
  id: TabId;
  label: string;
  hebrew?: string;
  icon: typeof FileText;
  description: string;
  accentBg: string;
  accentText: string;
  primary?: boolean;
}

const TABS: TabDef[] = [
  {
    id: 'unbilled',
    label: 'unbilled',
    icon: Inbox,
    description: 'unbilled',
    accentBg: 'bg-amber-50',
    accentText: 'text-amber-700',
    primary: true,
  },
  {
    id: 'invoice_order',
    label: 'invoice_order',
    hebrew: 'חשבונית עסקה',
    icon: FileText,
    description: 'invoice_order',
    accentBg: 'bg-sky-50',
    accentText: 'text-sky-700',
    primary: true,
  },
  {
    id: 'tax_invoice',
    label: 'tax_invoice',
    hebrew: 'חשבונית מס',
    icon: FileCheck,
    description: 'tax_invoice',
    accentBg: 'bg-teal-50',
    accentText: 'text-teal-700',
    primary: true,
  },
  {
    id: 'receipt_invoice',
    label: 'receipt_invoice',
    hebrew: 'חשבונית מס/קבלה',
    icon: Receipt,
    description: 'receipt_invoice',
    accentBg: 'bg-teal-50',
    accentText: 'text-teal-700',
  },
  {
    id: 'receipt',
    label: 'receipt',
    hebrew: 'קבלה',
    icon: Receipt,
    description: 'receipt',
    accentBg: 'bg-violet-50',
    accentText: 'text-violet-700',
  },
  {
    id: 'price_quote',
    label: 'price_quote',
    hebrew: 'הצעת מחיר',
    icon: BarChart3,
    description: 'price_quote',
    accentBg: 'bg-sky-50',
    accentText: 'text-sky-700',
  },
  {
    id: 'credit_note',
    label: 'credit_note',
    hebrew: 'חשבונית זיכוי',
    icon: FileSpreadsheet,
    description: 'credit_note',
    accentBg: 'bg-rose-50',
    accentText: 'text-rose-700',
  },
];

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: DocumentStatus }) {
  const { t } = useTranslation();
  const cfg: Record<DocumentStatus, { label: string; cn: string }> = {
    draft: { label: t('billing.status.draft'), cn: 'bg-amber-100 text-amber-700' },
    issued: { label: t('billing.status.issued'), cn: 'bg-sky-50 text-sky-700' },
    paid: { label: t('billing.status.paid'), cn: 'bg-teal-50 text-teal-700' },
    cancelled: { label: t('billing.status.cancelled'), cn: 'bg-slate-100 text-slate-500' },
    error: { label: t('billing.status.error'), cn: 'bg-red-100 text-red-700' },
  };
  const { label, cn } = cfg[status] ?? { label: status, cn: 'bg-slate-100 text-slate-500' };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${cn}`}>
      {label}
    </span>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface CreateModalState {
  open: boolean;
  type: DocumentType;
  clientId: string;
  clientName: string;
  clientLogo: string | null;
  cases: UnbilledGroup['cases'];
}

interface ReportModalState {
  open: boolean;
  clientId: string;
  clientName: string;
  clientLogo: string | null;
  cases: UnbilledGroup['cases'];
}

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger: boolean;
  onConfirm: () => void;
}

interface EditModalState {
  open: boolean;
  doc: BillingDocument | null;
  subject: string;
  notes: string;
  dueDate: string;
  saving: boolean;
}

export default function BillingPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>('unbilled');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Unbilled state
  const [unbilledGroups, setUnbilledGroups] = useState<UnbilledGroup[]>([]);
  const [loadingUnbilled, setLoadingUnbilled] = useState(false);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  // Documents state
  const [documents, setDocuments] = useState<BillingDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Modal states
  const [createModal, setCreateModal] = useState<CreateModalState>({
    open: false,
    type: 'invoice_order',
    clientId: '',
    clientName: '',
    clientLogo: null,
    cases: [],
  });
  const [reportModal, setReportModal] = useState<ReportModalState>({
    open: false,
    clientId: '',
    clientName: '',
    clientLogo: null,
    cases: [],
  });
  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Conferma',
    danger: false,
    onConfirm: () => {},
  });
  const [editModal, setEditModal] = useState<EditModalState>({
    open: false,
    doc: null,
    subject: '',
    notes: '',
    dueDate: '',
    saving: false,
  });

  // ── Data loading ─────────────────────────────────────────────────────────────

  const loadUnbilled = async () => {
    setLoadingUnbilled(true);
    try {
      const data = await billingService.listUnbilledCases();
      setUnbilledGroups(data);
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: t('billing.toast.load_error'),
        description: e?.response?.data?.message || e.message,
      });
    } finally {
      setLoadingUnbilled(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'unbilled') {
      loadUnbilled();
      return;
    }
    setLoadingDocs(true);
    documentsService
      .list({
        type: activeTab as DocumentType,
        from: dateFrom || undefined,
        to: dateTo || undefined,
      })
      .then((data) => setDocuments(data))
      .catch(() => {})
      .finally(() => setLoadingDocs(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, dateFrom, dateTo, refreshKey]);

  // ── Payment modal state (per Receipt / Mas+Kab / Credit Note) ─────────────────
  const [paymentModalDoc, setPaymentModalDoc] = useState<BillingDocument | null>(null);

  // ── Mutations ─────────────────────────────────────────────────────────────────

  const issueWithPayments = async (id: string, payments?: PaymentItem[]) => {
    const updated = await documentsService.issue(id, payments ? { payments } : undefined);
    setDocuments((prev) => prev.map((d) => (d.id === id ? updated : d)));
    loadUnbilled();
    const envBadge = updated.invoice4uEnvironment
      ? ` [invoice4u: ${updated.invoice4uEnvironment}]`
      : '';
    toast({
      title: t('billing.toast.doc_emitted_title'),
      description: t('billing.toast.doc_emitted_desc', { number: updated.documentNumber }) + envBadge,
    });
    if (updated.invoice4uError) {
      toast({
        variant: 'destructive',
        title: t('billing.toast.sync_failed_title'),
        description: updated.invoice4uError,
      });
    }
  };

  const doIssue = async (doc: BillingDocument) => {
    // Receipt/ReceiptInvoice/CreditNote → open payment modal first
    if (TYPES_REQUIRING_PAYMENTS.includes(doc.type)) {
      setPaymentModalDoc(doc);
      return;
    }
    try {
      await issueWithPayments(doc.id);
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: t('billing.toast.issue_error'),
        description: e?.response?.data?.message || e.message,
      });
    }
  };

  const doDelete = async (id: string) => {
    try {
      await documentsService.remove(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      toast({ title: t('billing.toast.draft_deleted') });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: t('billing.toast.delete_error'),
        description: e?.response?.data?.message || e.message,
      });
    }
  };

  const doCancel = async (id: string) => {
    try {
      const updated = await documentsService.cancel(id);
      setDocuments((prev) => prev.map((d) => (d.id === id ? updated : d)));
      loadUnbilled();
      toast({
        title: t('billing.toast.doc_cancelled_title'),
        description: t('billing.toast.doc_cancelled_desc'),
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: t('billing.toast.cancel_error'),
        description: e?.response?.data?.message || e.message,
      });
    }
  };

  const doEditSave = async () => {
    if (!editModal.doc) return;
    setEditModal((p) => ({ ...p, saving: true }));
    try {
      const updated = await documentsService.update(editModal.doc.id, {
        subject: editModal.subject || undefined,
        notes: editModal.notes || undefined,
        dueDate: editModal.dueDate || null,
      });
      setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setEditModal((p) => ({ ...p, open: false }));
      toast({ title: t('common.success') });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: e?.response?.data?.message || e.message,
      });
    } finally {
      setEditModal((p) => ({ ...p, saving: false }));
    }
  };

  const handleDocumentCreated = (doc: BillingDocument) => {
    setCreateModal((p) => ({ ...p, open: false }));
    setActiveTab(doc.type as TabId);
    setRefreshKey((k) => k + 1);
    loadUnbilled();
    toast({
      title: t('common.success'),
      description: t('billing.toast.doc_emitted_desc', { number: doc.documentNumber || t('billing.status.draft') }),
    });
  };

  const openCreateModal = (
    type: DocumentType,
    group: UnbilledGroup,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setCreateModal({
      open: true,
      type,
      clientId: group.client.id,
      clientName: group.client.studioName,
      clientLogo: group.client.logoUrl,
      cases: group.cases,
    });
  };

  const openReportModal = (group: UnbilledGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    setReportModal({
      open: true,
      clientId: group.client.id,
      clientName: group.client.studioName,
      clientLogo: group.client.logoUrl,
      cases: group.cases,
    });
  };

  const notImplemented = (what: string) =>
    toast({ title: 'In arrivo (Fase D)', description: `${what} sarà disponibile in Fase D.` });

  // ── Computed ──────────────────────────────────────────────────────────────────

  const active = TABS.find((t) => t.id === activeTab)!;

  const filteredGroups = unbilledGroups.filter((g) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      g.client.studioName.toLowerCase().includes(q) ||
      g.cases.some(
        (c) =>
          c.caseNumber.toLowerCase().includes(q) ||
          (c.patientName || '').toLowerCase().includes(q),
      )
    );
  });

  const filteredDocs = documents.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.client.studioName.toLowerCase().includes(q) ||
      (d.documentNumber || '').toLowerCase().includes(q) ||
      (d.subject || '').toLowerCase().includes(q)
    );
  });

  const totalAcrossClients = filteredGroups.reduce((s, g) => s + g.totalAmount, 0);
  const totalCases = filteredGroups.reduce((s, g) => s + g.casesCount, 0);
  const totalDocAmount = filteredDocs.reduce((s, d) => s + Number(d.total), 0);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 animate-fade-in pb-8 max-w-7xl mx-auto p-2 sm:p-4">

      {/* Banner Fase B */}
      <div className="card-base bg-gradient-to-r from-sky-50 via-sky-50/50 to-transparent border-sky-200 p-3 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
          <CheckCircle size={16} className="text-sky-600" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-sky-900">
            {t('billing.banner.title')}
          </p>
          <p className="text-[11px] text-sky-800/80 mt-0.5">
            {t('billing.banner.description')}
          </p>
        </div>
      </div>

      {/* All tabs visible — grid uniforme su tutti i breakpoint */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-2.5 rounded-2xl border transition-all text-left ${
                isActive
                  ? 'border-sky-600 ring-2 ring-sky-600/20 shadow-soft bg-white'
                  : 'border-slate-100 hover:border-slate-200 hover:shadow-soft bg-white'
              }`}
              title={t(`billing.descriptions.${tab.description}`)}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg ${tab.accentBg} flex items-center justify-center shrink-0`}
                >
                  <Icon size={15} className={tab.accentText} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                    {t(`billing.tabs.${tab.label}`)}
                  </p>
                  {tab.hebrew && (
                    <p className="text-[10px] text-slate-400 truncate leading-tight" dir="rtl">
                      {tab.hebrew}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main content area */}
      <div className="card-base p-4 sm:p-5 space-y-4">

        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeTab === 'unbilled'
                  ? t('billing.search_placeholder')
                  : t('billing.search_documents', { type: t(`billing.tabs.${active.label}`).toLowerCase() })
              }
              className="input-modern ps-9 w-full text-sm h-9"
            />
          </div>
          {activeTab !== 'unbilled' && (
            <div className="flex items-center gap-1 bg-slate-50 rounded-xl px-2 h-9">
              <Calendar size={13} className="text-slate-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-transparent text-xs outline-none w-32"
                title="Dal"
              />
              <span className="text-slate-300">→</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-transparent text-xs outline-none w-32"
                title="Al"
              />
            </div>
          )}
          {activeTab === 'unbilled' ? (
            <button
              onClick={loadUnbilled}
              disabled={loadingUnbilled}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium flex items-center gap-1.5 shrink-0 transition-colors"
            >
              <RefreshCw size={13} className={loadingUnbilled ? 'animate-spin' : ''} />
              {t('billing.refresh')}
            </button>
          ) : (
            <button
              onClick={() =>
                toast({
                  title: t('billing.tabs.unbilled'),
                  description: t('billing.empty_unbilled_desc'),
                })
              }
              className="px-3 py-1.5 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 flex items-center gap-1.5 shrink-0 transition-colors"
            >
              <Plus size={14} />
              {t('billing.new_document', { type: t(`billing.tabs.${active.label}`) })}
            </button>
          )}
        </div>

        {/* Export row (non-unbilled tabs) */}
        {activeTab !== 'unbilled' && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => notImplemented(t('billing.export_pdf'))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-medium transition-colors"
            >
              <Download size={12} />
              {t('billing.export_pdf')}
            </button>
            <button
              onClick={() => notImplemented(t('billing.export_xlsx'))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-medium transition-colors"
            >
              <FileSpreadsheet size={12} />
              {t('billing.export_xlsx')}
            </button>
            <button
              onClick={() => notImplemented(t('billing.send_whatsapp'))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-xs font-medium transition-colors"
            >
              <MessageCircle size={12} />
              {t('billing.send_whatsapp')}
            </button>
          </div>
        )}

        {/* ── UNBILLED TAB ──────────────────────────────────────────────────────── */}
        {activeTab === 'unbilled' ? (
          loadingUnbilled ? (
            <div className="text-center py-16">
              <Loader2 size={28} className="mx-auto animate-spin text-sky-600 mb-3" />
              <p className="text-sm text-slate-500">{t('billing.loading_unbilled')}</p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 mx-auto mb-3 flex items-center justify-center">
                <Inbox size={24} className="text-amber-700" />
              </div>
              <p className="text-sm font-semibold text-slate-700">{t('billing.empty_unbilled_title')}</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {t('billing.empty_unbilled_desc')}
              </p>
            </div>
          ) : (
            <>
              {/* Client groups */}
              <div className="space-y-2">
                {filteredGroups.map((g) => {
                  const isOpen = expandedClient === g.client.id;
                  return (
                    <div
                      key={g.client.id}
                      className="card-base overflow-hidden"
                    >
                      <div
                        onClick={() => setExpandedClient(isOpen ? null : g.client.id)}
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50/60 transition"
                      >
                        <button
                          className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 shrink-0 transition-colors"
                          aria-label={isOpen ? 'Chiudi' : 'Apri'}
                        >
                          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        <ClientAvatar
                          studioName={g.client.studioName}
                          logoUrl={g.client.logoUrl}
                          size={40}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-semibold text-sm text-slate-800 truncate"
                            dir="auto"
                            title={g.client.studioName}
                          >
                            {g.client.studioName}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            <span className="font-bold text-sky-600 text-sm">
                              ₪
                              {g.totalAmount.toLocaleString('it-IT', {
                                maximumFractionDigits: 0,
                              })}
                            </span>
                            <span className="mx-1.5 text-slate-300">·</span>
                            {g.casesCount}{' '}
                            {t(`billing.client_card.cases_${g.casesCount === 1 ? 'one' : 'other'}`)}
                            <span className="mx-1.5 text-slate-300">·</span>
                            {g.teethCount} {t('billing.client_card.teeth')}
                          </p>
                        </div>
                        <div className="flex gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => openReportModal(g, e)}
                            className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                            title={t('billing.client_card.report_title')}
                          >
                            <FileText size={13} />
                            <span className="hidden sm:inline">{t('billing.client_card.report')}</span>
                          </button>
                          <button
                            onClick={(e) => openCreateModal('invoice_order', g, e)}
                            className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                            title={t('billing.client_card.create_doc_title')}
                          >
                            <Plus size={13} />
                            <span className="hidden sm:inline">{t('billing.client_card.create_doc')}</span>
                            <span className="sm:hidden">{t('billing.client_card.create_doc_short')}</span>
                          </button>
                        </div>
                      </div>

                      {/* Expanded cases list */}
                      {isOpen && (
                        <div className="border-t border-slate-100 bg-slate-50/40">
                          <table className="w-full text-xs">
                            <thead className="text-[10px] uppercase text-slate-500">
                              <tr>
                                <th className="text-left px-3 py-2 font-medium">{t('billing.table.case')}</th>
                                <th className="text-left px-3 py-2 font-medium">{t('billing.table.patient')}</th>
                                <th className="text-left px-3 py-2 font-medium">{t('billing.table.shipped')}</th>
                                <th className="text-left px-3 py-2 font-medium">{t('billing.table.teeth')}</th>
                                <th className="text-right px-3 py-2 font-medium">{t('billing.table.total')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {g.cases.map((c) => (
                                <tr
                                  key={c.id}
                                  className="border-t border-slate-100 hover:bg-white/60"
                                >
                                  <td className="px-3 py-2">
                                    <a
                                      href={`/admin/cases/${c.id}`}
                                      className="font-mono text-sky-600 hover:underline"
                                    >
                                      {c.caseNumber}
                                    </a>
                                  </td>
                                  <td className="px-3 py-2 text-slate-700">
                                    {c.patientName || (
                                      <span className="text-slate-300">—</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-slate-600">
                                    {c.shippedDate
                                      ? new Date(c.shippedDate).toLocaleDateString(getDateLocale(), {
                                          day: '2-digit',
                                          month: 'short',
                                        })
                                      : '—'}
                                  </td>
                                  <td className="px-3 py-2 text-slate-700">
                                    <span className="inline-flex items-center gap-1">
                                      <span className="font-semibold">{c.teethCount}</span>
                                      <span className="text-[10px] text-slate-400">
                                        (
                                        {c.teeth
                                          .slice(0, 3)
                                          .map((t) => `${t.toothNumber}${t.material[0]}`)
                                          .join(' ')}
                                        {c.teeth.length > 3 ? '…' : ''})
                                      </span>
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-right font-semibold text-slate-800">
                                    ₪
                                    {c.totalPrice.toLocaleString('it-IT', {
                                      maximumFractionDigits: 0,
                                    })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Riepilogo compatto in basso */}
              <div className="flex items-center justify-end gap-3 pt-2 px-1 text-xs text-slate-500 border-t border-slate-100">
                <span className="pt-2">
                  <strong className="text-slate-800">{filteredGroups.length}</strong>{' '}
                  {t(`billing.summary.clients_${filteredGroups.length === 1 ? 'one' : 'other'}`)}
                </span>
                <span className="text-slate-300 pt-2">·</span>
                <span className="pt-2">
                  <strong className="text-slate-800">{totalCases}</strong>{' '}
                  {t(`billing.summary.cases_${totalCases === 1 ? 'one' : 'other'}`)}
                </span>
                <span className="text-slate-300 pt-2">·</span>
                <span className="pt-2">
                  {t('billing.summary.total')}:{' '}
                  <strong className="text-sky-600 text-sm">
                    ₪{totalAcrossClients.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
                  </strong>
                </span>
              </div>
            </>
          )
        ) : (
          /* ── DOCUMENT TABS ─────────────────────────────────────────────────── */
          <>
            {loadingDocs ? (
              <div className="text-center py-16">
                <Loader2 size={28} className="mx-auto animate-spin text-sky-600 mb-3" />
                <p className="text-sm text-slate-500">{t('billing.loading_documents')}</p>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
                <div
                  className={`w-14 h-14 rounded-2xl ${active.accentBg} mx-auto mb-3 flex items-center justify-center`}
                >
                  <active.icon size={24} className={active.accentText} />
                </div>
                <div className="flex items-baseline justify-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-slate-700">
                    {t('billing.empty_docs_title', { type: t(`billing.tabs.${active.label}`) })}
                  </p>
                  {active.hebrew && (
                    <p className="text-xs text-slate-500" dir="rtl">
                      ({active.hebrew})
                    </p>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {t('billing.empty_docs_desc')}
                </p>
              </div>
            ) : (
              <>
                {/* Summary strip */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] uppercase text-slate-500 font-medium tracking-wider">
                      {t('billing.tabs.invoice_order')}
                    </p>
                    <p className="text-lg font-bold text-slate-800">{filteredDocs.length}</p>
                  </div>
                  <div className="bg-sky-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] uppercase text-sky-600 font-semibold tracking-wider">
                      {t('billing.summary.total')}
                    </p>
                    <p className="text-lg font-bold text-sky-600">
                      ₪{totalDocAmount.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>

                {/* Document list */}
                <div className="space-y-2">
                  {filteredDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 border border-slate-100 rounded-2xl hover:bg-slate-50/60 transition shadow-soft"
                    >
                      {/* Left: status + info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={doc.status} />
                          <span className="font-mono text-sm font-semibold text-slate-800">
                            {doc.documentNumber ?? (
                              <span className="font-normal text-slate-400 font-sans">{t('billing.status.draft')}</span>
                            )}
                          </span>
                          {doc.invoice4uEnvironment && (
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wide ${
                                doc.invoice4uEnvironment === 'mock'
                                  ? 'bg-slate-100 text-slate-600'
                                  : doc.invoice4uEnvironment === 'staging'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-teal-50 text-teal-700'
                              }`}
                              title={t(`billing.env.${doc.invoice4uEnvironment}_title`)}
                            >
                              {t(`billing.env.${doc.invoice4uEnvironment}`)}
                            </span>
                          )}
                          {doc.invoice4uError && (
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase bg-red-100 text-red-700"
                              title={doc.invoice4uError}
                            >
                              {t('billing.env.sync_err')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ClientAvatar
                            studioName={doc.client.studioName}
                            logoUrl={doc.client.logoUrl}
                            size={18}
                          />
                          <span className="text-xs text-slate-700" dir="auto">{doc.client.studioName}</span>
                          {doc.subject && (
                            <span className="text-xs text-slate-400 truncate hidden sm:block">
                              · {doc.subject}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {doc.issueDate
                            ? `${t('billing.status.issued')}: ${new Date(doc.issueDate).toLocaleDateString(getDateLocale(), {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}`
                            : `${t('common.create')}: ${new Date(doc.createdAt).toLocaleDateString(getDateLocale(), {
                                day: '2-digit',
                                month: 'short',
                              })}`}
                          {' · '}
                          {doc.caseIds.length}{' '}
                          {t(`billing.summary.cases_${doc.caseIds.length === 1 ? 'one' : 'other'}`)}
                          {doc.dueDate && (
                            <>
                              {' · '}
                              <span className="text-amber-600">
                                {t('cases.dueDate')}:{' '}
                                {new Date(doc.dueDate).toLocaleDateString(getDateLocale(), {
                                  day: '2-digit',
                                  month: 'short',
                                })}
                              </span>
                            </>
                          )}
                        </p>
                      </div>

                      {/* Right: total + actions */}
                      <div className="text-right shrink-0 mr-1">
                        <p className="text-base font-bold text-slate-800">
                          ₪{Number(doc.total).toLocaleString('it-IT', { maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-[10px] text-slate-400">IVA {doc.taxRate}%</p>
                      </div>

                      {/* PDF button — visibile sempre */}
                      <button
                        onClick={() =>
                          window.open(documentsService.getPdfUrl(doc.id), '_blank')
                        }
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 shrink-0 transition-colors"
                        title={
                          doc.invoice4uUniqueId
                            ? t('billing.actions.view_pdf_invoice4u')
                            : t('billing.actions.view_pdf_local')
                        }
                      >
                        <Eye size={12} />
                        PDF
                      </button>

                      {(doc.status === 'draft' || doc.status === 'issued') && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 transition-colors">
                            <MoreHorizontal size={15} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          {doc.status === 'draft' && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  setEditModal({
                                    open: true,
                                    doc,
                                    subject: doc.subject || '',
                                    notes: doc.notes || '',
                                    dueDate: doc.dueDate?.slice(0, 10) || '',
                                    saving: false,
                                  })
                                }
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Pencil size={14} />
                                {t('billing.actions.edit_draft')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfirm({
                                    open: true,
                                    title: t('billing.confirm.issue_title'),
                                    message: t('billing.confirm.issue_message', { count: doc.caseIds.length }),
                                    confirmLabel: t('billing.confirm.issue_button'),
                                    danger: false,
                                    onConfirm: () => doIssue(doc),
                                  })
                                }
                                className="flex items-center gap-2 cursor-pointer text-sky-700"
                              >
                                <Send size={14} />
                                {t('billing.actions.issue')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfirm({
                                    open: true,
                                    title: t('billing.confirm.delete_title'),
                                    message: t('billing.confirm.delete_message'),
                                    confirmLabel: t('billing.confirm.delete_button'),
                                    danger: true,
                                    onConfirm: () => doDelete(doc.id),
                                  })
                                }
                                className="flex items-center gap-2 cursor-pointer text-red-600"
                              >
                                <Trash2 size={14} />
                                {t('billing.actions.delete_draft')}
                              </DropdownMenuItem>
                            </>
                          )}

                          {doc.status === 'issued' && (
                            <DropdownMenuItem
                              onClick={() =>
                                setConfirm({
                                  open: true,
                                  title: t('billing.confirm.cancel_title'),
                                  message: t('billing.confirm.cancel_message'),
                                  confirmLabel: t('billing.actions.cancel_doc'),
                                  danger: true,
                                  onConfirm: () => doCancel(doc.id),
                                })
                              }
                              className="flex items-center gap-2 cursor-pointer text-red-600"
                            >
                              <Ban size={14} />
                              {t('billing.actions.cancel_doc')}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────────── */}

      {/* Create document modal */}
      <CreateDocumentModal
        open={createModal.open}
        onClose={() => setCreateModal((p) => ({ ...p, open: false }))}
        clientId={createModal.clientId}
        clientName={createModal.clientName}
        clientLogo={createModal.clientLogo}
        cases={createModal.cases}
        defaultType={createModal.type}
        onCreated={handleDocumentCreated}
      />

      {/* Generate report modal */}
      <GenerateReportModal
        open={reportModal.open}
        onClose={() => setReportModal((p) => ({ ...p, open: false }))}
        clientId={reportModal.clientId}
        clientName={reportModal.clientName}
        clientLogo={reportModal.clientLogo}
        cases={reportModal.cases}
      />

      {/* Payment method modal (per Receipt / Mas+Kab / Credit Note) */}
      <PaymentMethodModal
        open={!!paymentModalDoc}
        onClose={() => setPaymentModalDoc(null)}
        doc={paymentModalDoc}
        onConfirm={(payments) =>
          paymentModalDoc ? issueWithPayments(paymentModalDoc.id, payments) : Promise.resolve()
        }
      />

      {/* Confirm modal */}
      {confirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-elevated p-5 max-w-sm w-full">
            <h3 className="font-semibold text-slate-800 mb-2">{confirm.title}</h3>
            <p className="text-sm text-slate-600 mb-5">{confirm.message}</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirm((p) => ({ ...p, open: false }))}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => {
                  confirm.onConfirm();
                  setConfirm((p) => ({ ...p, open: false }));
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors ${
                  confirm.danger
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-sky-600 hover:bg-sky-700'
                }`}
              >
                {confirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit draft modal */}
      {editModal.open && editModal.doc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-elevated p-5 max-w-sm w-full space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">{t('billing.actions.edit_draft')}</h3>
              <button
                onClick={() => setEditModal((p) => ({ ...p, open: false }))}
                className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
              >
                ×
              </button>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">{t('billing.create_modal.subject_label')}</label>
              <input
                type="text"
                value={editModal.subject}
                onChange={(e) => setEditModal((p) => ({ ...p, subject: e.target.value }))}
                className="input-modern w-full text-sm h-9"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">{t('common.notes', { defaultValue: 'Note' })}</label>
              <textarea
                value={editModal.notes}
                onChange={(e) => setEditModal((p) => ({ ...p, notes: e.target.value }))}
                rows={3}
                className="input-modern w-full text-xs resize-none py-2"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">{t('cases.dueDate')}</label>
              <input
                type="date"
                value={editModal.dueDate}
                onChange={(e) => setEditModal((p) => ({ ...p, dueDate: e.target.value }))}
                className="input-modern w-full text-sm h-9"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setEditModal((p) => ({ ...p, open: false }))}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={doEditSave}
                disabled={editModal.saving}
                className="flex-1 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {editModal.saving && <Loader2 size={13} className="animate-spin" />}
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
