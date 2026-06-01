import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MessageCircle,
  Send,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Filter,
  Settings,
  FileText,
  Phone,
  ChevronDown,
} from 'lucide-react';
import whatsappService, {
  WhatsAppStatus,
  WhatsAppTemplate,
  WhatsAppMessage,
} from '@/services/whatsapp.service';
import { useToast } from '@/components/ui/use-toast';

export default function WhatsAppLogPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [caseFilter, setCaseFilter] = useState('');
  const [showAllTemplates, setShowAllTemplates] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, tpl, msg] = await Promise.all([
        whatsappService.getStatus(),
        whatsappService.listTemplates(),
        whatsappService.listMessages({ caseId: caseFilter || undefined, limit: 200 }),
      ]);
      setStatus(s);
      setTemplates(tpl);
      setMessages(msg);
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: e?.response?.data?.message || e.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = async () => {
    if (!status) return;
    const next = !status.autoSendEnabled;
    if (next && !status.metaConfigured) {
      toast({
        variant: 'destructive',
        title: 'Meta non configurato',
        description:
          'Imposta META_WA_PHONE_NUMBER_ID e META_WA_ACCESS_TOKEN in .env prima di attivare la modalità live.',
      });
      return;
    }
    if (next) {
      const confirm = window.confirm(
        '⚠️ Stai per attivare la modalità LIVE. I messaggi verranno spediti realmente via WhatsApp. Continuare?',
      );
      if (!confirm) return;
    }
    setToggling(true);
    try {
      const updated = await whatsappService.setAutoSend(next);
      setStatus(updated);
      toast({
        title: next ? 'Modalità LIVE attivata' : 'Modalità SHADOW attivata',
        description: next
          ? 'I prossimi messaggi verranno spediti realmente.'
          : 'I prossimi messaggi saranno solo loggati nel DB.',
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Errore toggle',
        description: e?.response?.data?.message || e.message,
      });
    } finally {
      setToggling(false);
    }
  };

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  const statusBadge = (s: string, shadow: boolean) => {
    if (shadow) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 ring-1 ring-violet-500/20">
          <EyeOff size={11} /> shadow
        </span>
      );
    }
    const colors: Record<string, string> = {
      queued: 'bg-stone-100 text-stone-700 ring-1 ring-slate-400/20',
      sent: 'bg-orange-50 text-sky-700 ring-1 ring-sky-500/20',
      delivered: 'bg-green-50 text-teal-700 ring-1 ring-teal-500/20',
      read: 'bg-green-50 text-emerald-700 ring-1 ring-emerald-500/20',
      failed: 'bg-red-50 text-red-700 ring-1 ring-red-500/20',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${colors[s] || 'bg-stone-100 text-stone-700 ring-1 ring-slate-400/20'}`}>
        {s}
      </span>
    );
  };

  const visibleTemplates = showAllTemplates ? templates : templates.slice(0, 4);

  return (
    <div className="space-y-6 animate-fade-in pb-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-stone-800 flex items-center justify-center shadow-soft">
            <MessageCircle size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-800">WhatsApp Agent</h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Verifica casi incompleti e invio template — log e configurazione
            </p>
          </div>
        </div>
        <button
          onClick={loadAll}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-sm text-stone-700 hover:bg-stone-50 hover:border-stone-300 shadow-soft transition-all"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Status & toggle */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-base p-5">
          <p className="text-xs text-stone-500 mb-2 font-medium uppercase tracking-wide">Modalità invio</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {status?.autoSendEnabled ? (
                <>
                  <Send size={18} className="text-green-800" />
                  <span className="font-bold text-teal-700">LIVE</span>
                </>
              ) : (
                <>
                  <EyeOff size={18} className="text-amber-800" />
                  <span className="font-bold text-sky-700">SHADOW</span>
                </>
              )}
            </div>
            <button
              onClick={handleToggle}
              disabled={toggling || !status}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition shadow-soft ${
                status?.autoSendEnabled
                  ? 'bg-red-50 text-red-700 hover:bg-red-100 ring-1 ring-red-500/20'
                  : 'bg-green-50 text-teal-700 hover:bg-teal-100 ring-1 ring-teal-500/20'
              }`}
            >
              {toggling ? <Loader2 size={12} className="animate-spin" /> : status?.autoSendEnabled ? 'Disattiva' : 'Attiva LIVE'}
            </button>
          </div>
        </div>

        <div className="card-base p-5">
          <p className="text-xs text-stone-500 mb-2 font-medium uppercase tracking-wide">Meta API</p>
          <div className="flex items-center gap-2">
            {status?.metaConfigured ? (
              <>
                <CheckCircle2 size={18} className="text-green-800" />
                <span className="font-bold text-teal-700">Configurato</span>
              </>
            ) : (
              <>
                <XCircle size={18} className="text-amber-600" />
                <span className="font-bold text-amber-700">Non configurato</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
            {status?.metaConfigured
              ? 'PHONE_NUMBER_ID e ACCESS_TOKEN presenti in .env'
              : 'Aggiungi META_WA_* in .env per abilitare LIVE'}
          </p>
        </div>

        <div className="card-base p-5">
          <p className="text-xs text-stone-500 mb-2 font-medium uppercase tracking-wide">Template attivi</p>
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-amber-800" />
            <span className="font-bold text-stone-800">
              {templates.filter((t) => t.active).length} / {templates.length}
            </span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
            Approvati Meta:{' '}
            <span className="font-semibold text-stone-700">
              {templates.filter((t) => t.metaStatus === 'approved').length}
            </span>
          </p>
        </div>
      </div>

      {/* Templates */}
      <div className="card-base p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-stone-800 flex items-center gap-2">
            <FileText size={16} className="text-amber-800" />
            Template
          </h2>
          {templates.length > 4 && (
            <button
              onClick={() => setShowAllTemplates(v => !v)}
              className="text-xs text-amber-800 font-semibold hover:text-sky-700 transition-colors flex items-center gap-1"
            >
              {showAllTemplates ? 'Mostra meno' : `Mostra tutti (${templates.length})`}
              <ChevronDown size={14} className={`transition-transform ${showAllTemplates ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {visibleTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className="border border-stone-100 rounded-xl p-4 bg-stone-50/50 hover:bg-white hover:shadow-soft transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <code className="text-xs font-mono font-semibold text-stone-800 bg-stone-100 px-2 py-1 rounded-lg">
                  {tpl.name}
                </code>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                    tpl.metaStatus === 'approved'
                      ? 'bg-green-50 text-teal-700 ring-1 ring-teal-500/20'
                      : tpl.metaStatus === 'rejected'
                        ? 'bg-red-50 text-red-700 ring-1 ring-red-500/20'
                        : 'bg-orange-50 text-amber-700 ring-1 ring-amber-500/20'
                  }`}
                >
                  Meta: {tpl.metaStatus}
                </span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                {tpl.bodyTemplate}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {tpl.variables.map((v, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 bg-orange-50 text-sky-700 rounded-lg font-mono ring-1 ring-sky-500/20"
                  >
                    {`{{${i + 1}}}`}={v}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Messages log */}
      <div className="card-base p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-stone-800 flex items-center gap-2">
            <Eye size={16} className="text-amber-800" />
            Log Messaggi ({messages.length})
          </h2>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-stone-400" />
            <input
              type="text"
              value={caseFilter}
              onChange={(e) => setCaseFilter(e.target.value)}
              placeholder="Filtra per Case ID (UUID)"
              className="input-modern text-xs h-9 w-64"
            />
            <button
              onClick={loadAll}
              className="px-3 py-1.5 text-xs rounded-xl bg-amber-800 text-white font-semibold hover:bg-sky-700 transition-colors shadow-soft"
            >
              Applica
            </button>
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="text-center py-10 text-stone-400 text-sm">
            <div className="w-12 h-12 rounded-xl bg-stone-50 flex items-center justify-center mx-auto mb-3 ring-1 ring-slate-100">
              <AlertTriangle size={22} className="text-slate-300" />
            </div>
            <p className="font-medium">Nessun messaggio trovato</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-stone-100">
            <table className="w-full text-xs">
              <thead className="text-stone-500 bg-stone-50/80">
                <tr>
                  <th className="text-left py-3 px-3 font-semibold">Quando</th>
                  <th className="text-left py-3 px-3 font-semibold">Dir.</th>
                  <th className="text-left py-3 px-3 font-semibold">Template</th>
                  <th className="text-left py-3 px-3 font-semibold">A</th>
                  <th className="text-left py-3 px-3 font-semibold">Corpo</th>
                  <th className="text-left py-3 px-3 font-semibold">Stato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {messages.map((m) => (
                  <tr
                    key={m.id}
                    className="hover:bg-stone-50/60 transition-colors"
                  >
                    <td className="py-3 px-3 text-stone-600 whitespace-nowrap">
                      {fmtDate(m.createdAt)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold ${
                          m.direction === 'outbound'
                            ? 'bg-orange-50 text-sky-700 ring-1 ring-sky-500/20'
                            : 'bg-green-50 text-teal-700 ring-1 ring-teal-500/20'
                        }`}
                      >
                        {m.direction === 'outbound' ? '→ OUT' : '← IN'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <code className="text-[11px] text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded">
                        {m.templateName || '—'}
                      </code>
                    </td>
                    <td className="py-3 px-3 text-stone-700 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Phone size={10} className="text-stone-400" />
                        {m.toPhone || m.fromPhone || '—'}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-stone-700 max-w-md truncate">
                      {m.bodyText || '—'}
                    </td>
                    <td className="py-3 px-3">{statusBadge(m.status, m.shadowOnly)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
