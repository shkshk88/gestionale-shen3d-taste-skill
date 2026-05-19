import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Package,
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  MoreHorizontal,
  ChevronRight,
  Loader2,
  Calendar,
} from 'lucide-react';
import { useToast } from '../../components/ui/use-toast';
import caseService, { Case, CaseStatistics } from '../../services/case.service';

/* Weekly mini-calendar component */
function WeeklyCalendar({ cases }: { cases: Case[] }) {
  const { t } = useTranslation();
  const days: { date: Date; label: string; cases: Case[] }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({ date: d, label: '', cases: [] });
  }

  // Assign cases to days
  cases.forEach((c) => {
    if (!c.dueDate) return;
    const due = new Date(c.dueDate);
    due.setHours(0, 0, 0, 0);
    const day = days.find((d) => d.date.getTime() === due.getTime());
    if (day) day.cases.push(c);
  });

  const dayNames = [
    t('calendar.weekDays.sun'),
    t('calendar.weekDays.mon'),
    t('calendar.weekDays.tue'),
    t('calendar.weekDays.wed'),
    t('calendar.weekDays.thu'),
    t('calendar.weekDays.fri'),
    t('calendar.weekDays.sat'),
  ];

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
      {days.map((day, idx) => {
        const isToday = idx === 0;
        return (
          <div
            key={idx}
            className={`min-w-[110px] flex-1 rounded-xl p-2 border ${
              isToday
                ? 'bg-brand-primary/10 border-brand-primary/30'
                : 'bg-white/50 border-white/60'
            }`}
          >
            <div className="text-center mb-2">
              <p className={`text-[10px] font-bold uppercase ${isToday ? 'text-brand-primary' : 'text-neutral-400'}`}>
                {isToday ? t('calendar.today') : dayNames[day.date.getDay()]}
              </p>
              <p className={`text-lg font-bold leading-tight ${isToday ? 'text-brand-primary' : 'text-neutral-700'}`}>
                {day.date.getDate()}
              </p>
            </div>
            <div className="space-y-1">
              {day.cases.length === 0 ? (
                <p className="text-[10px] text-neutral-300 text-center py-1">—</p>
              ) : (
                day.cases.slice(0, 2).map((c) => {
                  const firstTooth = c.teeth?.[0];
                  const materialKey = firstTooth?.material;
                  const teethCount = c.teeth?.length || 0;
                  return (
                    <Link
                      key={c.id}
                      to={`/admin/cases/${c.id}`}
                      className="block bg-white rounded-md px-1.5 py-1 hover:bg-brand-primary/10 transition-colors"
                      title={`${c.client?.studioName || ''} · ${c.patientName || 'N/A'} · #${c.caseNumber}`}
                    >
                      <p className="text-[10px] font-semibold text-neutral-800 truncate leading-tight">{c.client?.studioName || '—'}</p>
                      <p className="text-[9px] text-neutral-600 truncate leading-tight">{c.patientName || t('common.noData')}</p>
                      <p className="text-[9px] text-neutral-500 truncate leading-tight">
                        {teethCount > 0 && <span>{teethCount}d</span>}
                        {materialKey && (
                          <span className="ml-1">· {t(`dental.materials.${materialKey}`, { defaultValue: materialKey })}</span>
                        )}
                      </p>
                    </Link>
                  );
                })
              )}
              {day.cases.length > 2 && (
                <p className="text-[10px] text-neutral-400 text-center">
                  {t('calendar.moreCount', { count: day.cases.length - 2 })}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CaseStatistics>({
    todayDeliveries: 0,
    inProgress: 0,
    inQC: 0,
    received: 0
  });
  const [recentCases, setRecentCases] = useState<Case[]>([]);
  const [todayDeliveries, setTodayDeliveries] = useState<Case[]>([]);
  const [totalRevenue, setTotalRevenue] = useState<string>('₪0');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch Stats and Recent Cases in parallel
        const [statsData, casesData] = await Promise.all([
          caseService.getStatistics(),
          caseService.getCases({ take: 30, sortBy: 'dueDate', sortOrder: 'asc' })
        ]);

        setStats(statsData);
        setRecentCases(casesData);

        // Logic for "Today Deliveries"
        const deliveryList = casesData.filter(c => c.status === 'shipped' || c.status === 'delivered');
        setTodayDeliveries(deliveryList.slice(0, 3));

        // Revenue: somma dei totalPrice dei casi nel batch caricato.
        // TODO: spostare il calcolo lato backend per coprire tutti i casi, non solo gli ultimi 5.
        const calculatedRevenue = casesData.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
        setTotalRevenue(`₪${calculatedRevenue.toLocaleString('he-IL')}`);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          variant: "destructive",
          title: t('common.error'),
          description: t('common.errorLoadingData'),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [t, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-scale-in pb-4">
      {/* Bento Grid Stats Row - Compact */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">

        {/* Card 1: Today Deliveries (Indigo Gradient) - Replaces Yellow */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[1.5rem] p-4 relative overflow-hidden group hover:scale-[1.01] transition-all duration-300 shadow-lg shadow-indigo-500/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />

          <div className="flex justify-between items-start mb-6 relative z-10">
            <span className="text-white/90 font-semibold text-sm tracking-tight">{t('dashboard.todayDeliveries')}</span>
            <MoreHorizontal size={16} className="text-white/60" />
          </div>

          <div className="flex items-end justify-between relative z-10">
            <div>
              <p className="text-3xl font-bold text-white tracking-tight">{stats.todayDeliveries}</p>
              <p className="text-xs font-medium text-indigo-100/80 mt-0.5">{t('dashboard.casesToShipShort')}</p>
            </div>
            <div className="flex -space-x-2">
              {['C', 'S', 'D'].map((letter, i) => (
                <div key={i} className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                  {letter}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: In Progress (Deep Navy) - Restored Vibrant */}
        <div className="bg-[#1A2234] rounded-[1.5rem] p-4 relative overflow-hidden group hover:scale-[1.01] transition-all duration-300 shadow-lg shadow-blue-900/20">
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="flex justify-between items-start mb-6">
            <span className="text-white/80 font-semibold text-sm tracking-tight">{t('dashboard.casesInProgress')}</span>
            <MoreHorizontal size={16} className="text-white/20" />
          </div>

          <div className="flex items-end justify-between relative z-10">
            <div>
              <p className="text-3xl font-bold text-white tracking-tight">{stats.inProgress}</p>
              <p className="text-xs font-medium text-white/50 mt-0.5">{t('dashboard.inProgressShort')}</p>
            </div>
            <Clock size={20} className="text-blue-400" />
          </div>
        </div>

        {/* Card 3: In QC (Glass) - Keep Clean */}
        <div className="glass-card p-4 relative overflow-hidden group hover:scale-[1.01] transition-all duration-300">
          <div className="flex justify-between items-start mb-6">
            <span className="text-neutral-600 font-semibold text-sm tracking-tight">{t('dashboard.casesInQC')}</span>
            <CheckCircle2 size={16} className="text-neutral-400" />
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-neutral-800 tracking-tight">{stats.inQC}</p>
              <p className="text-xs font-medium text-neutral-500 mt-0.5">{t('dashboard.qcShort')}</p>
            </div>
            <div className="h-1.5 w-16 bg-neutral-100 rounded-full overflow-hidden">
              <div className="h-full w-2/3 bg-violet-500 rounded-full" />
            </div>
          </div>
        </div>

        {/* Card 4: New Cases (Brand Teal) - Restored Vibrant */}
        <div className="bg-[#4ECDC4] rounded-[1.5rem] p-4 relative overflow-hidden group hover:scale-[1.01] transition-all duration-300 shadow-lg shadow-teal-500/20">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />

          <div className="flex justify-between items-start mb-6 relative z-10">
            <span className="text-white/90 font-semibold text-sm tracking-tight">{t('dashboard.newCases')}</span>
            <div className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white border border-white/20">
              {stats.received > 0 ? `+${stats.received}` : '0'} {t('dashboard.todayShort')}
            </div>
          </div>

          <div className="flex items-end justify-between relative z-10">
            <div>
              <p className="text-3xl font-bold text-white tracking-tight">{stats.received}</p>
              <p className="text-xs font-medium text-white/80 mt-0.5">{t('dashboard.toAccept')}</p>
            </div>
            <Package size={20} className="text-white/80" />
          </div>
        </div>
      </div>

      {/* Weekly Calendar Strip */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={16} className="text-brand-primary" />
          <h2 className="text-sm font-bold text-neutral-800">Prossime consegne — 7 giorni</h2>
        </div>
        <WeeklyCalendar cases={recentCases} />
      </div>

      {/* Main Content Grid - Compacted */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent Cases - Glass Panel */}
        <div className="lg:col-span-2 glass-card p-4 md:p-5 min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-neutral-800 tracking-tight">{t('dashboard.recentActivity')}</h2>
            </div>
            <Link to="/admin/cases" className="px-3 py-1.5 rounded-full bg-neutral-100/80 text-neutral-600 font-semibold text-xs hover:bg-neutral-200 transition-colors flex items-center gap-1">
              {t('common.viewAll')}
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="space-y-2 flex-1">
            {recentCases && recentCases.length > 0 ? (
              recentCases.map((caseItem) => (
                <Link
                  key={caseItem.id}
                  to={`/admin/cases/${caseItem.id}`}
                  className="flex items-center gap-4 p-3 rounded-2xl bg-white/40 border border-transparent hover:bg-white/80 hover:border-white/50 hover:shadow-sm transition-all duration-200 group"
                >
                  {/* Avatar - Smaller */}
                  <div className={`w-10 h-10 rounded-xl ${caseItem.priority === 'urgent' || caseItem.priority === 'rush' ? 'bg-slate-700' : 'bg-slate-200 text-slate-600'
                    } flex items-center justify-center text-sm font-bold shadow-sm ${caseItem.priority === 'urgent' || caseItem.priority === 'rush' ? 'text-white' : ''
                    }`}>
                    {caseItem.client?.studioName?.charAt(0) || 'C'}
                  </div>

                  {/* Info — Cliente/Paziente primary, work + denti, case number secondary */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-neutral-800 text-sm tracking-tight truncate">{caseItem.client?.studioName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${caseItem.priority === 'urgent' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                          caseItem.priority === 'rush' ? 'bg-slate-800 text-white' :
                            'bg-transparent text-slate-500'
                        }`}>
                        {t(`cases.priorities.${caseItem.priority}`)}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-700 font-medium truncate">{caseItem.patientName || t('common.noData')}</p>
                    <p className="text-[10px] text-neutral-500 truncate">
                      {caseItem.teeth?.[0]?.workType ? t(`dental.workTypes.${caseItem.teeth[0].workType}`, { defaultValue: caseItem.teeth[0].workType }) : t('cases.workLabel')}
                      {caseItem.teeth && caseItem.teeth.length > 0 && (
                        <span className="text-neutral-400"> · {caseItem.teeth.length} {caseItem.teeth.length === 1 ? 'dente' : 'denti'}</span>
                      )}
                      <span className="text-neutral-400 font-mono ml-1.5">#{caseItem.caseNumber || caseItem.id.substring(0, 8)}</span>
                    </p>
                  </div>

                  {/* Status - Minimal Blue/Grey */}
                  <div className="text-right px-2">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${caseItem.status === 'received' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        caseItem.status === 'in_progress' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                          caseItem.status === 'qc' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                            'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                      {t(`cases.statuses.${caseItem.status}`)}
                    </div>
                  </div>

                  {/* Price & Date */}
                  <div className="text-right hidden md:block w-20">
                    <p className="text-sm font-bold text-neutral-700">{caseItem.totalPrice ? `₪${caseItem.totalPrice}` : '-'}</p>
                    <p className="text-[10px] font-semibold text-neutral-400 uppercase">
                      {new Date(caseItem.dueDate).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight size={16} className="text-neutral-300 group-hover:text-neutral-500 transition-colors" />
                </Link>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-neutral-400 text-sm">
                <Package size={32} className="mb-2 opacity-50" />
                <p>{t('dashboard.noRecentCases')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column Layout */}
        <div className="space-y-4 flex flex-col">
          {/* Today's Deliveries List (Glass) */}
          <div className="glass-card p-4 md:p-5 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-neutral-800 text-sm flex items-center gap-2">
                {t('dashboard.deliveriesToday')}
                <span className="w-5 h-5 rounded-full bg-neutral-100 text-neutral-500 text-[10px] flex items-center justify-center border border-neutral-200">
                  {stats.todayDeliveries}
                </span>
              </h3>
            </div>

            <div className="space-y-2">
              {todayDeliveries && todayDeliveries.length > 0 ? (
                todayDeliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="p-3 rounded-xl bg-surface/40 border border-neutral-100/50 hover:bg-white/60 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center text-[9px] font-bold ring-2 ring-white shrink-0">
                        {delivery.client?.studioName?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-xs text-neutral-800 block truncate">{delivery.client?.studioName}</span>
                        <span className="text-[10px] text-neutral-600 block truncate">{delivery.patientName || t('common.noData')}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pl-9">
                      <p className="text-[10px] text-neutral-500 line-clamp-1">
                        {delivery.teeth?.[0]?.workType ? t(`dental.workTypes.${delivery.teeth[0].workType}`, { defaultValue: delivery.teeth[0].workType }) : t('cases.workLabel')}
                        {delivery.teeth && delivery.teeth.length > 0 && (
                          <span className="text-neutral-400"> · {delivery.teeth.length} {delivery.teeth.length === 1 ? 'dente' : 'denti'}</span>
                        )}
                      </p>
                      <p className="text-[9px] text-neutral-400 font-mono">#{delivery.caseNumber || delivery.id.substring(0, 6)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-neutral-400">
                  {t('dashboard.noDeliveriesToday')}
                </div>
              )}
            </div>

            <button className="w-full mt-3 py-2 rounded-xl border border-dashed border-neutral-300 text-neutral-400 font-semibold text-xs hover:border-slate-400 hover:text-slate-600 transition-all">
              {t('dashboard.viewCalendar')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
