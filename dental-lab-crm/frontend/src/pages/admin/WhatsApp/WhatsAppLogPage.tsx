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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">
          <EyeOff size={11} /> shadow
        </span>
      );
    }
    const colors: Record<string, string> = {
      queued: 'bg-neutral-100 text-neutral-700',
      sent: 'bg-blue-100 text-blue-700',
      delivered: 'bg-teal-100 text-teal-700',
      read: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${colors[s] || 'bg-neutral-100 text-neutral-700'}`}>
        {s}
      </span>
    );
  };

  return (
    <div className="space-y-4 animate-fade-in pb-8 max-w-7xl mx-auto p-2 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-md">
            <MessageCircle size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">WhatsApp Agent</h1>
            <p className="text-xs text-neutral-500">
              Verifica casi incompleti e invio template — log e configurazione
            </p>
          </div>
        </div>
        <button
          onClick={loadAll}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-neutral-200 text-sm text-neutral-700 hover:bg-neutral-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Status & toggle */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="card-base p-4">
          <p className="text-xs text-neutral-500 mb-1">Modalità invio</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {status?.autoSendEnabled ? (
                <>
                  <Send size={18} className="text-green-600" />
                  <span className="font-bold text-green-700">LIVE</span>
                </>
              ) : (
                <>
                  <EyeOff size={18} className="text-purple-600" />
                  <span className="font-bold text-purple-700">SHADOW</span>
                </>
              )}
            </div>
            <button
              onClick={handleToggle}
              disabled={toggling || !status}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                status?.autoSendEnabled
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {toggling ? <Loader2 size={12} className="animate-spin" /> : status?.autoSendEnabled ? 'Disattiva' : 'Attiva LIVE'}
            </button>
          </div>
        </div>

        <div className="card-base p-4">
          <p className="text-xs text-neutral-500 mb-1">Meta API</p>
          <div className="flex items-center gap-2">
            {status?.metaConfigured ? (
              <>
                <CheckCircle2 size={18} className="text-green-600" />
                <span className="font-bold text-green-700">Configurato</span>
              </>
            ) : (
              <>
                <XCircle size={18} className="text-amber-600" />
                <span className="font-bold text-amber-700">Non configurato</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            {status?.metaConfigured
              ? 'PHONE_NUMBER_ID e ACCESS_TOKEN presenti in .env'
              : 'Aggiungi META_WA_* in .env per abilitare LIVE'}
          </p>
        </div>

        <div className="card-base p-4">
          <p className="text-xs text-neutral-500 mb-1">Template attivi</p>
          <div className="flex items-center gap-2">
            <MessageCircle size={18} className="text-brand-primary" />
            <span className="font-bold text-neutral-800">
              {templates.filter((t) => t.active).length} / {templates.length}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            Approvati Meta:{' '}
            {templates.filter((t) => t.metaStatus === 'approved').length}
          </p>
        </div>
      </div>

      {/* Templates */}
      <div className="card-base p-4">
        <h2 className="text-sm font-bold text-neutral-800 mb-3 flex items-center gap-2">
          <MessageCircle size={16} className="text-brand-primary" />
          Template
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="border border-neutral-100 rounded-xl p-3 bg-neutral-50/50"
            >
              <div className="flex items-center justify-between mb-1">
                <code className="text-xs font-mono font-semibold text-neutral-800">
                  {tpl.name}
                </code>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    tpl.metaStatus === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : tpl.metaStatus === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  Meta: {tpl.metaStatus}
                </span>
              </div>
              <p className="text-xs text-neutral-600 leading-snug">
                {tpl.bodyTemplate}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {tpl.variables.map((v, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-mono"
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
      <div className="card-base p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
            <Eye size={16} className="text-brand-primary" />
            Log Messaggi ({messages.length})
          </h2>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-neutral-400" />
            <input
              type="text"
              value={caseFilter}
              onChange={(e) => setCaseFilter(e.target.value)}
              placeholder="Filtra per Case ID (UUID)"
              className="input-modern text-xs h-8 w-64"
            />
            <button
              onClick={loadAll}
              className="px-2 py-1 text-xs rounded-lg bg-brand-primary text-white"
            >
              Applica
            </button>
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="text-center py-8 text-neutral-400 text-sm">
            <AlertTriangle size={24} className="mx-auto mb-2" />
            Nessun messaggio trovato
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-neutral-500 border-b border-neutral-100">
                <tr>
                  <th className="text-left py-2 px-2 font-medium">Quando</th>
                  <th className="text-left py-2 px-2 font-medium">Dir.</th>
                  <th className="text-left py-2 px-2 font-medium">Template</th>
                  <th className="text-left py-2 px-2 font-medium">A</th>
                  <th className="text-left py-2 px-2 font-medium">Corpo</th>
                  <th className="text-left py-2 px-2 font-medium">Stato</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-neutral-50 hover:bg-neutral-50/50"
                  >
                    <td className="py-2 px-2 text-neutral-600 whitespace-nowrap">
                      {fmtDate(m.createdAt)}
                    </td>
                    <td className="py-2 px-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          m.direction === 'outbound'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-teal-100 text-teal-700'
                        }`}
                      >
                        {m.direction === 'outbound' ? '→ OUT' : '← IN'}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <code className="text-[11px] text-neutral-700">
                        {m.templateName || '—'}
                      </code>
                    </td>
                    <td className="py-2 px-2 text-neutral-700 whitespace-nowrap">
                      {m.toPhone || m.fromPhone || '—'}
                    </td>
                    <td className="py-2 px-2 text-neutral-700 max-w-md truncate">
                      {m.bodyText || '—'}
                    </td>
                    <td className="py-2 px-2">{statusBadge(m.status, m.shadowOnly)}</td>
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
