import { useState } from 'react';
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
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

type TabId = 'preventivi' | 'fatture' | 'ricevute' | 'report';

interface TabDef {
  id: TabId;
  label: string;
  icon: typeof FileText;
  description: string;
  accentBg: string;
  accentText: string;
}

const TABS: TabDef[] = [
  {
    id: 'preventivi',
    label: 'Preventivi',
    icon: FileText,
    description: 'Preventivi per i clienti',
    accentBg: 'bg-blue-50',
    accentText: 'text-blue-700',
  },
  {
    id: 'fatture',
    label: 'Fatture',
    icon: FileCheck,
    description: 'Fatture emesse',
    accentBg: 'bg-emerald-50',
    accentText: 'text-emerald-700',
  },
  {
    id: 'ricevute',
    label: 'Ricevute',
    icon: Receipt,
    description: 'Ricevute di pagamento',
    accentBg: 'bg-purple-50',
    accentText: 'text-purple-700',
  },
  {
    id: 'report',
    label: 'Report',
    icon: BarChart3,
    description: 'Report con filtri data',
    accentBg: 'bg-amber-50',
    accentText: 'text-amber-700',
  },
];

export default function BillingPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>('preventivi');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const notImplemented = (what: string) => {
    toast({
      title: 'In arrivo',
      description: `${what} sarà disponibile con l'integrazione invoice4u`,
    });
  };

  const active = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="space-y-4 animate-fade-in pb-8 max-w-7xl mx-auto p-2 sm:p-4">
      {/* Header with upcoming-feature banner */}
      <div className="card-base bg-gradient-to-r from-amber-50 via-amber-50/50 to-transparent border-amber-200 p-3 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
          <Zap size={16} className="text-amber-700" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-amber-900">
            Modulo Fatturazione — anteprima
          </p>
          <p className="text-[11px] text-amber-800/80 mt-0.5">
            L'interfaccia è pronta. La creazione/emissione documenti, esportazione PDF/Excel e invio WhatsApp si attiveranno
            quando collegheremo l'API di <strong>invoice4u</strong>.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`card-base p-3 text-left transition-all ${
                isActive
                  ? 'ring-2 ring-brand-primary shadow-md'
                  : 'hover:shadow-md opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-lg ${tab.accentBg} flex items-center justify-center`}
                >
                  <Icon size={16} className={tab.accentText} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-800">{tab.label}</p>
                  <p className="text-[10px] text-neutral-500 truncate">{tab.description}</p>
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
              placeholder={`Cerca ${active.label.toLowerCase()}…`}
              className="input-modern ps-9 w-full text-sm h-9"
            />
          </div>
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
          <button
            onClick={() => notImplemented('La creazione documenti')}
            className="px-3 py-1.5 bg-brand-primary text-white rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-1.5 shrink-0"
          >
            <Plus size={14} />
            Nuovo {active.label.slice(0, -1).toLowerCase()}
          </button>
        </div>

        {/* Action buttons row */}
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

        {/* Empty state placeholder */}
        <div className="text-center py-16 border-2 border-dashed border-neutral-200 rounded-2xl">
          <div className={`w-14 h-14 rounded-2xl ${active.accentBg} mx-auto mb-3 flex items-center justify-center`}>
            <active.icon size={24} className={active.accentText} />
          </div>
          <p className="text-sm font-semibold text-neutral-700">Nessun {active.label.toLowerCase()} ancora</p>
          <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
            Questa sezione sarà popolata automaticamente quando collegheremo invoice4u.
            Potrai anche crearli manualmente da qui.
          </p>
        </div>

        {/* Future features */}
        <div className="bg-neutral-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-neutral-600 mb-2 flex items-center gap-1.5">
            <AlertCircle size={12} />
            Funzionalità in arrivo
          </p>
          <ul className="text-xs text-neutral-600 space-y-1.5 list-disc list-inside ml-1">
            <li>Sincronizzazione bidirezionale con invoice4u (emissione documenti, numerazione automatica)</li>
            <li>Generazione PDF brandizzati per ogni tipo di documento</li>
            <li>Export Excel filtrabile per data, cliente, stato pagamento</li>
            <li>Invio diretto del documento al WhatsApp del cliente (richiede template Meta approvato)</li>
            <li>Report aggregati (fatturato mese / trimestre / anno) con grafici</li>
            <li>Promemoria automatici pagamenti in scadenza</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
