import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2 } from 'lucide-react';
import documentsService, { BillingDocument, DocumentType } from '@/services/documents.service';
import type { UnbilledCase } from '@/services/billing.service';
import { ClientAvatar } from '@/components/common/ClientAvatar';
import { useToast } from '@/components/ui/use-toast';

const DOC_TYPES: DocumentType[] = [
  'invoice_order',
  'tax_invoice',
  'receipt_invoice',
  'receipt',
  'price_quote',
  'credit_note',
];

const HEBREW_LABELS: Record<DocumentType, string> = {
  invoice_order: 'חשבונית עסקה',
  tax_invoice: 'חשבונית מס',
  receipt_invoice: 'חשבונית מס/קבלה',
  receipt: 'קבלה',
  price_quote: 'הצעת מחיר',
  credit_note: 'חשבונית זיכוי',
};

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
  const { t } = useTranslation();
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
      toast({ variant: 'destructive', title: t('billing.toast.select_at_least_one') });
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
        title: t('billing.toast.load_error'),
        description: e?.response?.data?.message || e.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const typeLabel = t(`billing.tabs.${docType}`);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-xl shadow-xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-stone-100 shrink-0">
          <ClientAvatar studioName={clientName} logoUrl={clientLogo} size={36} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-stone-400 uppercase tracking-wide">{t('billing.create_modal.title')}</p>
            <p className="text-sm font-semibold text-stone-800 truncate">{clientName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400"
          >
            <X size={15} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* Tipo documento */}
          <div>
            <label className="text-xs font-medium text-stone-600 mb-1.5 block">
              {t('billing.create_modal.type_label')}
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocumentType)}
              className="input-modern w-full text-base h-12 px-3 cursor-pointer font-medium"
            >
              {DOC_TYPES.map((dt) => (
                <option key={dt} value={dt}>
                  {t(`billing.tabs.${dt}`)} — {HEBREW_LABELS[dt]}
                </option>
              ))}
            </select>
          </div>

          {/* Casi inclusi */}
          <div>
            <p className="text-xs font-medium text-stone-600 mb-2">
              {t('billing.create_modal.include_cases')} ({selectedIds.length} / {cases.length})
            </p>
            <div className="rounded-xl border border-stone-100 overflow-hidden divide-y divide-neutral-100 max-h-44 overflow-y-auto">
              {cases.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-stone-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(c.id)}
                    onChange={() => toggleCase(c.id)}
                    className="w-4 h-4 accent-sky-600 shrink-0"
                  />
                  <span className="font-mono text-xs text-amber-800">{c.caseNumber}</span>
                  {c.patientName && (
                    <span className="text-xs text-stone-500 truncate flex-1">— {c.patientName}</span>
                  )}
                  <span className="text-xs font-semibold text-stone-700 shrink-0 ml-auto">
                    ₪{c.totalPrice.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Oggetto */}
          <div>
            <label className="text-xs font-medium text-stone-600 mb-1 block">
              {t('billing.create_modal.subject_label')}
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('billing.create_modal.subject_placeholder')}
              className="input-modern w-full text-sm h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-stone-600 mb-1 block">{t('common.notes', { defaultValue: 'Note' })}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="input-modern w-full text-xs resize-none py-2"
              />
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1 block">{t('cases.dueDate')}</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="input-modern w-full text-xs h-9"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1 block">IVA %</label>
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
        <div className="border-t border-stone-100 p-4 bg-stone-50/60 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-stone-500">
              {t('billing.create_modal.selected_summary', {
                count: selectedIds.length,
                total: cases.length,
                amount: subtotal.toLocaleString('it-IT', { maximumFractionDigits: 0 }),
              })}
            </p>
            <p className="text-xl font-bold text-amber-800">
              ₪{subtotal.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-600 hover:bg-stone-100"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || selectedIds.length === 0}
              className="flex-[2] py-2.5 rounded-xl bg-amber-800 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? t('billing.create_modal.creating') : t('billing.create_modal.create_draft', { type: typeLabel })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
