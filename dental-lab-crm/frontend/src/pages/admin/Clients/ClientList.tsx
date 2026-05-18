import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Phone, MapPin, Package, MoreHorizontal, ChevronRight, Loader2, Settings } from 'lucide-react';
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
      {/* Header: Profilo + link impostazioni */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl md:text-2xl font-bold text-neutral-800">Profilo</h1>
        <Link to="/admin/settings" className="btn-secondary text-xs px-3 py-1.5 rounded-full flex items-center gap-1">
          <Settings size={14} />
          Impostazioni
        </Link>
      </div>

      {/* Search and Add */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              onClick={(e) => handleCardClick(client.id, e)}
              className="card-base p-4 hover:shadow-card-hover transition-all group cursor-pointer relative"
            >
              {/* Header - Compact */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${client.avatarColor} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                  {client.studioName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
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
      )}

      {!loading && filteredClients.length === 0 && (
        <div className="card-base py-12 text-center">
          <p className="text-neutral-500">{t('common.noResults')}</p>
        </div>
      )}
    </div>
  );
}
