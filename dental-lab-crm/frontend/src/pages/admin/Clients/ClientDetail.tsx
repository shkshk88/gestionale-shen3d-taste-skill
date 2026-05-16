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
  Euro,
  TrendingUp,
  Clock,
  Plus,
  ChevronRight,
  MoreHorizontal,
  FileText
} from 'lucide-react';
import clientService from '../../../services/client.service';
import caseService from '../../../services/case.service';
import { useToast } from '../../../components/ui/use-toast';

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
          title: 'Errore',
          description: 'Impossibile caricare i dati del cliente',
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-neutral-500">Caricamento cliente...</p>
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
        return <span className="badge-info">Ricevuto</span>;
      case 'in_progress':
        return <span className="badge-warning">In lavorazione</span>;
      case 'qc':
        return <span className="badge-info">Controllo qualità</span>;
      case 'shipped':
        return <span className="badge-success">Spedito</span>;
      case 'delivered':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">Consegnato</span>;
      default:
        return <span className="badge-warning">{status}</span>;
    }
  };

  // Get avatar color based on client index/id
  const getAvatarColor = () => {
    const colors = ['bg-card-yellow', 'bg-card-teal', 'bg-card-navy', 'bg-card-olive', 'bg-card-rose'];
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
    return parts.join(', ') || 'N/A';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/clients"
            className="w-10 h-10 rounded-xl bg-white shadow-soft flex items-center justify-center text-neutral-500 hover:text-neutral-800 hover:shadow-card transition-all"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl ${getAvatarColor()} flex items-center justify-center text-white font-bold text-xl`}>
              {client.studioName.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-800">{client.studioName}</h1>
              <p className="text-neutral-500">{client.contactPerson}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/admin/cases/new?clientId=${id}`}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            Nuovo caso
          </Link>
          <Link
            to={`/admin/clients/${id}/edit`}
            className="px-4 py-2 bg-white rounded-xl shadow-soft text-neutral-700 font-medium flex items-center gap-2 hover:shadow-card transition-all"
          >
            <Edit size={18} />
            {t('common.edit')}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="card-base p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package size={16} className="text-brand-primary" />
                <span className="text-xs text-neutral-400">Casi totali</span>
              </div>
              <p className="text-2xl font-bold text-neutral-800">{stats.totalCases}</p>
            </div>
            <div className="card-base p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="text-amber-500" />
                <span className="text-xs text-neutral-400">Attivi</span>
              </div>
              <p className="text-2xl font-bold text-amber-500">{stats.activeCases}</p>
            </div>
            <div className="card-yellow p-4">
              <div className="flex items-center gap-2 mb-2">
                <Euro size={16} />
                <span className="text-xs text-neutral-600">Fatturato</span>
              </div>
              <p className="text-2xl font-bold">€{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="card-base p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-green-500" />
                <span className="text-xs text-neutral-400">Media caso</span>
              </div>
              <p className="text-2xl font-bold text-neutral-800">€{stats.avgCaseValue}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="card-base overflow-hidden">
            <div className="flex border-b border-neutral-100">
              {[
                { id: 'cases', label: 'Casi recenti', count: stats.totalCases },
                { id: 'invoices', label: 'Fatture', count: 12 },
                { id: 'notes', label: 'Note' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-brand-primary text-brand-primary'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  {tab.label}
                  {tab.count && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      activeTab === tab.id
                        ? 'bg-brand-primary/10 text-brand-primary'
                        : 'bg-neutral-100 text-neutral-500'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'cases' && (
                <div className="space-y-3">
                  {cases.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-neutral-500 mb-4">Nessun caso trovato</p>
                      <Link
                        to={`/admin/cases/new?client=${id}`}
                        className="btn-primary inline-flex items-center gap-2"
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
                          className="flex items-center justify-between p-4 bg-surface-secondary rounded-xl hover:bg-neutral-200 transition-colors group"
                        >
                          <div className="flex items-center gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-neutral-800">{case_.caseNumber}</span>
                                {getStatusBadge(case_.status)}
                              </div>
                              <p className="text-sm text-neutral-500">
                                {case_.patientName || 'N/A'} - {case_.teeth?.length || 0} {case_.teeth?.length === 1 ? 'dente' : 'denti'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-semibold text-neutral-800">
                                €{case_.totalPrice ? case_.totalPrice.toFixed(2) : '0.00'}
                              </p>
                              <p className="text-xs text-neutral-400">
                                Consegna: {new Date(case_.dueDate).toLocaleDateString('it-IT')}
                              </p>
                            </div>
                            <ChevronRight size={20} className="text-neutral-300 group-hover:text-neutral-500 transition-colors" />
                          </div>
                        </Link>
                      ))}

                      {cases.length > 5 && (
                        <Link
                          to={`/admin/cases?client=${id}`}
                          className="block text-center py-3 text-sm font-medium text-brand-primary hover:underline"
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
                      className="flex items-center justify-between p-4 bg-surface-secondary rounded-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <FileText size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-800">{invoice.id}</p>
                          <p className="text-sm text-neutral-500">
                            {new Date(invoice.date).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-neutral-800">€{invoice.amount}</p>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Pagata
                          </span>
                        </div>
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:bg-neutral-100 transition-colors">
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
                    <div className="p-4 bg-surface-secondary rounded-xl">
                      <p className="text-neutral-700">{client.notes}</p>
                      <p className="text-xs text-neutral-400 mt-2">
                        Ultima modifica: {new Date(client.updatedAt).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-surface-secondary rounded-xl text-center">
                      <p className="text-neutral-500">Nessuna nota presente</p>
                    </div>
                  )}
                  <textarea
                    placeholder={t('clients.notesPlaceholder')}
                    className="input-modern w-full resize-none"
                    rows={3}
                  />
                  <button className="px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-medium hover:bg-brand-primary/90 transition-colors">
                    Salva nota
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="card-base p-6">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Contatti</h3>
            <div className="space-y-4">
              <a
                href={`tel:${client.phone}`}
                className="flex items-center gap-3 p-3 bg-surface-secondary rounded-xl hover:bg-neutral-200 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Phone size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-neutral-400">Telefono</p>
                  <p className="text-sm font-medium text-neutral-700">{client.phone}</p>
                </div>
              </a>
              <a
                href={`mailto:${client.email}`}
                className="flex items-center gap-3 p-3 bg-surface-secondary rounded-xl hover:bg-neutral-200 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Mail size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-neutral-400">Email</p>
                  <p className="text-sm font-medium text-neutral-700">{client.email}</p>
                </div>
              </a>
              <div className="flex items-start gap-3 p-3 bg-surface-secondary rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <MapPin size={18} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-neutral-400">Indirizzo</p>
                  <p className="text-sm font-medium text-neutral-700">{formatAddress()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Business Info */}
          <div className="card-navy p-6 text-white">
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
                  {new Date(client.createdAt).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card-base p-6">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Azioni rapide</h3>
            <div className="space-y-2">
              <button className="w-full px-4 py-3 bg-surface-secondary rounded-xl text-left text-sm font-medium text-neutral-700 hover:bg-neutral-200 transition-colors flex items-center justify-between">
                Genera fattura
                <ChevronRight size={16} className="text-neutral-400" />
              </button>
              <button className="w-full px-4 py-3 bg-surface-secondary rounded-xl text-left text-sm font-medium text-neutral-700 hover:bg-neutral-200 transition-colors flex items-center justify-between">
                Invia promemoria
                <ChevronRight size={16} className="text-neutral-400" />
              </button>
              <button className="w-full px-4 py-3 bg-surface-secondary rounded-xl text-left text-sm font-medium text-neutral-700 hover:bg-neutral-200 transition-colors flex items-center justify-between">
                Modifica listino
                <ChevronRight size={16} className="text-neutral-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
