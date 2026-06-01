import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  ClipboardList,
  Truck,
  Clock,
  ChevronRight,
  Calendar,
  MessageSquare
} from 'lucide-react';
import caseService from '../../services/case.service';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { getDateLocale, formatRelativeTime } from '@/utils/locale';

interface RecentMessage {
  id: string;
  caseId: string;
  caseNumber: string;
  patient: string;
  workType: string;
  teethCount: number;
  senderName: string;
  messageText: string;
  createdAt: string;
  isFromMe: boolean;
}

export default function ClientDashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<any[]>([]);
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [stats, setStats] = useState({
    activeCases: 0,
    inProgress: 0,
    shippedThisWeek: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const clientId = user?.clientId || user?.client?.id;
        if (!clientId) {
          setCases([]);
          return;
        }
        const casesData = await caseService.getCases({ clientId });
        setCases(casesData);

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

        const casesWithMessages = casesData.filter((c: any) => (c._count?.messages ?? 0) > 0);
        const messagePromises = casesWithMessages.slice(0, 10).map(async (c: any) => {
          try {
            const messages = await api.get<any[]>(`/cases/${c.id}/messages`);
            if (!Array.isArray(messages) || messages.length === 0) return null;
            const last = messages[messages.length - 1];
            return {
              id: last.id,
              caseId: c.id,
              caseNumber: c.caseNumber,
              patient: c.patientName || t('common.noData'),
              workType: c.teeth?.[0]?.workType || '',
              teethCount: c.teeth?.length || 0,
              senderName: last.sender?.name || 'Utente',
              messageText: last.messageText || '',
              createdAt: last.createdAt,
              isFromMe: last.senderId === user?.id,
            } as RecentMessage;
          } catch {
            return null;
          }
        });
        const results = (await Promise.all(messagePromises)).filter(Boolean) as RecentMessage[];
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRecentMessages(results.slice(0, 5));
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id, user?.clientId]);

  const upcomingDeliveries = cases
    .filter(c => c.status !== 'delivered')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3)
    .map(c => ({
      id: c.id,
      caseNumber: c.caseNumber,
      patient: c.patientName || t('common.noData'),
      dueDate: c.dueDate,
      status: c.status,
      type: c.teeth?.[0]?.workType || t('cases.workLabel'),
      teethCount: c.teeth?.length || 0,
      hasMessage: (c._count?.messages ?? 0) > 0,
    }));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'received':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700">{t('cases.statuses.received')}</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">{t('cases.statuses.in_progress')}</span>;
      case 'qc':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">{t('cases.statuses.qc')}</span>;
      case 'shipped':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">{t('cases.statuses.shipped')}</span>;
      case 'delivered':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">{t('cases.statuses.delivered')}</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-slate-500">{t('common.loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-scale-in pb-4">
      {/* Hero row */}
      <div className="grid grid-cols-12 items-center gap-3 mb-2">
        <div className="col-span-12 md:col-span-4 grid grid-cols-3 gap-1.5">
          <div className="bg-gradient-to-br from-sky-500 to-sky-600 rounded-2xl px-2 py-1.5 shadow-sm shadow-sky-500/20 flex items-center gap-1.5">
            <ClipboardList size={14} className="text-white shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] text-white/80 leading-none uppercase tracking-wide truncate">{t('portal.activeCasesShort')}</p>
              <p className="text-base font-bold text-white leading-tight">{stats.activeCases}</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl px-2 py-1.5 shadow-sm shadow-teal-500/20 flex items-center gap-1.5">
            <Clock size={14} className="text-white shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] text-white/80 leading-none uppercase tracking-wide truncate">{t('portal.inProgressShort')}</p>
              <p className="text-base font-bold text-white leading-tight">{stats.inProgress}</p>
            </div>
          </div>
          <div className="bg-slate-800 rounded-2xl px-2 py-1.5 shadow-sm shadow-slate-800/20 flex items-center gap-1.5">
            <Truck size={14} className="text-sky-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] text-white/60 leading-none uppercase tracking-wide truncate">{t('portal.shippedRecent')}</p>
              <p className="text-base font-bold text-white leading-tight">{stats.shippedThisWeek}</p>
            </div>
          </div>
        </div>

        <div className="col-span-12 md:col-span-4 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">{t('portal.welcome')}</h1>
          <p className="text-xs md:text-sm text-slate-500">{user?.client?.studioName || t('portal.defaultClient')}</p>
        </div>

        <div className="col-span-12 md:col-span-4 flex md:justify-end">
          <Link
            to="/portal/new-case"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-sky-500 to-sky-600 text-white rounded-2xl text-sm font-semibold hover:scale-105 transition-all duration-300 shadow-lg shadow-sky-500/20"
          >
            <PlusCircle size={16} />
            {t('portal.submitNewCase')}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upcoming Deliveries */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar size={20} className="text-teal-500" />
                {t('portal.myCases', { defaultValue: 'I miei casi' })}
              </h2>
              <Link to="/portal/cases" className="text-sm text-sky-600 font-semibold hover:text-sky-700 transition-colors">
                {t('common.viewAll', { defaultValue: 'Vedi tutti' })} →
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {upcomingDeliveries.length > 0 ? upcomingDeliveries.map((delivery) => (
                <Link
                  key={delivery.id}
                  to={`/portal/cases/${delivery.id}`}
                  className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-all duration-200 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-slate-800 truncate">{delivery.patient}</span>
                      {getStatusBadge(delivery.status)}
                      {delivery.hasMessage && (
                        <MessageSquare size={13} className="text-teal-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-slate-600">
                      {t(`dental.workTypes.${delivery.type}`, { defaultValue: delivery.type })}
                      {delivery.teethCount > 0 && (
                        <span className="text-slate-400"> · {delivery.teethCount} {t('dental.tooth', { count: delivery.teethCount })}</span>
                      )}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">#{delivery.caseNumber}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-3">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400">{t('portal.deliveryLabel', { defaultValue: 'Consegna' })}</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {delivery.dueDate ? new Date(delivery.dueDate).toLocaleDateString(getDateLocale(), { day: 'numeric', month: 'short' }) : '—'}
                      </p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                </Link>
              )) : (
                <div className="p-8 text-center">
                  <p className="text-slate-400">{t('portal.noDeliveriesScheduled', { defaultValue: 'Nessuna consegna in programma' })}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <MessageSquare size={20} className="text-teal-500" />
              {t('portal.recentMessages', { defaultValue: 'Messaggi recenti' })}
            </h3>
            <div className="space-y-3">
              {recentMessages.length > 0 ? recentMessages.map((msg) => (
                <Link
                  key={msg.id}
                  to={`/portal/cases/${msg.caseId}`}
                  className={`block p-3 rounded-xl transition-colors ${
                    !msg.isFromMe ? 'bg-sky-50 border-l-4 border-sky-500 hover:bg-sky-100' : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-800 truncate">{msg.patient}</span>
                    <span className="text-xs text-slate-400 shrink-0 ml-2">{formatRelativeTime(msg.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-1">
                    {t(`dental.workTypes.${msg.workType}`, { defaultValue: msg.workType })}
                    {msg.teethCount > 0 && <span> · {msg.teethCount} {t('dental.tooth', { count: msg.teethCount })}</span>}
                  </p>
                  <p className="text-sm text-slate-700 line-clamp-2">
                    <span className="font-medium">{msg.isFromMe ? 'Tu' : msg.senderName}:</span> {msg.messageText}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 mt-1">#{msg.caseNumber}</p>
                </Link>
              )) : (
                <p className="text-sm text-slate-400 text-center py-4">{t('portal.noMessages', { defaultValue: 'Nessun messaggio' })}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
