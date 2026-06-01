import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getDateLocale } from '@/utils/locale';
import {
 Plus,
 Search,
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

export default function InvoiceList() {
 const { t } = useTranslation();
 const [searchQuery, setSearchQuery] = useState('');
 const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
 const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

 const statusConfig: Record<InvoiceStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
 paid: { label: t('invoices.statusPaid'), color: 'bg-gray-50 text-teal-700', icon: CheckCircle },
 pending: { label: t('invoices.statusPending'), color: 'bg-gray-50 text-amber-700', icon: Clock },
 overdue: { label: t('invoices.statusOverdue'), color: 'bg-red-50 text-red-700', icon: AlertCircle },
 draft: { label: t('invoices.statusDraft'), color: 'bg-gray-100 text-gray-600', icon: FileText },
 };

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
 {/* WIP banner — pagina mock, nascosta dalla sidebar (B-03 audit) */}
 <div className=" border border-amber-300 bg-gray-50 px-5 py-4 text-sm text-amber-900">
 <strong>{t('invoices.wipBannerTitle')}</strong>{' '}{t('invoices.wipBannerDesc')}
 </div>
 {/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl font-bold text-gray-800">{t('invoices.title')}</h1>
 <p className="text-sm text-gray-500">{t('invoices.subtitle')}</p>
 </div>
 <button className="btn-primary flex items-center gap-2">
 <Plus size={18} />
 {t('invoices.newInvoice')}
 </button>
 </div>

 {/* Stats */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 <div className="card-base p-5">
 <div className="flex items-center justify-between mb-2">
 <span className="text-sm text-gray-500">{t('invoices.totalInvoiced')}</span>
 <div className="w-8 h-8 bg-gray-800/10 flex items-center justify-center">
 <Euro size={18} className="text-gray-800" />
 </div>
 </div>
 <p className="text-2xl font-bold text-gray-800">₪{stats.total.toLocaleString('he-IL')}</p>
 </div>
 <div className="card-base p-5">
 <div className="flex items-center justify-between mb-2">
 <span className="text-sm text-gray-500">{t('invoices.collected')}</span>
 <div className="w-8 h-8 bg-blue-500/10 flex items-center justify-center">
 <CheckCircle size={18} className="text-blue-500" />
 </div>
 </div>
 <p className="text-2xl font-bold text-blue-600">₪{stats.paid.toLocaleString('he-IL')}</p>
 </div>
 <div className="card-base p-5">
 <div className="flex items-center justify-between mb-2">
 <span className="text-sm text-gray-500">{t('invoices.pending')}</span>
 <div className="w-8 h-8 bg-orange-500/10 flex items-center justify-center">
 <Clock size={18} className="text-orange-500" />
 </div>
 </div>
 <p className="text-2xl font-bold text-amber-600">₪{stats.pending.toLocaleString('he-IL')}</p>
 </div>
 <div className="card-base p-5">
 <div className="flex items-center justify-between mb-2">
 <span className="text-sm text-gray-500">{t('invoices.overdue')}</span>
 <div className="w-8 h-8 bg-red-500/10 flex items-center justify-center">
 <AlertCircle size={18} className="text-red-500" />
 </div>
 </div>
 <p className="text-2xl font-bold text-red-600">₪{stats.overdue.toLocaleString('he-IL')}</p>
 </div>
 </div>

 {/* Filters */}
 <div className="flex flex-col sm:flex-row gap-4">
 <div className="relative flex-1 max-w-md">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
 <input
 type="text"
 placeholder={t('invoices.searchPlaceholder')}
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="input-modern pl-11 w-full"
 />
 </div>

 <div className="flex bg-gray-50 p-1">
 <button
 onClick={() => setStatusFilter('all')}
 className={`px-4 py-2 text-sm font-medium transition-all ${
 statusFilter === 'all'
 ? 'bg-white text-gray-800 '
 : 'text-gray-500 hover:text-gray-700'
 }`}
 >
 {t('invoices.filterAll')}
 </button>
 <button
 onClick={() => setStatusFilter('pending')}
 className={`px-4 py-2 text-sm font-medium transition-all ${
 statusFilter === 'pending'
 ? 'bg-white text-gray-800 '
 : 'text-gray-500 hover:text-gray-700'
 }`}
 >
 {t('invoices.filterPending')}
 </button>
 <button
 onClick={() => setStatusFilter('overdue')}
 className={`px-4 py-2 text-sm font-medium transition-all ${
 statusFilter === 'overdue'
 ? 'bg-white text-gray-800 '
 : 'text-gray-500 hover:text-gray-700'
 }`}
 >
 {t('invoices.filterOverdue')}
 </button>
 <button
 onClick={() => setStatusFilter('paid')}
 className={`px-4 py-2 text-sm font-medium transition-all ${
 statusFilter === 'paid'
 ? 'bg-white text-gray-800 '
 : 'text-gray-500 hover:text-gray-700'
 }`}
 >
 {t('invoices.filterPaid')}
 </button>
 </div>

 {selectedInvoices.length > 0 && (
 <div className="flex items-center gap-2">
 <span className="text-sm text-gray-500">{t('invoices.selected', { count: selectedInvoices.length })}</span>
 <button className="px-3 py-2 bg-blue-600 text-white text-sm hover:bg-sky-700 transition-all flex items-center gap-1">
 <Send size={14} />
 {t('invoices.send')}
 </button>
 <button className="px-3 py-2 bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition-all flex items-center gap-1">
 <Download size={14} />
 {t('invoices.download')}
 </button>
 </div>
 )}
 </div>

 {/* Invoice Table */}
 <div className="card-base overflow-hidden">
 <table className="w-full">
 <thead>
 <tr className="border-b border-gray-100 bg-gray-50/50">
 <th className="px-4 py-3 text-left">
 <input
 type="checkbox"
 checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
 onChange={toggleSelectAll}
 className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
 />
 </th>
 <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">{t('invoices.columnNumber')}</th>
 <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">{t('invoices.columnClient')}</th>
 <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">{t('invoices.columnDate')}</th>
 <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">{t('invoices.columnDueDate')}</th>
 <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">{t('invoices.columnAmount')}</th>
 <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">{t('invoices.columnStatus')}</th>
 <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">{t('invoices.columnActions')}</th>
 </tr>
 </thead>
 <tbody>
 {filteredInvoices.map((invoice) => {
 const StatusIcon = statusConfig[invoice.status].icon;
 return (
 <tr
 key={invoice.id}
 className="border-b border-gray-100 hover:bg-gray-50/30 transition-colors"
 >
 <td className="px-4 py-4">
 <input
 type="checkbox"
 checked={selectedInvoices.includes(invoice.id)}
 onChange={() => toggleSelect(invoice.id)}
 className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
 />
 </td>
 <td className="px-4 py-4">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 bg-gray-800/10 flex items-center justify-center">
 <FileText size={16} className="text-gray-800" />
 </div>
 <span className="font-medium text-gray-800">{invoice.number}</span>
 </div>
 </td>
 <td className="px-4 py-4">
 <div className="flex items-center gap-2">
 <Building2 size={14} className="text-gray-400" />
 <span className="text-gray-700">{invoice.client}</span>
 </div>
 </td>
 <td className="px-4 py-4">
 <div className="flex items-center gap-2 text-sm text-gray-600">
 <Calendar size={14} className="text-gray-400" />
 {new Date(invoice.date).toLocaleDateString(getDateLocale())}
 </div>
 </td>
 <td className="px-4 py-4">
 <span className={`text-sm ${invoice.status === 'overdue' ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
 {new Date(invoice.dueDate).toLocaleDateString(getDateLocale())}
 </span>
 </td>
 <td className="px-4 py-4">
 <span className="font-semibold text-gray-800">₪{invoice.amount.toLocaleString('he-IL')}</span>
 <span className="text-xs text-gray-400 ml-1">({invoice.items} {t('invoices.itemsLabel')})</span>
 </td>
 <td className="px-4 py-4">
 <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium ${statusConfig[invoice.status].color}`}>
 <StatusIcon size={12} />
 {statusConfig[invoice.status].label}
 </span>
 </td>
 <td className="px-4 py-4 text-right">
 <div className="flex items-center justify-end gap-1">
 <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
 <Eye size={16} />
 </button>
 <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
 <Download size={16} />
 </button>
 <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
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
 <FileText size={40} className="text-gray-300 mx-auto mb-3" />
 <p className="text-gray-500">{t('invoices.noInvoices')}</p>
 </div>
 )}
 </div>

 {/* Quick Actions Card */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="card-base p-5 bg-gray-50/50 border-sky-100">
 <h3 className="font-semibold text-gray-800 mb-3">{t('invoices.quickActions')}</h3>
 <div className="space-y-2">
 <button className="w-full px-4 py-3 bg-white text-left hover: transition-all flex items-center gap-3">
 <div className="w-8 h-8 bg-sky-100 flex items-center justify-center">
 <FileText size={16} className="text-blue-600" />
 </div>
 <span className="text-sm font-medium text-gray-700">{t('invoices.generateFromCompleted')}</span>
 </button>
 <button className="w-full px-4 py-3 bg-white text-left hover: transition-all flex items-center gap-3">
 <div className="w-8 h-8 bg-teal-100 flex items-center justify-center">
 <Send size={16} className="text-blue-600" />
 </div>
 <span className="text-sm font-medium text-gray-700">{t('invoices.sendOverdueReminder')}</span>
 </button>
 </div>
 </div>

 <div className="card-base p-5 bg-gray-50/50 border-gray-100">
 <h3 className="font-semibold text-gray-800 mb-3">{t('invoices.monthlySummary')}</h3>
 <div className="space-y-3">
 <div className="flex justify-between items-center">
 <span className="text-sm text-gray-600">{t('invoices.monthCount')}</span>
 <span className="font-medium text-gray-800">{invoices.length}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-sm text-gray-600">{t('invoices.collectionRate')}</span>
 <span className="font-medium text-blue-600">
 {((stats.paid / stats.total) * 100).toFixed(0)}%
 </span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-sm text-gray-600">{t('invoices.avgInvoice')}</span>
 <span className="font-medium text-gray-800">
 ₪{Math.round(stats.total / invoices.length).toLocaleString('he-IL')}
 </span>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
