import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  ClipboardList,
  Truck,
  Clock,
  ChevronRight,
  Package,
  Calendar,
  MessageSquare
} from 'lucide-react';
import caseService from '../../services/case.service';
import { useAuthStore } from '../../store/authStore';

export default function ClientDashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<any[]>([]);
  const [stats, setStats] = useState({
    activeCases: 0,
    inProgress: 0,
    shippedThisWeek: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Privacy: scope cases to the logged-in client only
        const clientId = user?.clientId || user?.client?.id;
        if (!clientId) {
          setCases([]);
          return;
        }
        const casesData = await caseService.getCases({ clientId });
        setCases(casesData);

        // Calculate stats
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const activeCases = casesData.filter((c: any) =>
          c.status !== 'delivered'
        ).length;

        const inProgress = casesData.filter((c: any) =>
          c.status === 'in_progress'
        ).length;

        const shippedThisWeek = casesData.filter((c: any) => {
          if (c.shippedDate) {
            const shippedDate = new Date(c.shippedDate);
            return shippedDate >= oneWeekAgo;
          }
          return false;
        }).length;

        setStats({
          activeCases,
          inProgress,
          shippedThisWeek,
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Get upcoming deliveries (next 3 cases by due date)
  const upcomingDeliveries = cases
    .filter(c => c.status !== 'delivered')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3)
    .map(c => ({
      id: c.id,
      caseNumber: c.caseNumber,
      patient: c.patientName || 'N/A',
      dueDate: c.dueDate,
      status: c.status,
      type: c.teeth?.[0]?.workType || t('cases.workLabel'),
      teeth: c.teeth?.map((t: any) => t.toothNumber).join(', ') || 'N/A',
      hasMessage: false, // TODO: implement messages
    }));

  const statsDisplay = [
    { label: t('portal.activeCases'), value: stats.activeCases, icon: ClipboardList, color: 'bg-card-teal' },
    { label: t('portal.inProgress'), value: stats.inProgress, icon: Clock, color: 'bg-card-yellow' },
    { label: t('portal.shippedThisWeek'), value: stats.shippedThisWeek, icon: Truck, color: 'bg-card-navy' },
  ];

  const recentMessages: any[] = []; // TODO: implement messages from backend

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'received':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{t('cases.statuses.received')}</span>;
      case 'in_progress':
        return <span className="badge-warning">{t('cases.statuses.in_progress')}</span>;
      case 'qc':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">{t('cases.statuses.qc')}</span>;
      case 'shipped':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{t('cases.statuses.shipped')}</span>;
      case 'delivered':
        return <span className="badge-success">{t('cases.statuses.delivered')}</span>;
      default:
        return <span className="badge-warning">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-neutral-500">{t('common.loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-scale-in pb-4">
      {/* Header with Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{t('portal.welcome')}</h1>
          <p className="text-slate-500 mt-1">{user?.client?.studioName || t('portal.defaultClient')}</p>
        </div>
        <Link
          to="/portal/new-case"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-[1.5rem] font-semibold hover:scale-105 transition-all duration-300 shadow-lg shadow-teal-500/20"
        >
          <PlusCircle size={20} />
          {t('portal.submitNewCase')}
        </Link>
      </div>

      {/* Stats Grid - Compact */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        {/* Active Cases - Teal Gradient */}
        <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl md:rounded-[1.5rem] p-3 md:p-4 relative overflow-hidden group hover:scale-[1.01] transition-all duration-300 shadow-lg shadow-teal-500/20">
          <div className="flex justify-between items-start mb-2 md:mb-4 relative z-10">
            <span className="text-white/90 font-semibold text-xs md:text-sm tracking-tight">{t('portal.activeCases')}</span>
            <div className="w-7 h-7 md:w-10 md:h-10 bg-white/20 rounded-lg md:rounded-xl flex items-center justify-center">
              <ClipboardList size={16} className="text-white" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-2xl md:text-4xl font-bold text-white tracking-tight">{stats.activeCases}</p>
            <p className="text-[10px] md:text-xs font-medium text-teal-100/80 mt-0.5">{t('portal.activeCasesShort')}</p>
          </div>
        </div>

        {/* In Progress - Amber/Yellow */}
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl md:rounded-[1.5rem] p-3 md:p-4 relative overflow-hidden group hover:scale-[1.01] transition-all duration-300 shadow-lg shadow-amber-500/20">
          <div className="flex justify-between items-start mb-2 md:mb-4">
            <span className="text-white/90 font-semibold text-xs md:text-sm tracking-tight">{t('portal.inProgress')}</span>
            <div className="w-7 h-7 md:w-10 md:h-10 bg-white/20 rounded-lg md:rounded-xl flex items-center justify-center">
              <Clock size={16} className="text-white" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-2xl md:text-4xl font-bold text-white tracking-tight">{stats.inProgress}</p>
            <p className="text-[10px] md:text-xs font-medium text-amber-100/80 mt-0.5">{t('portal.inProgressShort')}</p>
          </div>
        </div>

        {/* Shipped This Week - Navy */}
        <div className="bg-[#1A2234] rounded-2xl md:rounded-[1.5rem] p-3 md:p-4 relative overflow-hidden group hover:scale-[1.01] transition-all duration-300 shadow-lg shadow-blue-900/20">
          <div className="flex justify-between items-start mb-2 md:mb-4">
            <span className="text-white/80 font-semibold text-xs md:text-sm tracking-tight">{t('portal.shippedThisWeek')}</span>
            <div className="w-7 h-7 md:w-10 md:h-10 bg-white/10 rounded-lg md:rounded-xl flex items-center justify-center">
              <Truck size={16} className="text-blue-400" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-2xl md:text-4xl font-bold text-white tracking-tight">{stats.shippedThisWeek}</p>
            <p className="text-[10px] md:text-xs font-medium text-white/50 mt-0.5">{t('portal.shippedRecent')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upcoming Deliveries */}
        <div className="lg:col-span-2">
          <div className="glass-card overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar size={20} className="text-teal-500" />
                {t('portal.upcomingDeliveries')}
              </h2>
              <Link to="/portal/cases" className="text-sm text-teal-600 font-semibold hover:text-teal-700 transition-colors">
                Vedi tutti →
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {upcomingDeliveries.length > 0 ? upcomingDeliveries.map((delivery) => (
                <Link
                  key={delivery.id}
                  to={`/portal/cases/${delivery.id}`}
                  className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                      <Package size={20} className="text-teal-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-800">{delivery.caseNumber}</span>
                        {getStatusBadge(delivery.status)}
                        {delivery.hasMessage && (
                          <span className="flex items-center gap-1 text-teal-600">
                            <MessageSquare size={14} />
                            <span className="text-xs font-medium">Nuovo</span>
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">
                        {delivery.patient} - {t(`dental.workTypes.${delivery.type}`, delivery.type)}
                      </p>
                      <p className="text-xs text-slate-400">Denti: {delivery.teeth}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Consegna prevista</p>
                      <p className="font-semibold text-slate-800">
                        {new Date(delivery.dueDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                </Link>
              )) : (
                <div className="p-8 text-center">
                  <p className="text-slate-400">Nessuna consegna in programma</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-4">
          {/* Recent Messages */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <MessageSquare size={20} className="text-teal-500" />
              Messaggi recenti
            </h3>
            <div className="space-y-3">
              {recentMessages.length > 0 ? recentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-xl ${msg.unread ? 'bg-teal-50 border-l-4 border-teal-500' : 'bg-slate-50'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-800">{msg.from}</span>
                    <span className="text-xs text-slate-400">{msg.time}</span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{msg.message}</p>
                </div>
              )) : (
                <p className="text-sm text-slate-400 text-center py-4">Nessun messaggio</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
