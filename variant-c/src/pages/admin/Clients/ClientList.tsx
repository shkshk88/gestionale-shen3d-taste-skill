import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Phone, MapPin, Package, MoreHorizontal, ChevronRight, Loader2, Settings, LayoutGrid, List, Mail } from 'lucide-react';
import { ClientAvatar } from '@/components/common/ClientAvatar';
import { Link, useNavigate } from 'react-router-dom';
import clientService from '../../../services/client.service';
import { useToast } from '../../../components/ui/use-toast';
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';

type ClientStatus = 'active' | 'inactive' | 'blocked';
type ClientPriority = 'high' | 'normal' | 'low';

interface ClientWithMeta {
 id: string;
 studioName: string;
 contactPerson: string;
 phone: string;
 email: string;
 city: string;
 totalCases: number;
 activeCases: number;
 avatarColor: string;
 logoUrl: string | null;
 status: ClientStatus;
 priority: ClientPriority;
}

export default function ClientList() {
 const { t } = useTranslation();
 const { toast } = useToast();
 const navigate = useNavigate();
 const [searchQuery, setSearchQuery] = useState('');
 const [clients, setClients] = useState<ClientWithMeta[]>([]);
 const [loading, setLoading] = useState(true);
 const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
 return (localStorage.getItem('clients_view_mode') as 'grid' | 'table') || 'grid';
 });

 const setView = (mode: 'grid' | 'table') => {
 setViewMode(mode);
 localStorage.setItem('clients_view_mode', mode);
 };

 // Load clients from API
 useEffect(() => {
 const loadClients = async () => {
 try {
 setLoading(true);
 const data = await clientService.getClients({
 sortBy: 'studioName',
 sortOrder: 'asc',
 });

 // Format data for display
 const colors = ['bg-blue-500', 'bg-blue-500', 'bg-gray-800', 'bg-gray-500', 'bg-blue-600'];
 const formattedClients = data.map((client: any, index: number) => {
 const totalCases = client._count?.cases || 0;
 const activeCases = client._count?.activeCases ?? totalCases;
 const status: ClientStatus = client.active === false ? 'inactive' : 'active';
 const priority: ClientPriority = activeCases > 5 ? 'high' : activeCases > 2 ? 'normal' : 'low';

 return {
 id: client.id,
 studioName: client.studioName,
 contactPerson: client.contactPerson,
 phone: client.phone || t('common.noData'),
 email: client.email,
 city: client.city || t('common.noData'),
 totalCases,
 activeCases,
 avatarColor: colors[index % colors.length],
 logoUrl: client.logoUrl || null,
 status,
 priority,
 };
 });

 setClients(formattedClients);
 } catch (error) {
 console.error('Error loading clients:', error);
 toast({
 title: t('common.error'),
 description: t('common.errorLoadingData'),
 variant: 'destructive',
 });
 } finally {
 setLoading(false);
 }
 };

 loadClients();
 }, [toast]);

 const filteredClients = clients.filter(c => {
 if (!searchQuery) return true;
 return c.studioName.toLowerCase().includes(searchQuery.toLowerCase()) ||
 c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
 c.city.toLowerCase().includes(searchQuery.toLowerCase());
 });

 const handleStatusChange = (clientId: string, newStatus: ClientStatus) => {
 setClients(prev => prev.map(c =>
 c.id === clientId ? { ...c, status: newStatus } : c
 ));
 toast({
 title: t('common.saved'),
 description: getStatusLabel(newStatus),
 });
 };

 const handlePriorityChange = (clientId: string, newPriority: ClientPriority) => {
 setClients(prev => prev.map(c =>
 c.id === clientId ? { ...c, priority: newPriority } : c
 ));
 toast({
 title: t('common.saved'),
 description: getPriorityLabel(newPriority),
 });
 };

 const handleCardClick = (clientId: string, e: React.MouseEvent) => {
 const target = e.target as HTMLElement;
 if (target.closest('[data-dropdown]') || target.closest('[role="menuitem"]')) {
 return;
 }
 navigate(`/admin/clients/${clientId}`);
 };

 const totalStats = {
 clients: clients.length,
 totalCases: clients.reduce((acc, c) => acc + c.totalCases, 0),
 activeCases: clients.reduce((acc, c) => acc + c.activeCases, 0),
 };

 const getStatusLabel = (status: ClientStatus) => {
 switch (status) {
 case 'active': return t('clients.statusActive');
 case 'inactive': return t('clients.statusInactive');
 case 'blocked': return t('clients.statusBlocked');
 default: return status;
 }
 };

 const getStatusBadgeClass = (status: ClientStatus) => {
 switch (status) {
 case 'active': return 'bg-gray-50 text-emerald-700 border border-emerald-200';
 case 'inactive': return 'bg-gray-100 text-gray-600 border border-gray-200';
 case 'blocked': return 'bg-red-50 text-red-700 border border-red-200';
 default: return 'bg-gray-100 text-gray-600 border border-gray-200';
 }
 };

 const getPriorityLabel = (priority: ClientPriority) => {
 switch (priority) {
 case 'high': return t('clients.priorityHigh');
 case 'normal': return t('clients.priorityNormal');
 case 'low': return t('clients.priorityLow');
 default: return priority;
 }
 };

 const getPriorityBadgeClass = (priority: ClientPriority) => {
 switch (priority) {
 case 'high': return 'bg-red-50 text-red-700 border border-red-200';
 case 'normal': return 'bg-gray-50 text-sky-700 border border-sky-200';
 case 'low': return 'bg-gray-100 text-gray-600 border border-gray-200';
 default: return 'bg-gray-100 text-gray-600 border border-gray-200';
 }
 };

 return (
 <div className="space-y-6 animate-fade-in">
 {/* Header */}
 <div className="flex items-center justify-end gap-2">
 <Link to="/admin/settings" className="inline-flex items-center gap-1 bg-gray-800 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-gray-700">
 <Settings size={14} />
 {t('settings.title')}
 </Link>
 </div>

 {/* Search and Add */}
 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
 <div className="relative flex-1 max-w-md w-full">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
 <input
 type="text"
 placeholder={t('common.search')}
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
 />
 </div>
 {/* View mode toggle */}
 <div className="inline-flex items-center bg-gray-100 p-0.5 ">
 <button
 onClick={() => setView('grid')}
 className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition ${
 viewMode === 'grid'
 ? 'bg-white text-gray-800 '
 : 'text-gray-500 hover:text-gray-700'
 }`}
 title="Vista griglia"
 >
 <LayoutGrid size={14} />
 <span className="hidden sm:inline">Griglia</span>
 </button>
 <button
 onClick={() => setView('table')}
 className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition ${
 viewMode === 'table'
 ? 'bg-white text-gray-800 '
 : 'text-gray-500 hover:text-gray-700'
 }`}
 title="Vista tabella"
 >
 <List size={14} />
 <span className="hidden sm:inline">Tabella</span>
 </button>
 </div>
 <Link to="/admin/clients/new" className="inline-flex items-center gap-2 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700 whitespace-nowrap">
 <Plus size={18} />
 {t('clients.newClient')}
 </Link>
 </div>

 {/* Stats summary */}
 <div className="grid grid-cols-3 gap-3">
 <div className=" bg-white p-4 border border-gray-100">
 <p className="text-xs text-gray-500 mb-1">{t('clients.totalClients')}</p>
 <p className="text-xl font-bold text-gray-800">{totalStats.clients}</p>
 </div>
 <div className=" bg-white p-4 border border-gray-100">
 <p className="text-xs text-gray-500 mb-1">{t('clients.totalCases')}</p>
 <p className="text-xl font-bold text-gray-800">{totalStats.totalCases}</p>
 </div>
 <div className=" bg-white p-4 border border-gray-100">
 <p className="text-xs text-gray-500 mb-1">{t('clients.active')}</p>
 <p className="text-xl font-bold text-blue-500">{totalStats.activeCases}</p>
 </div>
 </div>

 {/* Clients Grid */}
 {loading ? (
 <div className=" bg-white p-12 text-center border border-gray-100">
 <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
 <p className="text-gray-500">{t('clients.loadingClients')}</p>
 </div>
 ) : viewMode === 'grid' ? (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
 {filteredClients.map((client) => (
 <div
 key={client.id}
 onClick={(e) => handleCardClick(client.id, e)}
 className=" bg-white p-5 border border-gray-100 hover: transition-all group cursor-pointer relative"
 >
 {/* Header */}
 <div className="flex items-center gap-3 mb-4">
 <ClientAvatar
 studioName={client.studioName}
 logoUrl={client.logoUrl}
 size={44}
 fallbackBg={client.avatarColor}
 />
 <div className="flex-1 min-w-0">
 <h3 className="font-semibold text-sm text-gray-800 truncate" title={client.studioName}>{client.studioName}</h3>
 <p className="text-xs text-gray-500 truncate">{client.contactPerson}</p>
 </div>
 <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-600 transition-colors shrink-0" />
 </div>

 {/* Status & Priority Tags */}
 <div className="flex items-center gap-2 mb-4">
 <div data-dropdown onClick={(e) => e.stopPropagation()}>
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <button className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition hover:opacity-80 ${getStatusBadgeClass(client.status)}`}>
 <span className="w-1.5 h-1.5 bg-current"></span>
 {getStatusLabel(client.status)}
 </button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="start" className="w-32 border border-gray-100">
 {(['active', 'inactive', 'blocked'] as ClientStatus[]).map((status) => (
 <DropdownMenuItem
 key={status}
 onClick={() => handleStatusChange(client.id, status)}
 className="text-xs"
 >
 <span className={`w-2 h-2 mr-2 ${
 status === 'active' ? 'bg-green-500' :
 status === 'inactive' ? 'bg-gray-400' : 'bg-red-500'
 }`}></span>
 {getStatusLabel(status)}
 {client.status === status && <span className="ml-auto text-blue-600">✓</span>}
 </DropdownMenuItem>
 ))}
 </DropdownMenuContent>
 </DropdownMenu>
 </div>

 <div data-dropdown onClick={(e) => e.stopPropagation()}>
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <button className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition hover:opacity-80 ${getPriorityBadgeClass(client.priority)}`}>
 {client.priority === 'high' ? '↑' : client.priority === 'low' ? '↓' : '→'}
 {getPriorityLabel(client.priority)}
 </button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="start" className="w-32 border border-gray-100">
 {(['high', 'normal', 'low'] as ClientPriority[]).map((priority) => (
 <DropdownMenuItem
 key={priority}
 onClick={() => handlePriorityChange(client.id, priority)}
 className="text-xs"
 >
 <span className="mr-2">
 {priority === 'high' ? '↑' : priority === 'low' ? '↓' : '→'}
 </span>
 {getPriorityLabel(priority)}
 {client.priority === priority && <span className="ml-auto text-blue-600">✓</span>}
 </DropdownMenuItem>
 ))}
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 </div>

 {/* Contact */}
 <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
 <span className="flex items-center gap-1 truncate">
 <Phone size={12} className="shrink-0 text-blue-600" />
 <span className="truncate">{client.phone}</span>
 </span>
 <span className="flex items-center gap-1 truncate">
 <MapPin size={12} className="shrink-0 text-blue-500" />
 <span className="truncate">{client.city}</span>
 </span>
 </div>

 {/* Stats */}
 <div className="flex items-center justify-between pt-4 border-t border-gray-100">
 <div className="flex items-center gap-3">
 <div className="flex items-center gap-1">
 <Package size={12} className="text-gray-400" />
 <span className="text-xs font-medium text-gray-600">{client.totalCases}</span>
 </div>
 {client.activeCases > 0 && (
 <div className="flex items-center gap-1">
 <span className="w-1.5 h-1.5 bg-blue-500"></span>
 <span className="text-xs font-medium text-blue-500">{client.activeCases}</span>
 </div>
 )}
 </div>
 <div className="opacity-0 group-hover:opacity-100 transition-opacity">
 <div data-dropdown onClick={(e) => e.stopPropagation()}>
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <button className="w-7 h-7 bg-gray-50 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors">
 <MoreHorizontal size={14} />
 </button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className=" border border-gray-100">
 <DropdownMenuItem onClick={() => navigate(`/admin/clients/${client.id}`)} className="text-xs">
 {t('clients.viewDetails')}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => navigate(`/admin/clients/${client.id}/edit`)} className="text-xs">
 {t('clients.editClient')}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => navigate(`/admin/cases/new?clientId=${client.id}`)} className="text-xs">
 {t('clients.createNewCase')}
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 ) : (
 /* Table view */
 <div className=" bg-white border border-gray-100 overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
 <tr>
 <th className="text-left px-4 py-3">Studio</th>
 <th className="text-left px-4 py-3 hidden md:table-cell">Contatto</th>
 <th className="text-left px-4 py-3 hidden lg:table-cell">Telefono</th>
 <th className="text-left px-4 py-3 hidden lg:table-cell">Email</th>
 <th className="text-left px-4 py-3 hidden md:table-cell">Città</th>
 <th className="text-center px-4 py-3">Ordini</th>
 <th className="text-center px-4 py-3 hidden sm:table-cell">Stato</th>
 <th className="text-right px-4 py-3"></th>
 </tr>
 </thead>
 <tbody>
 {filteredClients.map((client) => (
 <tr
 key={client.id}
 onClick={(e) => handleCardClick(client.id, e)}
 className="border-t border-gray-100 hover:bg-gray-50/50 cursor-pointer transition group"
 >
 <td className="px-4 py-3">
 <div className="flex items-center gap-2.5">
 <ClientAvatar
 studioName={client.studioName}
 logoUrl={client.logoUrl}
 size={32}
 rounded=""
 fallbackBg={client.avatarColor}
 />
 <div className="min-w-0">
 <p className="font-medium text-gray-800 truncate">{client.studioName}</p>
 <p className="text-[11px] text-gray-500 truncate md:hidden">{client.contactPerson}</p>
 </div>
 </div>
 </td>
 <td className="px-4 py-3 hidden md:table-cell text-gray-600">
 {client.contactPerson || <span className="text-gray-300">—</span>}
 </td>
 <td className="px-4 py-3 hidden lg:table-cell text-gray-600">
 <span className="inline-flex items-center gap-1.5 text-xs">
 {client.phone !== t('common.noData') ? (
 <>
 <Phone size={11} className="text-blue-600" />
 {client.phone}
 </>
 ) : (
 <span className="text-gray-300">—</span>
 )}
 </span>
 </td>
 <td className="px-4 py-3 hidden lg:table-cell text-gray-600 max-w-[200px] truncate">
 <span className="inline-flex items-center gap-1.5 text-xs">
 {client.email ? (
 <>
 <Mail size={11} className="text-blue-600 shrink-0" />
 <span className="truncate">{client.email}</span>
 </>
 ) : (
 <span className="text-gray-300">—</span>
 )}
 </span>
 </td>
 <td className="px-4 py-3 hidden md:table-cell text-gray-600">
 {client.city !== t('common.noData') ? (
 <span className="inline-flex items-center gap-1.5 text-xs">
 <MapPin size={11} className="text-blue-500" />
 {client.city}
 </span>
 ) : (
 <span className="text-gray-300">—</span>
 )}
 </td>
 <td className="px-4 py-3 text-center">
 <span className="inline-flex items-center gap-2">
 <span className="inline-flex items-center gap-1 text-gray-600">
 <Package size={11} className="text-gray-400" />
 <span className="font-medium">{client.totalCases}</span>
 </span>
 {client.activeCases > 0 && (
 <span className="inline-flex items-center gap-1 text-blue-500">
 <span className="w-1.5 h-1.5 bg-blue-500" />
 <span className="font-medium text-xs">{client.activeCases}</span>
 </span>
 )}
 </span>
 </td>
 <td className="px-4 py-3 hidden sm:table-cell text-center">
 <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium border ${getStatusBadgeClass(client.status)}`}>
 <span className="w-1.5 h-1.5 bg-current" />
 {getStatusLabel(client.status)}
 </span>
 </td>
 <td className="px-4 py-3 text-right">
 <div data-dropdown onClick={(e) => e.stopPropagation()}>
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <button className="w-7 h-7 bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-blue-600 transition opacity-0 group-hover:opacity-100">
 <MoreHorizontal size={14} />
 </button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className=" border border-gray-100">
 <DropdownMenuItem onClick={() => navigate(`/admin/clients/${client.id}`)} className="text-xs">
 {t('clients.viewDetails')}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => navigate(`/admin/clients/${client.id}/edit`)} className="text-xs">
 {t('clients.editClient')}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => navigate(`/admin/cases/new?clientId=${client.id}`)} className="text-xs">
 {t('clients.createNewCase')}
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {!loading && filteredClients.length === 0 && (
 <div className=" bg-white py-12 text-center border border-gray-100">
 <p className="text-gray-500">{t('common.noResults')}</p>
 </div>
 )}
 </div>
 );
}
