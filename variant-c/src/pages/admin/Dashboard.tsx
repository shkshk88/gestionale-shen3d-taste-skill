import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
 Package,
 Clock,
 CheckCircle2,
 ArrowRight,
 ChevronRight,
 Loader2,
 Calendar,
 Plus,
 Sparkles,
 Truck,
} from 'lucide-react';
import { useToast } from '../../components/ui/use-toast';
import caseService, { Case, CaseStatistics } from '../../services/case.service';
import { getDateLocale } from '@/utils/locale';

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
 className={`min-w-[110px] flex-1 p-2 border transition-colors ${
 isToday
 ? 'bg-gray-50 border-sky-200'
 : 'bg-white border-gray-100'
 }`}
 >
 <div className="text-center mb-2">
 <p className={`text-[10px] font-bold uppercase ${isToday ? 'text-blue-600' : 'text-gray-400'}`}>
 {isToday ? t('calendar.today') : dayNames[day.date.getDay()]}
 </p>
 <p className={`text-lg font-bold leading-tight ${isToday ? 'text-sky-700' : 'text-gray-700'}`}>
 {day.date.getDate()}
 </p>
 </div>
 <div className="space-y-1">
 {day.cases.length === 0 ? (
 <p className="text-[10px] text-gray-300 text-center py-1">-</p>
 ) : (
 day.cases.slice(0, 2).map((c) => {
 const firstTooth = c.teeth?.[0];
 const materialKey = firstTooth?.material;
 const teethCount = c.teeth?.length || 0;
 return (
 <Link
 key={c.id}
 to={`/admin/cases/${c.id}`}
 className="block bg-white px-1.5 py-1 hover:bg-gray-50 transition-colors border border-gray-50"
 title={`${c.client?.studioName || ''} · ${c.patientName || 'N/A'} · #${c.caseNumber}`}
 >
 <p className="text-[10px] font-semibold text-gray-800 truncate leading-tight">{c.client?.studioName || '-'}</p>
 <p className="text-[9px] text-gray-600 truncate leading-tight">{c.patientName || t('common.noData')}</p>
 <p className="text-[9px] text-gray-500 truncate leading-tight">
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
 <p className="text-[10px] text-gray-400 text-center">
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
 <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
 </div>
 );
 }

 return (
 <div className="space-y-5 animate-scale-in pb-6">
 {/* Stats Row — Unified card-base, clean color accents */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
 {/* Card 1: Today Deliveries — Sky accent */}
 <div className="card-base p-4 relative overflow-hidden group hover:scale-[1.01] transition-all duration-200">
 <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-l-2xl" />
 <div className="flex justify-between items-start mb-4 pl-2">
 <span className="text-gray-500 font-semibold text-sm tracking-tight">{t('dashboard.todayDeliveries')}</span>
 <div className="w-8 h-8 bg-gray-50 flex items-center justify-center">
 <Truck size={16} className="text-blue-600" />
 </div>
 </div>
 <div className="flex items-end justify-between pl-2">
 <div>
 <p className="text-3xl font-bold text-gray-800 tracking-tight font-display">{stats.todayDeliveries}</p>
 <p className="text-xs font-medium text-gray-400 mt-0.5">{t('dashboard.casesToShipShort')}</p>
 </div>
 </div>
 </div>

 {/* Card 2: In Progress — Slate accent */}
 <div className="card-base p-4 relative overflow-hidden group hover:scale-[1.01] transition-all duration-200">
 <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-800 rounded-l-2xl" />
 <div className="flex justify-between items-start mb-4 pl-2">
 <span className="text-gray-500 font-semibold text-sm tracking-tight">{t('dashboard.casesInProgress')}</span>
 <div className="w-8 h-8 bg-gray-100 flex items-center justify-center">
 <Clock size={16} className="text-gray-700" />
 </div>
 </div>
 <div className="flex items-end justify-between pl-2">
 <div>
 <p className="text-3xl font-bold text-gray-800 tracking-tight font-display">{stats.inProgress}</p>
 <p className="text-xs font-medium text-gray-400 mt-0.5">{t('dashboard.inProgressShort')}</p>
 </div>
 </div>
 </div>

 {/* Card 3: In QC — Teal accent */}
 <div className="card-base p-4 relative overflow-hidden group hover:scale-[1.01] transition-all duration-200">
 <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-2xl" />
 <div className="flex justify-between items-start mb-4 pl-2">
 <span className="text-gray-500 font-semibold text-sm tracking-tight">{t('dashboard.casesInQC')}</span>
 <div className="w-8 h-8 bg-gray-50 flex items-center justify-center">
 <CheckCircle2 size={16} className="text-blue-600" />
 </div>
 </div>
 <div className="flex items-end justify-between pl-2">
 <div>
 <p className="text-3xl font-bold text-gray-800 tracking-tight font-display">{stats.inQC}</p>
 <p className="text-xs font-medium text-gray-400 mt-0.5">{t('dashboard.qcShort')}</p>
 </div>
 </div>
 </div>

 {/* Card 4: New Cases — Sky accent */}
 <div className="card-base p-4 relative overflow-hidden group hover:scale-[1.01] transition-all duration-200">
 <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-l-2xl" />
 <div className="flex justify-between items-start mb-4 pl-2">
 <span className="text-gray-500 font-semibold text-sm tracking-tight">{t('dashboard.newCases')}</span>
 <div className="w-8 h-8 bg-gray-50 flex items-center justify-center">
 <Package size={16} className="text-blue-600" />
 </div>
 </div>
 <div className="flex items-end justify-between pl-2">
 <div>
 <p className="text-3xl font-bold text-gray-800 tracking-tight font-display">{stats.received}</p>
 <p className="text-xs font-medium text-gray-400 mt-0.5">{t('dashboard.toAccept')}</p>
 </div>
 <div className="px-2 py-0.5 bg-gray-50 text-[10px] font-bold text-sky-700 border border-sky-100">
 {stats.received > 0 ? `+${stats.received}` : '0'} {t('dashboard.todayShort')}
 </div>
 </div>
 </div>
 </div>

 {/* Quick Actions */}
 <div className="grid grid-cols-2 gap-3">
 <Link
 to="/admin/cases/new"
 className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white text-sm font-semibold hover:-hover hover:bg-sky-700 transition-all duration-200"
 >
 <Plus size={18} />
 {t('dashboard.createCase', 'Nuovo Caso')}
 </Link>
 <Link
 to="/admin/import-vision"
 className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white text-sm font-semibold hover:-hover hover:bg-blue-600 transition-all duration-200"
 >
 <Sparkles size={18} />
 {t('cases.importFromPhoto', 'Importa da foto')}
 </Link>
 </div>

 {/* Weekly Calendar Strip */}
 <div className="card-base p-4 md:p-5">
 <div className="flex items-center gap-2 mb-3">
 <Calendar size={16} className="text-blue-600" />
 <h2 className="text-sm font-bold text-gray-800">{t('dashboard.upcomingDeliveries7Days')}</h2>
 </div>
 <WeeklyCalendar cases={recentCases} />
 </div>

 {/* Main Content Grid */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
 {/* Recent Cases */}
 <div className="lg:col-span-2 card-base p-4 md:p-5 min-h-[400px] flex flex-col">
 <div className="flex items-center justify-between mb-4">
 <div>
 <h2 className="text-lg font-bold text-gray-800 tracking-tight font-display">{t('dashboard.recentActivity')}</h2>
 </div>
 <Link to="/admin/cases" className="px-3 py-1.5 bg-gray-100 text-gray-600 font-semibold text-xs hover:bg-gray-200 transition-colors flex items-center gap-1">
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
 className="flex items-center gap-4 p-3 bg-gray-50/50 border border-transparent hover:bg-white hover:border-gray-100 hover: transition-all duration-200 group"
 >
 {/* Avatar */}
 <div className={`w-10 h-10 flex items-center justify-center text-sm font-bold shrink-0 ${
 caseItem.priority === 'urgent' || caseItem.priority === 'rush'
 ? 'bg-gray-800 text-white'
 : 'bg-gray-200 text-gray-600'
 }`}>
 {caseItem.client?.studioName?.charAt(0) || 'C'}
 </div>

 {/* Info */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-0.5">
 <span className="font-semibold text-gray-800 text-sm tracking-tight truncate">{caseItem.client?.studioName}</span>
 <span className={`px-2 py-0.5 text-[10px] font-semibold shrink-0 border ${
 caseItem.priority === 'urgent'
 ? 'bg-gray-100 text-gray-700 border-gray-200'
 : caseItem.priority === 'rush'
 ? 'bg-gray-800 text-white border-gray-800'
 : 'bg-transparent text-gray-500 border-transparent'
 }`}>
 {t(`cases.priorities.${caseItem.priority}`)}
 </span>
 </div>
 <p className="text-xs text-gray-700 font-medium truncate">{caseItem.patientName || t('common.noData')}</p>
 <p className="text-[10px] text-gray-500 truncate">
 {caseItem.teeth?.[0]?.workType ? t(`dental.workTypes.${caseItem.teeth[0].workType}`, { defaultValue: caseItem.teeth[0].workType }) : t('cases.workLabel')}
 {caseItem.teeth && caseItem.teeth.length > 0 && (
 <span className="text-gray-400"> · {caseItem.teeth.length} {t('dental.tooth', { count: caseItem.teeth.length })}</span>
 )}
 <span className="text-gray-400 font-mono ml-1.5">#{caseItem.caseNumber || caseItem.id.substring(0, 8)}</span>
 </p>
 </div>

 {/* Status */}
 <div className="text-right px-2">
 <div className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-semibold border ${
 caseItem.status === 'received'
 ? 'bg-gray-50 text-sky-700 border-sky-100'
 : caseItem.status === 'in_progress'
 ? 'bg-gray-50 text-gray-700 border-gray-200'
 : caseItem.status === 'qc'
 ? 'bg-gray-50 text-teal-700 border-teal-100'
 : 'bg-gray-50 text-emerald-700 border-emerald-100'
 }`}>
 {t(`cases.statuses.${caseItem.status}`)}
 </div>
 </div>

 {/* Price & Date */}
 <div className="text-right hidden md:block w-20">
 <p className="text-sm font-bold text-gray-700">{caseItem.totalPrice ? `₪${caseItem.totalPrice}` : '-'}</p>
 <p className="text-[10px] font-semibold text-gray-400 uppercase">
 {caseItem.dueDate ? new Date(caseItem.dueDate).toLocaleDateString(getDateLocale(), { day: '2-digit', month: 'short' }) : '-'}
 </p>
 </div>

 {/* Arrow */}
 <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
 </Link>
 ))
 ) : (
 <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm">
 <Package size={32} className="mb-2 opacity-50" />
 <p>{t('dashboard.noRecentCases')}</p>
 </div>
 )}
 </div>
 </div>

 {/* Right Column */}
 <div className="space-y-4 flex flex-col">
 {/* Today's Deliveries */}
 <div className="card-base p-4 md:p-5 flex-1">
 <div className="flex items-center justify-between mb-4">
 <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
 {t('dashboard.deliveriesToday')}
 <span className="w-5 h-5 bg-gray-100 text-gray-500 text-[10px] flex items-center justify-center border border-gray-200">
 {stats.todayDeliveries}
 </span>
 </h3>
 </div>

 <div className="space-y-2">
 {todayDeliveries && todayDeliveries.length > 0 ? (
 todayDeliveries.map((delivery) => (
 <div
 key={delivery.id}
 className="p-3 bg-gray-50/60 border border-gray-100 hover:bg-white hover: transition-all duration-200"
 >
 <div className="flex items-center gap-3 mb-1">
 <div className="w-6 h-6 bg-gray-800 text-white flex items-center justify-center text-[9px] font-bold ring-2 ring-white shrink-0">
 {delivery.client?.studioName?.charAt(0)}
 </div>
 <div className="flex-1 min-w-0">
 <span className="font-semibold text-xs text-gray-800 block truncate">{delivery.client?.studioName}</span>
 <span className="text-[10px] text-gray-600 block truncate">{delivery.patientName || t('common.noData')}</span>
 </div>
 </div>
 <div className="flex items-center justify-between pl-9">
 <p className="text-[10px] text-gray-500 line-clamp-1">
 {delivery.teeth?.[0]?.workType ? t(`dental.workTypes.${delivery.teeth[0].workType}`, { defaultValue: delivery.teeth[0].workType }) : t('cases.workLabel')}
 {delivery.teeth && delivery.teeth.length > 0 && (
 <span className="text-gray-400"> · {delivery.teeth.length} {t('dental.tooth', { count: delivery.teeth.length })}</span>
 )}
 </p>
 <p className="text-[9px] text-gray-400 font-mono">#{delivery.caseNumber || delivery.id.substring(0, 6)}</p>
 </div>
 </div>
 ))
 ) : (
 <div className="text-center py-4 text-xs text-gray-400">
 {t('dashboard.noDeliveriesToday')}
 </div>
 )}
 </div>

 <button className="w-full mt-3 py-2 border border-dashed border-gray-300 text-gray-400 font-semibold text-xs hover:border-slate-400 hover:text-gray-600 transition-all">
 {t('dashboard.viewCalendar')}
 </button>
 </div>
 </div>
 </div>
 </div>
 );
}
