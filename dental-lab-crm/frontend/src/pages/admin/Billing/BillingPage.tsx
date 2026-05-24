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
  Zap,
  Inbox,
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw,
  MoreHorizontal,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ClientAvatar } from '@/components/common/ClientAvatar';
import billingService, { UnbilledGroup } from '@/services/billing.service';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  /** Mostrato nei tab "vetrina" principali. Gli altri vanno nel menu Altri Documenti */
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

const PRIMARY_TABS = TABS.filter((t) => t.primary);
const OTHER_TABS = TABS.filter((t) => !t.primary);

export default function BillingPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>('unbilled');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Unbilled state
  const [unbilledGroups, setUnbilledGroups] = useState<UnbilledGroup[]>([]);
  const [loadingUnbilled, setLoadingUnbilled] = useState(false);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

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
    if (activeTab === 'unbilled') loadUnbilled();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const notImplemented = (what: string) => {
    toast({
      title: 'In arrivo (Fase B/C)',
      description: `${what} sarà disponibile con l'integrazione invoice4u`,
    });
  };

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

  const totalAcrossClients = filteredGroups.reduce((s, g) => s + g.totalAmount, 0);
  const totalCases = filteredGroups.reduce((s, g) => s + g.casesCount, 0);

  return (
    <div className="space-y-4 animate-fade-in pb-8 max-w-7xl mx-auto p-2 sm:p-4">
      {/* Banner: solo finché Fase C non è attiva */}
      <div className="card-base bg-gradient-to-r from-amber-50 via-amber-50/50 to-transparent border-amber-200 p-3 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
          <Zap size={16} className="text-amber-700" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-amber-900">
            Modulo Fatturazione — Fase A attiva (visualizzazione casi da fatturare)
          </p>
          <p className="text-[11px] text-amber-800/80 mt-0.5">
            La creazione documenti, esportazione PDF/Excel e invio WhatsApp si attiveranno con la <strong>Fase B</strong>.
            L'integrazione fiscale con <strong>invoice4u</strong> arriverà in <strong>Fase C</strong>: da quel momento le fatture
            emesse riceveranno numerazione fiscale ufficiale e il PDF sarà quello del portale invoice4u.
          </p>
        </div>
      </div>

      {/* Primary tabs row (3 vetrina) + Other dropdown */}
      <div className="flex flex-wrap items-stretch gap-2">
        {PRIMARY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`card-base p-3 text-left transition-all flex-1 min-w-[180px] ${
                isActive
                  ? 'ring-2 ring-brand-primary shadow-md'
                  : 'hover:shadow-md opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-lg ${tab.accentBg} flex items-center justify-center shrink-0`}>
                  <Icon size={16} className={tab.accentText} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-sm font-semibold text-neutral-800">{tab.label}</p>
                    {tab.hebrew && (
                      <p className="text-[11px] text-neutral-500" dir="rtl">
                        {tab.hebrew}
                      </p>
                    )}
                  </div>
                  <p className="text-[10px] text-neutral-500 truncate">{tab.description}</p>
                </div>
              </div>
            </button>
          );
        })}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`card-base p-3 text-left transition-all min-w-[160px] ${
                OTHER_TABS.some((t) => t.id === activeTab)
                  ? 'ring-2 ring-brand-primary shadow-md'
                  : 'hover:shadow-md opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                  <MoreHorizontal size={16} className="text-neutral-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-800">Altri documenti</p>
                  <p className="text-[10px] text-neutral-500 truncate">
                    {OTHER_TABS.some((t) => t.id === activeTab)
                      ? `Attivo: ${active.label}`
                      : 'Kabala · Preventivo · Zikui'}
                  </p>
                </div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {OTHER_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <DropdownMenuItem
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-start gap-2 cursor-pointer"
                >
                  <div className={`w-7 h-7 rounded-lg ${tab.accentBg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon size={13} className={tab.accentText} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-medium">{tab.label}</span>
                      {tab.hebrew && (
                        <span className="text-[10px] text-neutral-400" dir="rtl">
                          {tab.hebrew}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-neutral-500">{tab.description}</p>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main content area */}
      <div className="card-base p-4 sm:p-5 space-y-4">
        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-neutral-400" size={14} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeTab === 'unbilled' ? 'Cerca cliente, caso o paziente…' : `Cerca ${active.label.toLowerCase()}…`
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
              onClick={() => notImplemented('La creazione documenti')}
              className="px-3 py-1.5 bg-brand-primary text-white rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-1.5 shrink-0"
            >
              <Plus size={14} />
              Nuovo {active.label}
            </button>
          )}
        </div>

        {/* Action buttons row (only for non-unbilled tabs) */}
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

        {/* Body: UNBILLED tab — real data */}
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
              {/* Totals strip */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-neutral-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] uppercase text-neutral-500 font-medium tracking-wider">Clienti</p>
                  <p className="text-lg font-bold text-neutral-800">{filteredGroups.length}</p>
                </div>
                <div className="bg-neutral-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] uppercase text-neutral-500 font-medium tracking-wider">Casi</p>
                  <p className="text-lg font-bold text-neutral-800">{totalCases}</p>
                </div>
                <div className="bg-brand-primary/10 rounded-xl p-3 text-center">
                  <p className="text-[10px] uppercase text-brand-primary font-semibold tracking-wider">Totale</p>
                  <p className="text-lg font-bold text-brand-primary">
                    ₪{totalAcrossClients.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>

              {/* Groups list */}
              <div className="space-y-2">
                {filteredGroups.map((g) => {
                  const isOpen = expandedClient === g.client.id;
                  return (
                    <div
                      key={g.client.id}
                      className="border border-neutral-100 rounded-2xl overflow-hidden bg-white"
                    >
                      {/* Row header */}
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
                          <p className="text-[11px] text-neutral-500">
                            {g.casesCount} {g.casesCount === 1 ? 'caso' : 'casi'} · {g.teethCount} denti
                          </p>
                        </div>
                        <div className="text-right shrink-0 me-2">
                          <p className="text-lg font-bold text-brand-primary">
                            ₪{g.totalAmount.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
                          </p>
                          <p className="text-[10px] text-neutral-400">totale da fatturare</p>
                        </div>
                        <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => notImplemented('Crea חשבונית עסקה (InvoiceOrder)')}
                            className="px-2.5 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-medium"
                            title="Crea חשבונית עסקה (paga dopo)"
                          >
                            +Iska
                          </button>
                          <button
                            onClick={() => notImplemented('Crea חשבונית מס/קבלה (ReceiptInvoice)')}
                            className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-xs font-medium"
                            title="Crea חשבונית מס+קבלה (paga subito)"
                          >
                            +Mas/Kab
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
                                    {c.patientName || <span className="text-neutral-300">—</span>}
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
                                        ({c.teeth
                                          .slice(0, 3)
                                          .map((t) => `${t.toothNumber}${t.material[0]}`)
                                          .join(' ')}
                                        {c.teeth.length > 3 ? '…' : ''})
                                      </span>
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-right font-semibold text-neutral-800">
                                    ₪{c.totalPrice.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
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
            </>
          )
        ) : (
          /* OTHER TABS — placeholder, will be filled in Fase B/C */
          <div className="text-center py-16 border-2 border-dashed border-neutral-200 rounded-2xl">
            <div className={`w-14 h-14 rounded-2xl ${active.accentBg} mx-auto mb-3 flex items-center justify-center`}>
              <active.icon size={24} className={active.accentText} />
            </div>
            <div className="flex items-baseline justify-center gap-2 mb-1">
              <p className="text-sm font-semibold text-neutral-700">Nessun {active.label}</p>
              {active.hebrew && (
                <p className="text-xs text-neutral-500" dir="rtl">
                  ({active.hebrew})
                </p>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
              Questa sezione sarà popolata in <strong>Fase B</strong> (CRUD locale) e sincronizzata
              automaticamente con invoice4u in <strong>Fase C</strong>.
            </p>
          </div>
        )}

        {/* Future features panel */}
        <div className="bg-neutral-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-neutral-600 mb-2 flex items-center gap-1.5">
            <AlertCircle size={12} />
            Roadmap fatturazione
          </p>
          <ul className="text-xs text-neutral-600 space-y-1.5 list-disc list-inside ms-1">
            <li>
              <strong>Fase A</strong> ✅ — visualizzazione casi spediti da fatturare, raggruppati per cliente
            </li>
            <li>
              <strong>Fase B</strong> — creazione documenti locali (bozze) con generazione numero,
              modifica righe, PDF "promemoria"
            </li>
            <li>
              <strong>Fase C</strong> — integrazione invoice4u SOAP: emissione fiscale con numerazione
              ufficiale, PDF dal portale, sync cliente
            </li>
            <li>
              <strong>Fase D</strong> — export Excel filtrabile + invio documento via WhatsApp con PDF
              allegato
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
