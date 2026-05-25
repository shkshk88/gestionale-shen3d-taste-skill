import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import documentsService, { BillingDocument, DocumentType } from '@/services/documents.service';
import type { UnbilledCase } from '@/services/billing.service';
import { ClientAvatar } from '@/components/common/ClientAvatar';
import { useToast } from '@/components/ui/use-toast';

const TYPE_OPTIONS: { value: DocumentType; label: string; hebrew: string }[] = [
  { value: 'invoice_order', label: 'Hashbonit Iska', hebrew: 'חשבונית עסקה' },
  { value: 'tax_invoice', label: 'Hashbonit Mas', hebrew: 'חשבונית מס' },
  { value: 'receipt_invoice', label: 'Mas + Kabala', hebrew: 'חשבונית מס/קבלה' },
  { value: 'receipt', label: 'Kabala', hebrew: 'קבלה' },
  { value: 'price_quote', label: 'Preventivo', hebrew: 'הצעת מחיר' },
  { value: 'credit_note', label: 'Zikui', hebrew: 'חשבונית זיכוי' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  clientLogo: string | null;
  cases: UnbilledCase[];
  defaultType: DocumentType;
  onCreated: (doc: BillingDocument) => void;
}

export default function CreateDocumentModal({
  open, onClose, clientId, clientName, clientLogo, cases, defaultType, onCreated,
}: Props) {
  const { toast } = useToast();
  const [docType, setDocType] = useState<DocumentType>(defaultType);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [taxRate, setTaxRate] = useState(18);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setDocType(defaultType);
      setSelectedIds(cases.map((c) => c.id));
      setSubject('');
      setNotes('');
      setDueDate('');
      setTaxRate(18);
    }
  }, [open, defaultType, cases]);

  const selectedCases = cases.filter((c) => selectedIds.includes(c.id));
  const subtotal = selectedCases.reduce((s, c) => s + c.totalPrice, 0);

  const toggleCase = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      toast({ variant: 'destructive', title: 'Seleziona almeno un caso' });
      return;
    }
    setLoading(true);
    try {
      const doc = await documentsService.createFromCases({
        clientId,
        caseIds: selectedIds,
        type: docType,
        taxRate,
        subject: subject || undefined,
        notes: notes || undefined,
        dueDate: dueDate || undefined,
      });
      onCreated(doc);
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Errore creazione',
        description: e?.response?.data?.message || e.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const typeLabel = TYPE_OPTIONS.find((t) => t.value === docType)?.label ?? docType;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-neutral-100 shrink-0">
          <ClientAvatar studioName={clientName} logoUrl={clientLogo} size={36} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-neutral-400 uppercase tracking-wide">Nuovo documento per</p>
            <p className="text-sm font-semibold text-neutral-800 truncate">{clientName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400"
          >
            <X size={15} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* Tipo documento */}
          <div>
            <label className="text-xs font-medium text-neutral-600 mb-1 block">
              Tipo documento
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocumentType)}
              className="input-modern w-full text-sm h-9 cursor-pointer"
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label} — {t.hebrew}
                </option>
              ))}
            </select>
          </div>

          {/* Casi inclusi */}
          <div>
            <p className="text-xs font-medium text-neutral-600 mb-2">
              Casi inclusi ({selectedIds.length} / {cases.length})
            </p>
            <div className="rounded-xl border border-neutral-100 overflow-hidden divide-y divide-neutral-100 max-h-44 overflow-y-auto">
              {cases.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-neutral-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(c.id)}
                    onChange={() => toggleCase(c.id)}
                    className="w-4 h-4 accent-brand-primary shrink-0"
                  />
                  <span className="font-mono text-xs text-brand-primary">{c.caseNumber}</span>
                  {c.patientName && (
                    <span className="text-xs text-neutral-500 truncate flex-1">— {c.patientName}</span>
                  )}
                  <span className="text-xs font-semibold text-neutral-700 shrink-0 ml-auto">
                    ₪{c.totalPrice.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Oggetto */}
          <div>
            <label className="text-xs font-medium text-neutral-600 mb-1 block">
              Oggetto{' '}
              <span className="text-neutral-400 font-normal">(opzionale — auto se vuoto)</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Generato automaticamente dai casi"
              className="input-modern w-full text-sm h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1 block">Note</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Riferimento pagamento…"
                className="input-modern w-full text-xs resize-none py-2"
              />
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1 block">Scadenza</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="input-modern w-full text-xs h-9"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1 block">IVA %</label>
                <input
                  type="number"
                  value={taxRate}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="input-modern w-full text-sm h-9"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-100 p-4 bg-neutral-50/60 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-neutral-500">
              {selectedIds.length} casi · IVA {taxRate}% inclusa
            </p>
            <p className="text-xl font-bold text-brand-primary">
              ₪{subtotal.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-600 hover:bg-neutral-100"
            >
              Annulla
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || selectedIds.length === 0}
              className="flex-[2] py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Crea bozza {typeLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
