import { useState, useEffect } from 'react';
import { X, Loader2, Banknote, CreditCard, FileCheck, Building } from 'lucide-react';
import type { PaymentItem, PaymentMethod, BillingDocument } from '@/services/documents.service';
import { useToast } from '@/components/ui/use-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  doc: BillingDocument | null;
  onConfirm: (payments: PaymentItem[]) => Promise<void>;
}

const METHODS: {
  type: PaymentMethod;
  label: string;
  icon: typeof Banknote;
  color: string;
  bg: string;
}[] = [
  { type: 4, label: 'Contanti', icon: Banknote, color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  { type: 3, label: 'Bonifico', icon: Building, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  { type: 2, label: 'Assegno', icon: FileCheck, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  { type: 1, label: 'Carta', icon: CreditCard, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
];

export default function PaymentMethodModal({ open, onClose, doc, onConfirm }: Props) {
  const { toast } = useToast();
  const [method, setMethod] = useState<PaymentMethod>(4);
  const [loading, setLoading] = useState(false);

  // Method-specific fields
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [paymentNumber, setPaymentNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [numberOfPayments, setNumberOfPayments] = useState(1);

  useEffect(() => {
    if (open) {
      setMethod(4);
      setAccountNumber('');
      setBankName('');
      setBranchName('');
      setPaymentNumber('');
      setExpirationDate('');
      setNumberOfPayments(1);
    }
  }, [open]);

  if (!open || !doc) return null;

  const totalAmount = Number(doc.total);
  const today = new Date().toISOString().split('T')[0];

  const handleConfirm = async () => {
    // Validations
    if (method === 2 && !paymentNumber.trim()) {
      toast({ variant: 'destructive', title: 'Inserisci il numero dell\'assegno' });
      return;
    }
    if ((method === 2 || method === 3) && !bankName.trim()) {
      toast({ variant: 'destructive', title: 'Inserisci il nome della banca' });
      return;
    }
    if (method === 1 && !paymentNumber.trim()) {
      toast({ variant: 'destructive', title: 'Inserisci le ultime 4 cifre della carta' });
      return;
    }

    const payment: PaymentItem = {
      paymentType: method,
      amount: totalAmount,
      date: today,
    };
    if (method === 2) {
      payment.paymentNumber = paymentNumber;
      payment.bankName = bankName;
      payment.branchName = branchName;
      payment.accountNumber = accountNumber;
    }
    if (method === 3) {
      payment.bankName = bankName;
      payment.branchName = branchName;
      payment.accountNumber = accountNumber;
    }
    if (method === 1) {
      payment.paymentNumber = paymentNumber;
      payment.expirationDate = expirationDate;
      payment.numberOfPayments = numberOfPayments;
    }

    setLoading(true);
    try {
      await onConfirm([payment]);
      onClose();
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Errore emissione',
        description: e?.response?.data?.message || e.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col"
        style={{ maxHeight: '92vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-neutral-100 shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-neutral-500 uppercase tracking-wide font-semibold">
              Metodo di pagamento
            </p>
            <p className="text-sm font-semibold text-neutral-800 truncate">
              Emetti{' '}
              <span className="text-brand-primary">
                ₪{totalAmount.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
              </span>
              {doc.client?.studioName ? ` · ${doc.client.studioName}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto">
          <p className="text-xs text-neutral-600">
            Come ha pagato il cliente? Invoice4u richiede questa informazione per emettere il
            documento.
          </p>

          {/* Method picker */}
          <div className="grid grid-cols-2 gap-2">
            {METHODS.map((m) => {
              const Icon = m.icon;
              const isActive = method === m.type;
              return (
                <button
                  key={m.type}
                  onClick={() => setMethod(m.type)}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    isActive
                      ? `${m.bg} border-current shadow-sm`
                      : 'bg-white border-neutral-100 hover:border-neutral-200'
                  }`}
                >
                  <Icon size={18} className={isActive ? m.color : 'text-neutral-400'} />
                  <p
                    className={`text-sm font-semibold mt-1 ${
                      isActive ? m.color : 'text-neutral-700'
                    }`}
                  >
                    {m.label}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Method-specific fields */}
          {method === 2 && (
            <div className="space-y-2 p-3 bg-amber-50/40 rounded-xl border border-amber-100">
              <input
                type="text"
                placeholder="Numero assegno *"
                value={paymentNumber}
                onChange={(e) => setPaymentNumber(e.target.value)}
                className="input-modern w-full text-sm h-10 px-3"
              />
              <input
                type="text"
                placeholder="Banca *"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="input-modern w-full text-sm h-10 px-3"
              />
              <input
                type="text"
                placeholder="Filiale"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="input-modern w-full text-sm h-10 px-3"
              />
              <input
                type="text"
                placeholder="Numero conto"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="input-modern w-full text-sm h-10 px-3"
              />
            </div>
          )}

          {method === 3 && (
            <div className="space-y-2 p-3 bg-blue-50/40 rounded-xl border border-blue-100">
              <input
                type="text"
                placeholder="Banca *"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="input-modern w-full text-sm h-10 px-3"
              />
              <input
                type="text"
                placeholder="Filiale"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="input-modern w-full text-sm h-10 px-3"
              />
              <input
                type="text"
                placeholder="Numero conto"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="input-modern w-full text-sm h-10 px-3"
              />
            </div>
          )}

          {method === 1 && (
            <div className="space-y-2 p-3 bg-purple-50/40 rounded-xl border border-purple-100">
              <input
                type="text"
                placeholder="Ultime 4 cifre carta *"
                value={paymentNumber}
                onChange={(e) => setPaymentNumber(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="input-modern w-full text-sm h-10 px-3"
              />
              <input
                type="text"
                placeholder="Scadenza MM/YY"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="input-modern w-full text-sm h-10 px-3"
              />
              <input
                type="number"
                min={1}
                max={36}
                placeholder="Numero rate"
                value={numberOfPayments}
                onChange={(e) => setNumberOfPayments(parseInt(e.target.value) || 1)}
                className="input-modern w-full text-sm h-10 px-3"
              />
            </div>
          )}

          {method === 4 && (
            <p className="text-xs text-green-700 px-3 py-2 bg-green-50/40 rounded-xl border border-green-100">
              Pagamento in contanti — nessun dato aggiuntivo richiesto.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-100 p-4 bg-neutral-50/60 shrink-0 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-600 hover:bg-neutral-100"
          >
            Annulla
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-[2] py-2.5 rounded-xl bg-brand-primary hover:opacity-90 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            Conferma ed Emetti
          </button>
        </div>
      </div>
    </div>
  );
}
