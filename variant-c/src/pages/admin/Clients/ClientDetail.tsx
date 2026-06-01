import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
 ArrowLeft,
 Edit,
 Phone,
 Mail,
 MapPin,
 Calendar,
 Package,
 Clock,
 Plus,
 ChevronRight,
 MoreHorizontal,
 FileText,
 TrendingUp,
 Euro,
} from 'lucide-react';
import clientService from '../../../services/client.service';
import caseService from '../../../services/case.service';
import { useToast } from '../../../components/ui/use-toast';
import { ClientAvatar } from '@/components/common/ClientAvatar';
import { getDateLocale } from '@/utils/locale';

export default function ClientDetail() {
 const { t } = useTranslation();
 const { id } = useParams();
 const navigate = useNavigate();
 const { toast } = useToast();
 const [activeTab, setActiveTab] = useState<'cases' | 'invoices' | 'notes'>('cases');
 const [loading, setLoading] = useState(true);
 const [client, setClient] = useState<any>(null);
 const [cases, setCases] = useState<any[]>([]);
 const [stats, setStats] = useState({
 totalCases: 0,
 activeCases: 0,
 completedCases: 0,
 totalRevenue: 0,
 avgCaseValue: 0,
 });

 // Load client data
 useEffect(() => {
 const loadClientData = async () => {
 if (!id) {
 navigate('/admin/clients');
 return;
 }

 try {
 setLoading(true);

 // Load client info
 const clientData = await clientService.getClientById(id);
 setClient(clientData);

 // Load client cases
 const casesData = await caseService.getCases({ clientId: id });
 setCases(casesData);

 // Calculate stats
 const totalCases = casesData.length;
 const activeCases = casesData.filter((c: any) =>
 c.status !== 'delivered' && c.status !== 'shipped'
 ).length;
 const completedCases = casesData.filter((c: any) =>
 c.status === 'delivered'
 ).length;
 const totalRevenue = casesData.reduce((sum: number, c: any) =>
 sum + (c.totalPrice || 0), 0
 );
 const avgCaseValue = totalCases > 0 ? Math.round(totalRevenue / totalCases) : 0;

 setStats({
 totalCases,
 activeCases,
 completedCases,
 totalRevenue,
 avgCaseValue,
 });

 } catch (error: any) {
 console.error('Error loading client:', error);
 toast({
 title: t('common.error'),
 description: t('clients.errorLoadingClient'),
 variant: 'destructive',
 });
 navigate('/admin/clients');
 } finally {
 setLoading(false);
 }
 };

 loadClientData();
 }, [id, navigate, toast]);

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-[400px]">
 <div className="text-center">
 <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
 <p className="text-gray-500">{t('clients.loadingClient')}</p>
 </div>
 </div>
 );
 }

 if (!client) {
 return null;
 }

 const getStatusBadge = (status: string) => {
 switch (status) {
 case 'received':
 return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium border bg-gray-100 text-gray-600 border-gray-200">{t('cases.statuses.received')}</span>;
 case 'in_progress':
 return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium border bg-gray-50 text-sky-700 border-sky-200">{t('cases.statuses.in_progress')}</span>;
 case 'qc':
 return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium border bg-violet-50 text-violet-700 border-violet-200">{t('cases.statuses.qc')}</span>;
 case 'shipped':
 return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium border bg-gray-50 text-amber-700 border-amber-200">{t('cases.statuses.shipped')}</span>;
 case 'delivered':
 return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium border bg-gray-50 text-emerald-700 border-emerald-200">{t('cases.statuses.delivered')}</span>;
 default:
 return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium border bg-gray-100 text-gray-600 border-gray-200">{status}</span>;
 }
 };

 // Get avatar color based on client index/id
 const getAvatarColor = () => {
 const colors = ['bg-blue-500', 'bg-blue-500', 'bg-gray-800', 'bg-gray-500', 'bg-blue-600'];
 const hash = client.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
 return colors[hash % colors.length];
 };

 // Format address
 const formatAddress = () => {
 const parts = [];
 if (client.address) parts.push(client.address);
 if (client.city) {
 const cityPart = client.postalCode ? `${client.postalCode} ${client.city}` : client.city;
 parts.push(cityPart);
 }
 if (client.country) parts.push(client.country);
 return parts.join(', ') || t('common.noData');
 };

 return (
 <div className="space-y-6 animate-fade-in">
 {/* Header */}
 <div className="flex items-center justify-between gap-2">
 <div className="flex items-center gap-3 md:gap-4 min-w-0">
 <Link
 to="/admin/clients"
 className="w-10 h-10 bg-white border border-gray-100 flex items-center justify-center text-gray-500 hover:text-blue-600 hover: transition-all shrink-0"
 >
 <ArrowLeft size={20} />
 </Link>
 <div className="flex items-center gap-3 md:gap-4 min-w-0">
 <ClientAvatar
 studioName={client.studioName}
 logoUrl={client.logoUrl}
 size={56}
 rounded=""
 fallbackBg={getAvatarColor()}
 />
 <div className="min-w-0">
 <h1 className="text-xl md:text-2xl font-bold text-gray-800 truncate">{client.studioName}</h1>
 <p className="text-gray-500 text-sm truncate hidden sm:block">{client.contactPerson}</p>
 </div>
 </div>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <Link
 to={`/admin/cases/new?clientId=${id}`}
 className="inline-flex items-center gap-2 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700"
 >
 <Plus size={18} />
 <span className="hidden md:inline">{t('portal.newCase')}</span>
 </Link>
 <Link
 to={`/admin/clients/${id}/edit`}
 className="inline-flex items-center gap-2 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 transition hover:bg-gray-50"
 >
 <Edit size={18} />
 <span className="hidden md:inline">{t('common.edit')}</span>
 </Link>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Main Content */}
 <div className="lg:col-span-2 space-y-6">
 {/* Stats Cards */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
 <div className=" bg-white p-4 border border-gray-100">
 <div className="flex items-center gap-2 mb-2">
 <div className="w-8 h-8 bg-gray-50 flex items-center justify-center">
 <Package size={16} className="text-blue-600" />
 </div>
 <span className="text-xs text-gray-500">{t('clients.totalCases')}</span>
 </div>
 <p className="text-2xl font-bold text-gray-800">{stats.totalCases}</p>
 </div>
 <div className=" bg-white p-4 border border-gray-100">
 <div className="flex items-center gap-2 mb-2">
 <div className="w-8 h-8 bg-gray-50 flex items-center justify-center">
 <Clock size={16} className="text-orange-500" />
 </div>
 <span className="text-xs text-gray-500">{t('clients.active')}</span>
 </div>
 <p className="text-2xl font-bold text-orange-500">{stats.activeCases}</p>
 </div>
 <div className=" bg-white p-4 border border-gray-100">
 <div className="flex items-center gap-2 mb-2">
 <div className="w-8 h-8 bg-gray-50 flex items-center justify-center">
 <Euro size={16} className="text-emerald-600" />
 </div>
 <span className="text-xs text-gray-500">{t('clients.invoiced')}</span>
 </div>
 <p className="text-2xl font-bold text-gray-800">₪{stats.totalRevenue.toLocaleString('he-IL')}</p>
 </div>
 <div className=" bg-white p-4 border border-gray-100">
 <div className="flex items-center gap-2 mb-2">
 <div className="w-8 h-8 bg-gray-50 flex items-center justify-center">
 <TrendingUp size={16} className="text-blue-500" />
 </div>
 <span className="text-xs text-gray-500">Media caso</span>
 </div>
 <p className="text-2xl font-bold text-blue-500">₪{stats.avgCaseValue}</p>
 </div>
 </div>

 {/* Tabs */}
 <div className=" bg-white border border-gray-100 overflow-hidden">
 <div className="flex border-b border-gray-100 overflow-x-auto no-scrollbar">
 {[
 { id: 'cases', label: t('clients.recentCases'), count: stats.totalCases },
 { id: 'invoices', label: t('invoices.title'), count: 12 },
 { id: 'notes', label: t('clients.notesTab') },
 ].map((tab) => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id as typeof activeTab)}
 className={`flex items-center gap-2 px-3 py-3 md:px-6 md:py-4 text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
 activeTab === tab.id
 ? 'border-blue-600 text-blue-600'
 : 'border-transparent text-gray-500 hover:text-gray-700'
 }`}
 >
 {tab.label}
 {tab.count && (
 <span className={`px-2 py-0.5 text-xs hidden md:inline ${
 activeTab === tab.id
 ? 'bg-gray-50 text-blue-600'
 : 'bg-gray-100 text-gray-500'
 }`}>
 {tab.count}
 </span>
 )}
 </button>
 ))}
 </div>

 {/* Tab Content */}
 <div className="p-4 md:p-6">
 {activeTab === 'cases' && (
 <div className="space-y-3">
 {cases.length === 0 ? (
 <div className="text-center py-8">
 <p className="text-gray-500 mb-4">{t('common.noResults')}</p>
 <Link
 to={`/admin/cases/new?client=${id}`}
 className="inline-flex items-center gap-2 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700"
 >
 <Plus size={18} />
 Crea primo caso
 </Link>
 </div>
 ) : (
 <>
 {cases.slice(0, 5).map((case_) => (
 <Link
 key={case_.id}
 to={`/admin/cases/${case_.id}`}
 className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors group"
 >
 <div className="flex items-center gap-4 min-w-0">
 <div className="min-w-0">
 <div className="flex items-center gap-2 mb-1">
 <span className="font-medium text-gray-800 truncate">{case_.caseNumber}</span>
 {getStatusBadge(case_.status)}
 </div>
 <p className="text-sm text-gray-500 truncate">
 {case_.patientName || 'N/A'} - {case_.teeth?.length || 0} {t('dental.tooth', { count: case_.teeth?.length || 0 })}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2 sm:gap-4 shrink-0">
 <div className="text-right">
 <p className="font-semibold text-gray-800">
 ₪{case_.totalPrice ? case_.totalPrice.toFixed(2) : '0.00'}
 </p>
 <p className="text-xs text-gray-400">
 Consegna: {new Date(case_.dueDate).toLocaleDateString(getDateLocale())}
 </p>
 </div>
 <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-600 transition-colors shrink-0" />
 </div>
 </Link>
 ))}

 {cases.length > 5 && (
 <Link
 to={`/admin/cases?client=${id}`}
 className="block text-center py-3 text-sm font-medium text-blue-600 hover:underline"
 >
 Vedi tutti i {cases.length} casi
 </Link>
 )}
 </>
 )}
 </div>
 )}

 {activeTab === 'invoices' && (
 <div className="space-y-3">
 {[
 { id: 'FT-2025-012', date: '2025-01-15', amount: 1250, status: 'paid' },
 { id: 'FT-2025-008', date: '2024-12-20', amount: 890, status: 'paid' },
 { id: 'FT-2024-156', date: '2024-11-28', amount: 1540, status: 'paid' },
 ].map((invoice) => (
 <div
 key={invoice.id}
 className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 "
 >
 <div className="flex items-center gap-4 min-w-0">
 <div className="w-10 h-10 bg-gray-50 flex items-center justify-center shrink-0">
 <FileText size={20} className="text-blue-600" />
 </div>
 <div className="min-w-0">
 <p className="font-medium text-gray-800 truncate">{invoice.id}</p>
 <p className="text-sm text-gray-500">
 {new Date(invoice.date).toLocaleDateString(getDateLocale())}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2 sm:gap-4 shrink-0">
 <div className="text-right">
 <p className="font-semibold text-gray-800">₪{invoice.amount}</p>
 <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium border bg-gray-50 text-emerald-700 border-emerald-200">
 Pagata
 </span>
 </div>
 <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
 <MoreHorizontal size={16} />
 </button>
 </div>
 </div>
 ))}
 </div>
 )}

 {activeTab === 'notes' && (
 <div className="space-y-4">
 {client.notes ? (
 <div className="p-4 bg-gray-50 ">
 <p className="text-gray-700">{client.notes}</p>
 <p className="text-xs text-gray-400 mt-2">
 Ultima modifica: {new Date(client.updatedAt).toLocaleDateString(getDateLocale())}
 </p>
 </div>
 ) : (
 <div className="p-4 bg-gray-50 text-center">
 <p className="text-gray-500">Nessuna nota presente</p>
 </div>
 )}
 <textarea
 placeholder={t('clients.notesPlaceholder')}
 className="w-full border border-gray-200 bg-white py-2.5 px-4 text-sm text-gray-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 resize-none"
 rows={3}
 />
 <button className="inline-flex items-center gap-2 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700">
 {t('common.save')}
 </button>
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Sidebar */}
 <div className="space-y-6">
 {/* Contact Info */}
 <div className=" bg-white p-4 md:p-6 border border-gray-100">
 <h3 className="text-lg font-semibold text-gray-800 mb-4">Contatti</h3>
 <div className="space-y-3">
 <a
 href={`tel:${client.phone}`}
 className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-50 transition-colors"
 >
 <div className="w-10 h-10 bg-gray-50 flex items-center justify-center">
 <Phone size={18} className="text-emerald-600" />
 </div>
 <div>
 <p className="text-xs text-gray-500">Telefono</p>
 <p className="text-sm font-medium text-gray-700">{client.phone}</p>
 </div>
 </a>
 <a
 href={`mailto:${client.email}`}
 className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-50 transition-colors"
 >
 <div className="w-10 h-10 bg-gray-50 flex items-center justify-center">
 <Mail size={18} className="text-blue-600" />
 </div>
 <div>
 <p className="text-xs text-gray-500">Email</p>
 <p className="text-sm font-medium text-gray-700">{client.email}</p>
 </div>
 </a>
 <div className="flex items-start gap-3 p-3 bg-gray-50 ">
 <div className="w-10 h-10 bg-gray-50 flex items-center justify-center">
 <MapPin size={18} className="text-blue-500" />
 </div>
 <div>
 <p className="text-xs text-gray-500">Indirizzo</p>
 <p className="text-sm font-medium text-gray-700">{formatAddress()}</p>
 </div>
 </div>
 </div>
 </div>

 {/* Business Info */}
 <div className=" bg-gray-800 p-4 md:p-6 text-white">
 <h3 className="font-semibold mb-4">Dati Commerciali</h3>
 <div className="space-y-3">
 {client.vatNumber && (
 <div>
 <p className="text-xs text-white/60">Partita IVA</p>
 <p className="text-sm font-medium">{client.vatNumber}</p>
 </div>
 )}
 {client.taxCode && (
 <div>
 <p className="text-xs text-white/60">Codice Fiscale</p>
 <p className="text-sm font-medium">{client.taxCode}</p>
 </div>
 )}
 <div>
 <p className="text-xs text-white/60">Listino applicato</p>
 <p className="text-sm font-medium">{client.priceList?.listName || 'Nessun listino'}</p>
 </div>
 <div>
 <p className="text-xs text-white/60">Cliente dal</p>
 <p className="text-sm font-medium flex items-center gap-1">
 <Calendar size={14} />
 {new Date(client.createdAt).toLocaleDateString(getDateLocale(), { month: 'long', year: 'numeric' })}
 </p>
 </div>
 </div>
 </div>

 {/* Quick Actions */}
 <div className=" bg-white p-4 md:p-6 border border-gray-100">
 <h3 className="text-lg font-semibold text-gray-800 mb-4">Azioni rapide</h3>
 <div className="space-y-2">
 <button className="w-full px-4 py-3 bg-gray-50 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between">
 Genera fattura
 <ChevronRight size={16} className="text-gray-400" />
 </button>
 <button className="w-full px-4 py-3 bg-gray-50 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between">
 Invia promemoria
 <ChevronRight size={16} className="text-gray-400" />
 </button>
 <button className="w-full px-4 py-3 bg-gray-50 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between">
 {t('common.edit')} {t('priceLists.title', { defaultValue: 'listino' }).toLowerCase()}
 <ChevronRight size={16} className="text-gray-400" />
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
