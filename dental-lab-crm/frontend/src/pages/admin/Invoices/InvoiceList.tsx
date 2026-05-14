import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Search,
  Filter,
  Download,
  Send,
  Eye,
  MoreHorizontal,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Euro,
  Calendar,
  Building2
} from 'lucide-react';

type InvoiceStatus = 'paid' | 'pending' | 'overdue' | 'draft';

interface Invoice {
  id: string;
  number: string;
  client: string;
  clientId: string;
  date: string;
  dueDate: string;
  amount: number;
  status: InvoiceStatus;
  items: number;
}

const statusConfig: Record<InvoiceStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  paid: { label: 'Pagata', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  pending: { label: 'In attesa', color: 'bg-amber-100 text-amber-700', icon: Clock },
  overdue: { label: 'Scaduta', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  draft: { label: 'Bozza', color: 'bg-neutral-100 text-neutral-600', icon: FileText },
};

export default function InvoiceList() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  const invoices: Invoice[] = [
    { id: '1', number: 'FT-2024-001', client: 'Clinica Dentale Rossi', clientId: '1', date: '2024-01-15', dueDate: '2024-02-15', amount: 2450, status: 'paid', items: 8 },
    { id: '2', number: 'FT-2024-002', client: 'Studio Dr. Verdi', clientId: '2', date: '2024-01-18', dueDate: '2024-02-18', amount: 1820, status: 'paid', items: 5 },
    { id: '3', number: 'FT-2024-003', client: 'Dental Care Center', clientId: '3', date: '2024-01-22', dueDate: '2024-02-22', amount: 3200, status: 'pending', items: 12 },
    { id: '4', number: 'FT-2024-004', client: 'Smile Center Ferrari', clientId: '4', date: '2024-01-25', dueDate: '2024-02-25', amount: 980, status: 'pending', items: 3 },
    { id: '5', number: 'FT-2024-005', client: 'Clinica Dentale Rossi', clientId: '1', date: '2024-01-28', dueDate: '2024-01-28', amount: 1650, status: 'overdue', items: 6 },
    { id: '6', number: 'FT-2024-006', client: 'Studio Bianchi', clientId: '5', date: '2024-01-30', dueDate: '2024-03-01', amount: 2100, status: 'draft', items: 7 },
  ];

  const stats = {
    total: invoices.reduce((acc, inv) => acc + inv.amount, 0),
    paid: invoices.filter(inv => inv.status === 'paid').reduce((acc, inv) => acc + inv.amount, 0),
    pending: invoices.filter(inv => inv.status === 'pending').reduce((acc, inv) => acc + inv.amount, 0),
    overdue: invoices.filter(inv => inv.status === 'overdue').reduce((acc, inv) => acc + inv.amount, 0),
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = !searchQuery ||
      inv.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleSelectAll = () => {
    if (selectedInvoices.length === filteredInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(filteredInvoices.map(inv => inv.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedInvoices(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Fatture</h1>
          <p className="text-sm text-neutral-500">Gestione fatturazione e pagamenti</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Nuova Fattura
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-base p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-500">Totale Fatturato</span>
            <Euro size={18} className="text-neutral-400" />
          </div>
          <p className="text-2xl font-bold text-neutral-800">€{stats.total.toLocaleString()}</p>
        </div>
        <div className="card-base p-5 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-500">Incassato</span>
            <CheckCircle size={18} className="text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600">€{stats.paid.toLocaleString()}</p>
        </div>
        <div className="card-base p-5 border-l-4 border-amber-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-500">In Attesa</span>
            <Clock size={18} className="text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600">€{stats.pending.toLocaleString()}</p>
        </div>
        <div className="card-base p-5 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-500">Scaduto</span>
            <AlertCircle size={18} className="text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600">€{stats.overdue.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
          <input
            type="text"
            placeholder="Cerca fattura o cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-modern pl-11 w-full"
          />
        </div>

        <div className="flex bg-surface-secondary rounded-xl p-1">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === 'all'
                ? 'bg-white text-neutral-800 shadow-soft'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Tutte
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === 'pending'
                ? 'bg-white text-neutral-800 shadow-soft'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            In attesa
          </button>
          <button
            onClick={() => setStatusFilter('overdue')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === 'overdue'
                ? 'bg-white text-neutral-800 shadow-soft'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Scadute
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === 'paid'
                ? 'bg-white text-neutral-800 shadow-soft'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Pagate
          </button>
        </div>

        {selectedInvoices.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">{selectedInvoices.length} selezionate</span>
            <button className="px-3 py-2 rounded-lg bg-brand-primary text-white text-sm hover:opacity-90 transition-all flex items-center gap-1">
              <Send size={14} />
              Invia
            </button>
            <button className="px-3 py-2 rounded-lg bg-neutral-100 text-neutral-700 text-sm hover:bg-neutral-200 transition-all flex items-center gap-1">
              <Download size={14} />
              Scarica
            </button>
          </div>
        )}
      </div>

      {/* Invoice Table */}
      <div className="card-base overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100 bg-surface-secondary/50">
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-neutral-300 text-brand-primary focus:ring-brand-primary"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">Numero</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">Cliente</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">Data</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">Scadenza</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">Importo</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">Stato</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-neutral-600">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice) => {
              const StatusIcon = statusConfig[invoice.status].icon;
              return (
                <tr
                  key={invoice.id}
                  className="border-b border-neutral-100 hover:bg-surface-secondary/30 transition-colors"
                >
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.includes(invoice.id)}
                      onChange={() => toggleSelect(invoice.id)}
                      className="w-4 h-4 rounded border-neutral-300 text-brand-primary focus:ring-brand-primary"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-card-navy/10 flex items-center justify-center">
                        <FileText size={16} className="text-card-navy" />
                      </div>
                      <span className="font-medium text-neutral-800">{invoice.number}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-neutral-400" />
                      <span className="text-neutral-700">{invoice.client}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Calendar size={14} className="text-neutral-400" />
                      {new Date(invoice.date).toLocaleDateString('it-IT')}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-sm ${invoice.status === 'overdue' ? 'text-red-600 font-medium' : 'text-neutral-600'}`}>
                      {new Date(invoice.dueDate).toLocaleDateString('it-IT')}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-semibold text-neutral-800">€{invoice.amount.toLocaleString()}</span>
                    <span className="text-xs text-neutral-400 ml-1">({invoice.items} voci)</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[invoice.status].color}`}>
                      <StatusIcon size={12} />
                      {statusConfig[invoice.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-all">
                        <Eye size={16} />
                      </button>
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-all">
                        <Download size={16} />
                      </button>
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-all">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredInvoices.length === 0 && (
          <div className="py-12 text-center">
            <FileText size={40} className="text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500">Nessuna fattura trovata</p>
          </div>
        )}
      </div>

      {/* Quick Actions Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card-yellow/10 border border-card-yellow/20 rounded-2xl p-5">
          <h3 className="font-semibold text-neutral-800 mb-3">Azioni Rapide</h3>
          <div className="space-y-2">
            <button className="w-full px-4 py-3 bg-white rounded-xl text-left hover:shadow-soft transition-all flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-card-yellow/20 flex items-center justify-center">
                <FileText size={16} className="text-card-yellow-dark" />
              </div>
              <span className="text-sm font-medium text-neutral-700">Genera fattura da casi completati</span>
            </button>
            <button className="w-full px-4 py-3 bg-white rounded-xl text-left hover:shadow-soft transition-all flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-card-teal/20 flex items-center justify-center">
                <Send size={16} className="text-card-teal" />
              </div>
              <span className="text-sm font-medium text-neutral-700">Invia sollecito fatture scadute</span>
            </button>
          </div>
        </div>

        <div className="bg-card-navy/5 border border-card-navy/10 rounded-2xl p-5">
          <h3 className="font-semibold text-neutral-800 mb-3">Riepilogo Mensile</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600">Fatture emesse</span>
              <span className="font-medium text-neutral-800">{invoices.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600">Tasso incasso</span>
              <span className="font-medium text-green-600">
                {((stats.paid / stats.total) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600">Media fattura</span>
              <span className="font-medium text-neutral-800">
                €{Math.round(stats.total / invoices.length).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
