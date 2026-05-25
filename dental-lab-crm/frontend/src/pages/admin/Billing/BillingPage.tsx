import { useState, useEffect } from 'react';
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
  AlertCircle,
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
    label: 'Da fatturare',
    icon: Inbox,
    description: 'Casi spediti senza documento',
    accentBg: 'bg-amber-50',
    accentText: 'text-amber-700',
    primary: true,
  },
  {
    id: 'invoice_order',
    label: 'Hashbonit Iska',
    hebrew: 'חשבונית עסקה',
    icon: FileText,
    description: 'Documento commerciale, pre-fattura',
    accentBg: 'bg-blue-50',
    accentText: 'text-blue-700',
    primary: true,
  },
  {
    id: 'tax_invoice',
    label: 'Hashbonit Mas',
    hebrew: 'חשבונית מס',
    icon: FileCheck,
    description: 'Fattura fiscale',
    accentBg: 'bg-emerald-50',
    accentText: 'text-emerald-700',
    primary: true,
  },
  {
    id: 'receipt_invoice',
    label: 'Mas + Kabala',
    hebrew: 'חשבונית מס/קבלה',
    icon: Receipt,
    description: 'Fattura + ricevuta combinata',
    accentBg: 'bg-teal-50',
    accentText: 'text-teal-700',
  },
  {
    id: 'receipt',
    label: 'Kabala',
    hebrew: 'קבלה',
    icon: Receipt,
    description: 'Ricevuta di pagamento',
    accentBg: 'bg-purple-50',
    accentText: 'text-purple-700',
  },
  {
    id: 'price_quote',
    label: 'Preventivo',
    hebrew: 'הצעת מחיר',
    icon: BarChart3,
    description: 'Preventivo non vincolante',
    accentBg: 'bg-indigo-50',
    accentText: 'text-indigo-700',
  },
  {
    id: 'credit_note',
    label: 'Zikui',
    hebrew: 'חשבונית זיכוי',
    icon: FileSpreadsheet,
    description: 'Nota di credito / storno',
    accentBg: 'bg-rose-50',
    accentText: 'text-rose-700',
  },
];

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: DocumentStatus }) {
  const cfg: Record<DocumentStatus, { label: string; cn: string }> = {
    draft: { label: 'Bozza', cn: 'bg-amber-100 text-amber-700' },
    issued: { label: 'Emesso', cn: 'bg-blue-100 text-blue-700' },
    paid: { label: 'Pagato', cn: 'bg-emerald-100 text-emerald-700' },
    cancelled: { label: 'Annullato', cn: 'bg-neutral-100 text-neutral-500' },
    error: { label: 'Errore', cn: 'bg-red-100 text-red-700' },
  };
  const { label, cn } = cfg[status] ?? { label: status, cn: 'bg-neutral-100 text-neutral-500' };
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
        title: 'Errore caricamento',
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

  // ── Mutations ─────────────────────────────────────────────────────────────────

  const doIssue = async (id: string) => {
    try {
      const updated = await documentsService.issue(id);
      setDocuments((prev) => prev.map((d) => (d.id === id ? updated : d)));
      loadUnbilled();
      toast({
        title: 'Documento emesso',
        description: `${updated.documentNumber} emesso correttamente.`,
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Errore emissione',
        description: e?.response?.data?.message || e.message,
      });
    }
  };

  const doDelete = async (id: string) => {
    try {
      await documentsService.remove(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      toast({ title: 'Bozza eliminata' });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Errore eliminazione',
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
        title: 'Documento annullato',
        description: 'I casi sono tornati in "Da fatturare".',
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Errore annullamento',
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
      toast({ title: 'Bozza aggiornata' });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Errore modifica',
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
      title: 'Bozza creata',
      description: 'Controlla il tab e premi "Emetti" per finalizzare il documento.',
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
      <div className="card-base bg-gradient-to-r from-blue-50 via-blue-50/50 to-transparent border-blue-200 p-3 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
          <CheckCircle size={16} className="text-blue-700" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-blue-900">
            Modulo Fatturazione — Fase B attiva (creazione documenti locali)
          </p>
          <p className="text-[11px] text-blue-800/80 mt-0.5">
            Crea bozze dai casi da fatturare, emetti i documenti con numerazione locale e visualizza
            il PDF. L'integrazione fiscale con <strong>invoice4u</strong> arriverà in{' '}
            <strong>Fase C</strong>.
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
              className={`p-2.5 rounded-2xl border bg-white transition-all text-left ${
                isActive
                  ? 'border-brand-primary ring-2 ring-brand-primary/30 shadow-sm'
                  : 'border-neutral-100 hover:border-neutral-200 hover:shadow-sm'
              }`}
              title={tab.description}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg ${tab.accentBg} flex items-center justify-center shrink-0`}
                >
                  <Icon size={15} className={tab.accentText} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-neutral-800 truncate leading-tight">
                    {tab.label}
                  </p>
                  {tab.hebrew && (
                    <p className="text-[10px] text-neutral-400 truncate leading-tight" dir="rtl">
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
              className="absolute start-3 top-1/2 -translate-y-1/2 text-neutral-400"
              size={14}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeTab === 'unbilled'
                  ? 'Cerca cliente, caso o paziente…'
                  : `Cerca ${active.label.toLowerCase()}…`
              }
              className="input-modern ps-9 w-full text-sm h-9"
            />
          </div>
          {activeTab !== 'unbilled' && (
            <div className="flex items-center gap-1 bg-neutral-50 rounded-xl px-2 h-9">
              <Calendar size={13} className="text-neutral-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-transparent text-xs outline-none w-32"
                title="Dal"
              />
              <span className="text-neutral-300">→</span>
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
              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-sm font-medium flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw size={13} className={loadingUnbilled ? 'animate-spin' : ''} />
              Aggiorna
            </button>
          ) : (
            <button
              onClick={() =>
                toast({
                  title: 'Crea da "Da fatturare"',
                  description:
                    'Vai al tab "Da fatturare" e usa +Iska o +Mas/Kab per creare un documento.',
                })
              }
              className="px-3 py-1.5 bg-brand-primary text-white rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-1.5 shrink-0"
            >
              <Plus size={14} />
              Nuovo {active.label}
            </button>
          )}
        </div>

        {/* Export row (non-unbilled tabs) */}
        {activeTab !== 'unbilled' && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => notImplemented("L'export PDF")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-medium"
            >
              <Download size={12} />
              Esporta PDF
            </button>
            <button
              onClick={() => notImplemented("L'export Excel")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-medium"
            >
              <FileSpreadsheet size={12} />
              Esporta Excel
            </button>
            <button
              onClick={() => notImplemented("L'invio WhatsApp")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium"
            >
              <MessageCircle size={12} />
              Invia via WhatsApp
            </button>
          </div>
        )}

        {/* ── UNBILLED TAB ──────────────────────────────────────────────────────── */}
        {activeTab === 'unbilled' ? (
          loadingUnbilled ? (
            <div className="text-center py-16">
              <Loader2 size={28} className="mx-auto animate-spin text-brand-primary mb-3" />
              <p className="text-sm text-neutral-500">Caricamento casi da fatturare…</p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-neutral-200 rounded-2xl">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 mx-auto mb-3 flex items-center justify-center">
                <Inbox size={24} className="text-amber-700" />
              </div>
              <p className="text-sm font-semibold text-neutral-700">Nessun caso da fatturare</p>
              <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
                I casi appariranno qui appena passi il loro stato a <strong>Spedito</strong>.
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
                      className="border border-neutral-100 rounded-2xl overflow-hidden bg-white"
                    >
                      <div
                        onClick={() => setExpandedClient(isOpen ? null : g.client.id)}
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-neutral-50/60 transition"
                      >
                        <button
                          className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 shrink-0"
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
                          <p className="font-semibold text-sm text-neutral-800 truncate">
                            {g.client.studioName}
                          </p>
                          <p className="text-[11px] text-neutral-500 mt-0.5">
                            <span className="font-bold text-brand-primary text-sm">
                              ₪
                              {g.totalAmount.toLocaleString('it-IT', {
                                maximumFractionDigits: 0,
                              })}
                            </span>
                            <span className="mx-1.5 text-neutral-300">·</span>
                            {g.casesCount} {g.casesCount === 1 ? 'caso' : 'casi'}
                            <span className="mx-1.5 text-neutral-300">·</span>
                            {g.teethCount} denti
                          </p>
                        </div>
                        <div className="flex gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => openReportModal(g, e)}
                            className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
                            title="Genera report PDF da approvare"
                          >
                            <FileText size={13} />
                            <span className="hidden sm:inline">Report</span>
                          </button>
                          <button
                            onClick={(e) => openCreateModal('invoice_order', g, e)}
                            className="px-3 py-2 bg-brand-primary hover:opacity-90 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
                            title="Crea documento fiscale per questo cliente"
                          >
                            <Plus size={13} />
                            <span className="hidden sm:inline">Crea documento</span>
                            <span className="sm:hidden">Crea</span>
                          </button>
                        </div>
                      </div>

                      {/* Expanded cases list */}
                      {isOpen && (
                        <div className="border-t border-neutral-100 bg-neutral-50/40">
                          <table className="w-full text-xs">
                            <thead className="text-[10px] uppercase text-neutral-500">
                              <tr>
                                <th className="text-left px-3 py-2 font-medium">Caso</th>
                                <th className="text-left px-3 py-2 font-medium">Paziente</th>
                                <th className="text-left px-3 py-2 font-medium">Spedito</th>
                                <th className="text-left px-3 py-2 font-medium">Denti</th>
                                <th className="text-right px-3 py-2 font-medium">Totale</th>
                              </tr>
                            </thead>
                            <tbody>
                              {g.cases.map((c) => (
                                <tr
                                  key={c.id}
                                  className="border-t border-neutral-100 hover:bg-white/60"
                                >
                                  <td className="px-3 py-2">
                                    <a
                                      href={`/admin/cases/${c.id}`}
                                      className="font-mono text-brand-primary hover:underline"
                                    >
                                      {c.caseNumber}
                                    </a>
                                  </td>
                                  <td className="px-3 py-2 text-neutral-700">
                                    {c.patientName || (
                                      <span className="text-neutral-300">—</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-neutral-600">
                                    {c.shippedDate
                                      ? new Date(c.shippedDate).toLocaleDateString('it-IT', {
                                          day: '2-digit',
                                          month: 'short',
                                        })
                                      : '—'}
                                  </td>
                                  <td className="px-3 py-2 text-neutral-700">
                                    <span className="inline-flex items-center gap-1">
                                      <span className="font-semibold">{c.teethCount}</span>
                                      <span className="text-[10px] text-neutral-400">
                                        (
                                        {c.teeth
                                          .slice(0, 3)
                                          .map((t) => `${t.toothNumber}${t.material[0]}`)
                                          .join(' ')}
                                        {c.teeth.length > 3 ? '…' : ''})
                                      </span>
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-right font-semibold text-neutral-800">
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
              <div className="flex items-center justify-end gap-3 pt-2 px-1 text-xs text-neutral-500 border-t border-neutral-100">
                <span className="pt-2">
                  <strong className="text-neutral-700">{filteredGroups.length}</strong>{' '}
                  {filteredGroups.length === 1 ? 'cliente' : 'clienti'}
                </span>
                <span className="text-neutral-300 pt-2">·</span>
                <span className="pt-2">
                  <strong className="text-neutral-700">{totalCases}</strong>{' '}
                  {totalCases === 1 ? 'caso' : 'casi'}
                </span>
                <span className="text-neutral-300 pt-2">·</span>
                <span className="pt-2">
                  Totale:{' '}
                  <strong className="text-brand-primary text-sm">
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
                <Loader2 size={28} className="mx-auto animate-spin text-brand-primary mb-3" />
                <p className="text-sm text-neutral-500">Caricamento documenti…</p>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-neutral-200 rounded-2xl">
                <div
                  className={`w-14 h-14 rounded-2xl ${active.accentBg} mx-auto mb-3 flex items-center justify-center`}
                >
                  <active.icon size={24} className={active.accentText} />
                </div>
                <div className="flex items-baseline justify-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-neutral-700">
                    Nessun {active.label}
                  </p>
                  {active.hebrew && (
                    <p className="text-xs text-neutral-500" dir="rtl">
                      ({active.hebrew})
                    </p>
                  )}
                </div>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                  Crea documenti dal tab{' '}
                  <button
                    onClick={() => setActiveTab('unbilled')}
                    className="text-brand-primary underline underline-offset-2"
                  >
                    Da fatturare
                  </button>{' '}
                  usando +Iska o +Mas/Kab.
                </p>
              </div>
            ) : (
              <>
                {/* Summary strip */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-neutral-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] uppercase text-neutral-500 font-medium tracking-wider">
                      Documenti
                    </p>
                    <p className="text-lg font-bold text-neutral-800">{filteredDocs.length}</p>
                  </div>
                  <div className="bg-brand-primary/10 rounded-xl p-3 text-center">
                    <p className="text-[10px] uppercase text-brand-primary font-semibold tracking-wider">
                      Totale
                    </p>
                    <p className="text-lg font-bold text-brand-primary">
                      ₪{totalDocAmount.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>

                {/* Document list */}
                <div className="space-y-2">
                  {filteredDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 border border-neutral-100 rounded-2xl hover:bg-neutral-50/60 transition"
                    >
                      {/* Left: status + info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={doc.status} />
                          <span className="font-mono text-sm font-semibold text-neutral-800">
                            {doc.documentNumber ?? (
                              <span className="font-normal text-neutral-400 font-sans">Bozza</span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ClientAvatar
                            studioName={doc.client.studioName}
                            logoUrl={doc.client.logoUrl}
                            size={18}
                          />
                          <span className="text-xs text-neutral-700">{doc.client.studioName}</span>
                          {doc.subject && (
                            <span className="text-xs text-neutral-400 truncate hidden sm:block">
                              · {doc.subject}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-neutral-400">
                          {doc.issueDate
                            ? `Emesso: ${new Date(doc.issueDate).toLocaleDateString('it-IT', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}`
                            : `Creato: ${new Date(doc.createdAt).toLocaleDateString('it-IT', {
                                day: '2-digit',
                                month: 'short',
                              })}`}
                          {' · '}
                          {doc.caseIds.length} {doc.caseIds.length === 1 ? 'caso' : 'casi'}
                          {doc.dueDate && (
                            <>
                              {' · '}
                              <span className="text-amber-600">
                                Scad.{' '}
                                {new Date(doc.dueDate).toLocaleDateString('it-IT', {
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
                        <p className="text-base font-bold text-neutral-800">
                          ₪{Number(doc.total).toLocaleString('it-IT', { maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-[10px] text-neutral-400">IVA {doc.taxRate}%</p>
                      </div>

                      {/* PDF button — visibile sempre */}
                      <button
                        onClick={() =>
                          window.open(documentsService.getPdfUrl(doc.id), '_blank')
                        }
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 shrink-0"
                        title={
                          doc.invoice4uUniqueId
                            ? 'Apri PDF invoice4u'
                            : 'Apri PDF promemoria'
                        }
                      >
                        <Eye size={12} />
                        PDF
                      </button>

                      {(doc.status === 'draft' || doc.status === 'issued') && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-500 shrink-0">
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
                                Modifica bozza
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfirm({
                                    open: true,
                                    title: 'Emetti documento?',
                                    message: `Verrà assegnato il numero locale. I ${doc.caseIds.length} casi associati risulteranno fatturati.`,
                                    confirmLabel: 'Emetti',
                                    danger: false,
                                    onConfirm: () => doIssue(doc.id),
                                  })
                                }
                                className="flex items-center gap-2 cursor-pointer text-blue-700"
                              >
                                <Send size={14} />
                                Emetti
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfirm({
                                    open: true,
                                    title: 'Elimina bozza?',
                                    message: 'Questa bozza verrà eliminata definitivamente.',
                                    confirmLabel: 'Elimina',
                                    danger: true,
                                    onConfirm: () => doDelete(doc.id),
                                  })
                                }
                                className="flex items-center gap-2 cursor-pointer text-red-600"
                              >
                                <Trash2 size={14} />
                                Elimina bozza
                              </DropdownMenuItem>
                            </>
                          )}

                          {doc.status === 'issued' && (
                            <DropdownMenuItem
                              onClick={() =>
                                setConfirm({
                                  open: true,
                                  title: 'Annulla documento?',
                                  message:
                                    'Il documento verrà annullato e i casi torneranno in "Da fatturare".',
                                  confirmLabel: 'Annulla documento',
                                  danger: true,
                                  onConfirm: () => doCancel(doc.id),
                                })
                              }
                              className="flex items-center gap-2 cursor-pointer text-red-600"
                            >
                              <Ban size={14} />
                              Annulla documento
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

        {/* Roadmap */}
        <div className="bg-neutral-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-neutral-600 mb-2 flex items-center gap-1.5">
            <AlertCircle size={12} />
            Roadmap fatturazione
          </p>
          <ul className="text-xs text-neutral-600 space-y-1.5 list-disc list-inside ms-1">
            <li>
              <strong>Fase A</strong> ✅ — visualizzazione casi spediti da fatturare, raggruppati
              per cliente
            </li>
            <li>
              <strong>Fase B</strong> ✅ — creazione documenti locali (bozze), numerazione locale,
              emissione, PDF promemoria
            </li>
            <li>
              <strong>Fase C</strong> — integrazione invoice4u SOAP: emissione fiscale con
              numerazione ufficiale, PDF dal portale, sync cliente
            </li>
            <li>
              <strong>Fase D</strong> — export Excel filtrabile + invio documento via WhatsApp con
              PDF allegato
            </li>
          </ul>
        </div>
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

      {/* Confirm modal */}
      {confirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-5 max-w-sm w-full">
            <h3 className="font-semibold text-neutral-800 mb-2">{confirm.title}</h3>
            <p className="text-sm text-neutral-600 mb-5">{confirm.message}</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirm((p) => ({ ...p, open: false }))}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-sm text-neutral-600 hover:bg-neutral-50"
              >
                Annulla
              </button>
              <button
                onClick={() => {
                  confirm.onConfirm();
                  setConfirm((p) => ({ ...p, open: false }));
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold text-white ${
                  confirm.danger
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-brand-primary hover:opacity-90'
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
          <div className="bg-white rounded-2xl shadow-xl p-5 max-w-sm w-full space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-neutral-800">Modifica bozza</h3>
              <button
                onClick={() => setEditModal((p) => ({ ...p, open: false }))}
                className="w-7 h-7 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400"
              >
                ×
              </button>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1 block">Oggetto</label>
              <input
                type="text"
                value={editModal.subject}
                onChange={(e) => setEditModal((p) => ({ ...p, subject: e.target.value }))}
                className="input-modern w-full text-sm h-9"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1 block">Note</label>
              <textarea
                value={editModal.notes}
                onChange={(e) => setEditModal((p) => ({ ...p, notes: e.target.value }))}
                rows={3}
                className="input-modern w-full text-xs resize-none py-2"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1 block">Scadenza</label>
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
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-600 hover:bg-neutral-50"
              >
                Annulla
              </button>
              <button
                onClick={doEditSave}
                disabled={editModal.saving}
                className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {editModal.saving && <Loader2 size={13} className="animate-spin" />}
                Salva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
