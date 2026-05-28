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
        const colors = ['bg-card-yellow', 'bg-card-teal', 'bg-card-navy', 'bg-card-olive', 'bg-card-rose'];
        const formattedClients = data.map((client: any, index: number) => {
          const totalCases = client._count?.cases || 0;
          // TODO M-02 audit: il backend non ritorna activeCases; per ora uso totalCases come proxy.
          // Da sostituire con count reale dei casi non delivered quando l'endpoint lo supporterà.
          const activeCases = client._count?.activeCases ?? totalCases;

          // Use the real 'active' flag from the DB instead of inventing one from random data
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

  // Update client status
  const handleStatusChange = (clientId: string, newStatus: ClientStatus) => {
    setClients(prev => prev.map(c =>
      c.id === clientId ? { ...c, status: newStatus } : c
    ));
    toast({
      title: t('common.saved'),
      description: getStatusLabel(newStatus),
    });
  };

  // Update client priority
  const handlePriorityChange = (clientId: string, newPriority: ClientPriority) => {
    setClients(prev => prev.map(c =>
      c.id === clientId ? { ...c, priority: newPriority } : c
    ));
    toast({
      title: t('common.saved'),
      description: getPriorityLabel(newPriority),
    });
  };

  // Navigate to client detail
  const handleCardClick = (clientId: string, e: React.MouseEvent) => {
    // Don't navigate if clicking on dropdown or interactive elements
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

  // Helper functions for status/priority labels and colors
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
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'inactive': return 'bg-neutral-100 text-neutral-600 border-neutral-200';
      case 'blocked': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-neutral-100 text-neutral-600';
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
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'normal': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'low': return 'bg-neutral-100 text-neutral-600 border-neutral-200';
      default: return 'bg-neutral-100 text-neutral-600';
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header — title removed (already shown in top bar); keep settings link */}
      <div className="flex items-center justify-end gap-2">
        <Link to="/admin/settings" className="btn-secondary text-xs px-3 py-1.5 rounded-full flex items-center gap-1">
          <Settings size={14} />
          {t('settings.title')}
        </Link>
      </div>

      {/* Search and Add */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-modern pl-11 w-full"
          />
        </div>
        {/* View mode toggle */}
        <div className="inline-flex items-center bg-neutral-100 rounded-xl p-0.5">
          <button
            onClick={() => setView('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              viewMode === 'grid'
                ? 'bg-white text-neutral-800 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
            title="Vista griglia"
          >
            <LayoutGrid size={14} />
            <span className="hidden sm:inline">Griglia</span>
          </button>
          <button
            onClick={() => setView('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              viewMode === 'table'
                ? 'bg-white text-neutral-800 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
            title="Vista tabella"
          >
            <List size={14} />
            <span className="hidden sm:inline">Tabella</span>
          </button>
        </div>
        <Link to="/admin/clients/new" className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <Plus size={18} />
          {t('clients.newClient')}
        </Link>
      </div>

      {/* Clients Grid - Compact */}
      {loading ? (
        <div className="card-base p-12 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-primary mx-auto mb-4" />
          <p className="text-neutral-500">{t('clients.loadingClients')}</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              onClick={(e) => handleCardClick(client.id, e)}
              className="card-base p-4 hover:shadow-card-hover transition-all group cursor-pointer relative"
            >
              {/* Header - Compact */}
              <div className="flex items-center gap-3 mb-3">
                <ClientAvatar
                  studioName={client.studioName}
                  logoUrl={client.logoUrl}
                  size={40}
                  fallbackBg={client.avatarColor}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-neutral-800 truncate" title={client.studioName}>{client.studioName}</h3>
                  <p className="text-xs text-neutral-500 truncate">{client.contactPerson}</p>
                </div>
                <ChevronRight size={16} className="text-neutral-300 group-hover:text-neutral-500 transition-colors shrink-0" />
              </div>

              {/* Status & Priority Tags - Clickable */}
              <div className="flex items-center gap-2 mb-3">
                {/* Status Dropdown */}
                <div data-dropdown onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(client.status)} hover:opacity-80 transition-opacity`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {getStatusLabel(client.status)}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-32">
                      {(['active', 'inactive', 'blocked'] as ClientStatus[]).map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onClick={() => handleStatusChange(client.id, status)}
                          className="text-xs"
                        >
                          <span className={`w-2 h-2 rounded-full mr-2 ${
                            status === 'active' ? 'bg-green-500' :
                            status === 'inactive' ? 'bg-neutral-400' : 'bg-red-500'
                          }`}></span>
                          {getStatusLabel(status)}
                          {client.status === status && <span className="ml-auto text-brand-primary">✓</span>}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Priority Dropdown */}
                <div data-dropdown onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityBadgeClass(client.priority)} hover:opacity-80 transition-opacity`}>
                        {client.priority === 'high' ? '↑' : client.priority === 'low' ? '↓' : '→'}
                        {getPriorityLabel(client.priority)}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-32">
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
                          {client.priority === priority && <span className="ml-auto text-brand-primary">✓</span>}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Contact - Compact inline */}
              <div className="flex items-center gap-3 text-xs text-neutral-500 mb-3">
                <span className="flex items-center gap-1 truncate">
                  <Phone size={12} className="shrink-0" />
                  <span className="truncate">{client.phone}</span>
                </span>
                <span className="flex items-center gap-1 truncate">
                  <MapPin size={12} className="shrink-0" />
                  <span className="truncate">{client.city}</span>
                </span>
              </div>

              {/* Stats - Compact */}
              <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Package size={12} className="text-neutral-400" />
                    <span className="text-xs font-medium text-neutral-600">{client.totalCases}</span>
                  </div>
                  {client.activeCases > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
                      <span className="text-xs font-medium text-brand-primary">{client.activeCases}</span>
                    </div>
                  )}
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div data-dropdown onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-6 h-6 rounded-lg bg-surface-secondary flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors">
                          <MoreHorizontal size={14} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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
        <div className="card-base overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
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
                    className="border-t border-neutral-100 hover:bg-neutral-50/50 cursor-pointer transition group"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <ClientAvatar
                          studioName={client.studioName}
                          logoUrl={client.logoUrl}
                          size={32}
                          rounded="rounded-lg"
                          fallbackBg={client.avatarColor}
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-neutral-800 truncate">{client.studioName}</p>
                          <p className="text-[11px] text-neutral-500 truncate md:hidden">{client.contactPerson}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell text-neutral-600">
                      {client.contactPerson || <span className="text-neutral-300">—</span>}
                    </td>
                    <td className="px-4 py-2.5 hidden lg:table-cell text-neutral-600">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        {client.phone !== t('common.noData') ? (
                          <>
                            <Phone size={11} className="text-neutral-400" />
                            {client.phone}
                          </>
                        ) : (
                          <span className="text-neutral-300">—</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 hidden lg:table-cell text-neutral-600 max-w-[200px] truncate">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        {client.email ? (
                          <>
                            <Mail size={11} className="text-neutral-400 shrink-0" />
                            <span className="truncate">{client.email}</span>
                          </>
                        ) : (
                          <span className="text-neutral-300">—</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell text-neutral-600">
                      {client.city !== t('common.noData') ? (
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <MapPin size={11} className="text-neutral-400" />
                          {client.city}
                        </span>
                      ) : (
                        <span className="text-neutral-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-neutral-600">
                          <Package size={11} className="text-neutral-400" />
                          <span className="font-medium">{client.totalCases}</span>
                        </span>
                        {client.activeCases > 0 && (
                          <span className="inline-flex items-center gap-1 text-brand-primary">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                            <span className="font-medium text-xs">{client.activeCases}</span>
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 hidden sm:table-cell text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusBadgeClass(client.status)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {getStatusLabel(client.status)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div data-dropdown onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-7 h-7 rounded-lg bg-neutral-50 hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-700 transition opacity-0 group-hover:opacity-100">
                              <MoreHorizontal size={14} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
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
        <div className="card-base py-12 text-center">
          <p className="text-neutral-500">{t('common.noResults')}</p>
        </div>
      )}
    </div>
  );
}
