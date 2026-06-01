import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n/config';
import { Link } from 'react-router-dom';
import {
 ChevronLeft,
 ChevronRight,
 Plus,
 Clock,
 Package,
 CheckCircle2,
 AlertCircle,
} from 'lucide-react';
import caseService from '../../services/case.service';
import { ClientAvatar } from '@/components/common/ClientAvatar';

type ViewMode = 'week' | 'biweekly' | 'month';

interface Delivery {
 id: string;
 caseNumber: string;
 client: string;
 clientLogoUrl: string | null;
 patient: string;
 type: string;
 material: string;
 teeth: string;
 priority: 'normal' | 'urgent' | 'rush';
 status: 'pending' | 'ready' | 'delivered';
 time?: string;
}

const WEEK_DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function DayDeliveries({ deliveries, dark, max = 3, size = 22 }: { deliveries: Delivery[]; dark?: boolean; max?: number; size?: number }) {
 if (deliveries.length === 0) return null;

 const groups: { client: string; logo: string | null; count: number }[] = [];
 const index = new Map<string, number>();
 for (const d of deliveries) {
 const key = `${d.clientLogoUrl || ''}|${d.client}`;
 const at = index.get(key);
 if (at === undefined) {
 index.set(key, groups.length);
 groups.push({ client: d.client, logo: d.clientLogoUrl, count: 1 });
 } else {
 groups[at].count++;
 }
 }

 const shown = groups.slice(0, max);
 const extra = groups.length - shown.length;

 return (
 <div className="mt-1 flex items-center justify-center gap-1.5 flex-wrap">
 {shown.map((g, i) => (
 <div key={i} className="relative">
 <ClientAvatar
 studioName={g.client}
 logoUrl={g.logo}
 size={size}
 rounded=""
 className={`ring-2 ${dark ? 'ring-white/80' : 'ring-white'} `}
 />
 {g.count > 1 && (
 <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-0.5 bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
 {g.count}
 </span>
 )}
 </div>
 ))}
 {extra > 0 && (
 <span className={`text-[11px] font-bold ${dark ? 'text-white' : 'text-gray-600'}`}>+{extra}</span>
 )}
 </div>
 );
}

export default function CalendarPage() {
 const { t } = useTranslation();
 const [viewMode, setViewMode] = useState<ViewMode>('week');
 const [currentDate, setCurrentDate] = useState(new Date());
 const [selectedDate, setSelectedDate] = useState<string>(formatDateKey(new Date()));
 const [cases, setCases] = useState<any[]>([]);
 const [deliveriesByDate, setDeliveriesByDate] = useState<Record<string, Delivery[]>>({});
 const [loading, setLoading] = useState(true);

 function formatDateKey(date: Date) {
 const year = date.getFullYear();
 const month = String(date.getMonth() + 1).padStart(2, '0');
 const day = String(date.getDate()).padStart(2, '0');
 return `${year}-${month}-${day}`;
 }

 const getWeekStart = (date: Date) => {
 const d = new Date(date);
 const day = d.getDay();
 d.setDate(d.getDate() - day);
 return d;
 };

 const generateWeekDays = () => {
 const weekStart = getWeekStart(currentDate);
 const days = [];
 const numDays = viewMode === 'biweekly' ? 14 : 7;
 for (let i = 0; i < numDays; i++) {
 const d = new Date(weekStart);
 d.setDate(d.getDate() + i);
 days.push(d);
 }
 return days;
 };

 const generateMonthDays = () => {
 const year = currentDate.getFullYear();
 const month = currentDate.getMonth();
 const firstDay = new Date(year, month, 1);
 const lastDay = new Date(year, month + 1, 0);
 const startDate = new Date(firstDay);
 startDate.setDate(startDate.getDate() - firstDay.getDay());
 const endDate = new Date(lastDay);
 endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
 const days = [];
 const currentDay = new Date(startDate);
 while (currentDay <= endDate) {
 days.push(new Date(currentDay));
 currentDay.setDate(currentDay.getDate() + 1);
 }
 return days;
 };

 useEffect(() => {
 const loadCases = async () => {
 try {
 setLoading(true);
 const response = await caseService.getCases({});
 setCases(response);
 const grouped: Record<string, Delivery[]> = {};
 response.forEach((case_: any) => {
 if (!case_.dueDate) return;
 const dueDateStr = case_.dueDate.split('T')[0];
 const [year, month, day] = dueDateStr.split('-');
 const dueDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
 const dateKey = formatDateKey(dueDate);
 const delivery: Delivery = {
 id: case_.id,
 caseNumber: case_.caseNumber,
 client: case_.client?.studioName || t('calendar.unknownClient'),
 clientLogoUrl: case_.client?.logoUrl ?? null,
 patient: case_.patientName || t('common.noData'),
 type: case_.teeth?.[0]?.workType || t('cases.workLabel'),
 material: case_.teeth?.[0]?.material || t('common.noData'),
 teeth: case_.teeth?.map((tooth: any) => tooth.toothNumber).join(', ') || t('common.noData'),
 priority: case_.priority || 'normal',
 status: case_.status === 'shipped' || case_.status === 'delivered' ? 'ready' : 'pending',
 };
 if (!grouped[dateKey]) grouped[dateKey] = [];
 grouped[dateKey].push(delivery);
 });
 setDeliveriesByDate(grouped);
 } catch (error) {
 console.error('Error loading cases:', error);
 } finally {
 setLoading(false);
 }
 };
 loadCases();
 }, []);

 const navigateWeek = (direction: 'prev' | 'next') => {
 const newDate = new Date(currentDate);
 if (viewMode === 'month') {
 newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
 } else {
 newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
 }
 setCurrentDate(newDate);
 };

 const goToToday = () => {
 const today = new Date();
 setCurrentDate(today);
 setSelectedDate(formatDateKey(today));
 };

 const weekDays = generateWeekDays();
 const monthDays = generateMonthDays();
 const selectedDeliveries = deliveriesByDate[selectedDate] || [];

 const getWeekRangeText = () => {
 if (viewMode === 'month') {
 return `${t('calendar.months.' + MONTH_KEYS[currentDate.getMonth()])} ${currentDate.getFullYear()}`;
 }
 const weekStart = weekDays[0];
 const weekEnd = weekDays[weekDays.length - 1];
 const startMonth = t('calendar.months.' + MONTH_KEYS[weekStart.getMonth()]);
 const endMonth = t('calendar.months.' + MONTH_KEYS[weekEnd.getMonth()]);
 if (startMonth === endMonth) {
 return `${weekStart.getDate()} - ${weekEnd.getDate()} ${startMonth} ${weekStart.getFullYear()}`;
 }
 return `${weekStart.getDate()} ${startMonth.slice(0, 3)} - ${weekEnd.getDate()} ${endMonth.slice(0, 3)} ${weekStart.getFullYear()}`;
 };

 const getStatusBadge = (status: Delivery['status']) => {
 switch (status) {
 case 'ready':
 return <span className="badge badge-success flex items-center gap-1"><CheckCircle2 size={12} /> {t('calendar.readyStatus')}</span>;
 case 'delivered':
 return <span className="badge badge-info flex items-center gap-1"><Package size={12} /> {t('cases.statuses.delivered')}</span>;
 default:
 return <span className="badge badge-warning flex items-center gap-1"><Clock size={12} /> {t('calendar.inProgressStatus')}</span>;
 }
 };

 const getPriorityBadge = (priority: Delivery['priority']) => {
 switch (priority) {
 case 'rush':
 return <span className="badge badge-priority-rush">{t('calendar.rushStatus')}</span>;
 case 'urgent':
 return <span className="badge badge-priority-urgent">{t('cases.priorities.urgent')}</span>;
 default:
 return null;
 }
 };

 const isToday = (date: Date) => {
 const today = new Date();
 return date.toDateString() === today.toDateString();
 };

 const isSelected = (date: Date) => {
 return formatDateKey(date) === selectedDate;
 };

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-[400px]">
 <div className="text-center">
 <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
 <p className="text-gray-500">{t('calendar.loadingDeliveries')}</p>
 </div>
 </div>
 );
 }

 return (
 <div className="space-y-6 animate-fade-in">
 {/* Calendar toolbar */}
 <div className="bg-white border border-gray-100/80 p-5">
 <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
 <div className="flex items-center gap-2">
 <button
 onClick={() => navigateWeek('prev')}
 className="w-10 h-10 bg-gray-50 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-all "
 >
 <ChevronLeft size={20} />
 </button>
 <h2 className="text-base sm:text-lg font-semibold text-gray-800 min-w-[170px] sm:min-w-[220px] text-center font-display">
 {getWeekRangeText()}
 </h2>
 <button
 onClick={() => navigateWeek('next')}
 className="w-10 h-10 bg-gray-50 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-all "
 >
 <ChevronRight size={20} />
 </button>
 </div>

 <div className="flex items-center gap-2 flex-wrap">
 <button
 onClick={goToToday}
 className="px-4 py-2.5 bg-gray-50 text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors "
 >
 {t('calendar.today')}
 </button>
 <div className="flex bg-gray-50 p-1">
 <button
 onClick={() => setViewMode('week')}
 className={`px-3 py-1.5 text-sm font-medium transition-all ${
 viewMode === 'week' ? 'bg-white text-gray-800' : 'text-gray-500 hover:text-gray-700'
 }`}
 >
 {t('calendar.week')}
 </button>
 <button
 onClick={() => setViewMode('biweekly')}
 className={`px-3 py-1.5 text-sm font-medium transition-all ${
 viewMode === 'biweekly' ? 'bg-white text-gray-800' : 'text-gray-500 hover:text-gray-700'
 }`}
 >
 {t('calendar.twoWeeks')}
 </button>
 <button
 onClick={() => setViewMode('month')}
 className={`px-3 py-1.5 text-sm font-medium transition-all ${
 viewMode === 'month' ? 'bg-white text-gray-800' : 'text-gray-500 hover:text-gray-700'
 }`}
 >
 {t('calendar.month')}
 </button>
 </div>
 <Link to="/admin/cases/new" className="btn-primary flex items-center gap-2 text-sm">
 <Plus size={16} />
 {t('cases.newCase')}
 </Link>
 </div>
 </div>

 {/* Calendar Views */}
 {viewMode === 'month' ? (
 <div>
 <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
 {WEEK_DAY_KEYS.map((key, i) => (
 <div key={i} className="text-center text-sm font-medium text-gray-500 py-2">
 {t('calendar.weekDays.' + key)}
 </div>
 ))}
 </div>
 <div className="grid grid-cols-7 gap-1 md:gap-2">
 {monthDays.map((date, i) => {
 const dateKey = formatDateKey(date);
 const deliveries = deliveriesByDate[dateKey] || [];
 const dayIsToday = isToday(date);
 const dayIsSelected = isSelected(date);
 const isCurrentMonth = date.getMonth() === currentDate.getMonth();

 return (
 <button
 key={i}
 onClick={() => setSelectedDate(dateKey)}
 className={` md: p-1.5 md:p-3 text-center transition-all min-h-[52px] md:min-h-[80px] ${
 !isCurrentMonth
 ? 'opacity-30 bg-gray-50/50'
 : dayIsSelected
 ? 'bg-blue-600 text-white '
 : dayIsToday
 ? 'bg-gray-50 hover:bg-sky-100'
 : 'bg-gray-50 hover:bg-gray-200'
 }`}
 >
 <p className={`text-sm md:text-lg font-bold mb-1 ${
 dayIsSelected ? 'text-white' : dayIsToday ? 'text-blue-600' : 'text-gray-800'
 }`}>
 {date.getDate()}
 </p>
 <DayDeliveries deliveries={deliveries} dark={dayIsSelected} max={2} size={20} />
 </button>
 );
 })}
 </div>
 </div>
 ) : viewMode === 'biweekly' ? (
 <>
 <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
 {weekDays.slice(0, 7).map((date, i) => {
 const dateKey = formatDateKey(date);
 const deliveries = deliveriesByDate[dateKey] || [];
 const dayIsToday = isToday(date);
 const dayIsSelected = isSelected(date);

 return (
 <button
 key={i}
 onClick={() => setSelectedDate(dateKey)}
 className={` md: p-1.5 md:p-3 text-center transition-all ${
 dayIsSelected
 ? 'bg-blue-600 text-white '
 : dayIsToday
 ? 'bg-gray-50 hover:bg-sky-100'
 : 'bg-gray-50 hover:bg-gray-200'
 }`}
 >
 <p className={`text-xs font-medium mb-1 ${
 dayIsSelected ? 'text-white/80' : 'text-gray-400'
 }`}>
 {t('calendar.weekDays.' + WEEK_DAY_KEYS[date.getDay()])}
 </p>
 <p className={`text-base md:text-xl font-bold ${
 dayIsSelected ? 'text-white' : dayIsToday ? 'text-blue-600' : 'text-gray-800'
 }`}>
 {date.getDate()}
 </p>
 <DayDeliveries deliveries={deliveries} dark={dayIsSelected} max={3} size={26} />
 </button>
 );
 })}
 </div>
 <div className="grid grid-cols-7 gap-1 md:gap-2">
 {weekDays.slice(7, 14).map((date, i) => {
 const dateKey = formatDateKey(date);
 const deliveries = deliveriesByDate[dateKey] || [];
 const dayIsToday = isToday(date);
 const dayIsSelected = isSelected(date);

 return (
 <button
 key={i + 7}
 onClick={() => setSelectedDate(dateKey)}
 className={` md: p-1.5 md:p-3 text-center transition-all ${
 dayIsSelected
 ? 'bg-blue-600 text-white '
 : dayIsToday
 ? 'bg-gray-50 hover:bg-sky-100'
 : 'bg-gray-50 hover:bg-gray-200'
 }`}
 >
 <p className={`text-xs font-medium mb-1 ${
 dayIsSelected ? 'text-white/80' : 'text-gray-400'
 }`}>
 {t('calendar.weekDays.' + WEEK_DAY_KEYS[date.getDay()])}
 </p>
 <p className={`text-base md:text-xl font-bold ${
 dayIsSelected ? 'text-white' : dayIsToday ? 'text-blue-600' : 'text-gray-800'
 }`}>
 {date.getDate()}
 </p>
 <DayDeliveries deliveries={deliveries} dark={dayIsSelected} max={3} size={26} />
 </button>
 );
 })}
 </div>
 </>
 ) : (
 <div className="grid grid-cols-7 gap-2">
 {weekDays.map((date, i) => {
 const dateKey = formatDateKey(date);
 const deliveries = deliveriesByDate[dateKey] || [];
 const dayIsToday = isToday(date);
 const dayIsSelected = isSelected(date);

 return (
 <button
 key={i}
 onClick={() => setSelectedDate(dateKey)}
 className={` p-3 text-center transition-all ${
 dayIsSelected
 ? 'bg-blue-600 text-white '
 : dayIsToday
 ? 'bg-gray-50 hover:bg-sky-100'
 : 'bg-gray-50 hover:bg-gray-200'
 }`}
 >
 <p className={`text-xs font-medium mb-1 ${
 dayIsSelected ? 'text-white/80' : 'text-gray-400'
 }`}>
 {t('calendar.weekDays.' + WEEK_DAY_KEYS[date.getDay()])}
 </p>
 <p className={`text-base md:text-xl font-bold ${
 dayIsSelected ? 'text-white' : dayIsToday ? 'text-blue-600' : 'text-gray-800'
 }`}>
 {date.getDate()}
 </p>
 <DayDeliveries deliveries={deliveries} dark={dayIsSelected} max={3} />
 </button>
 );
 })}
 </div>
 )}
 </div>

 {/* Bottom section */}
 <div className="space-y-6">
 {/* Selected day */}
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <h3 className="text-sm font-semibold text-gray-800 truncate font-display">
 {(() => {
 const loc = ({ it: 'it-IT', en: 'en-US', fr: 'fr-FR', he: 'he-IL' } as Record<string, string>)[i18n.language] || 'it-IT';
 return new Date(selectedDate).toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long' });
 })()}
 </h3>
 <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 shrink-0">
 {selectedDeliveries.length}
 </span>
 </div>

 {selectedDeliveries.length > 0 ? (
 <div className="space-y-3">
 {selectedDeliveries.map((delivery) => (
 <Link
 key={delivery.id}
 to={`/admin/cases/${delivery.id}`}
 className="bg-white border border-gray-100/80 p-4 block hover:-hover transition-all duration-200 group "
 >
 <div className="flex items-center gap-3 mb-1.5">
 <ClientAvatar
 studioName={delivery.client}
 logoUrl={delivery.clientLogoUrl}
 size={36}
 rounded=""
 />
 <div className="flex-1 min-w-0">
 <p className="text-sm font-semibold text-gray-800 truncate">{delivery.client}</p>
 <p className="text-xs text-gray-500 truncate">{delivery.patient}</p>
 </div>
 {getPriorityBadge(delivery.priority)}
 </div>
 <p className="text-xs text-gray-600 pl-12">
 {delivery.type}
 {delivery.material && delivery.material !== t('common.noData') && (
 <span className="text-gray-400"> · {t(`dental.materials.${delivery.material}`, { defaultValue: delivery.material })}</span>
 )}
 {delivery.teeth && delivery.teeth !== t('common.noData') && (
 <span className="text-gray-400"> · {delivery.teeth.split(', ').length} {t('dental.tooth', { count: delivery.teeth.split(', ').length })}</span>
 )}
 </p>
 <p className="text-[10px] font-mono text-gray-400 pl-12 mt-1">#{delivery.caseNumber}</p>
 </Link>
 ))}
 </div>
 ) : (
 <div className="bg-white border border-gray-100/80 p-8 text-center ">
 <div className="w-12 h-12 bg-gray-50 flex items-center justify-center mx-auto mb-3">
 <Package size={22} className="text-gray-300" />
 </div>
 <p className="text-sm text-gray-400 font-medium">Nessuna consegna</p>
 </div>
 )}
 </div>

 {/* Secondary lists */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Upcoming */}
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 font-display">
 <Package size={14} className="text-blue-600" />
 Lavori in uscita
 </h3>
 <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 shrink-0">3gg</span>
 </div>

 <div className="space-y-3">
 {(() => {
 const today = new Date();
 today.setHours(0, 0, 0, 0);
 const threeDaysFromNow = new Date(today);
 threeDaysFromNow.setDate(today.getDate() + 3);
 threeDaysFromNow.setHours(23, 59, 59, 999);

 const upcomingDeliveries = Object.entries(deliveriesByDate)
 .flatMap(([dateKey, deliveries]) =>
 deliveries.map(delivery => ({ ...delivery, dateKey, dueDate: new Date(dateKey) }))
 )
 .filter(delivery => {
 const dueDate = new Date(delivery.dateKey);
 dueDate.setHours(0, 0, 0, 0);
 return dueDate >= today && dueDate <= threeDaysFromNow;
 })
 .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
 .slice(0, 8);

 if (upcomingDeliveries.length === 0) {
 return (
 <div className="bg-white border border-gray-100/80 p-8 text-center ">
 <div className="w-12 h-12 bg-gray-50 flex items-center justify-center mx-auto mb-3">
 <Package size={22} className="text-gray-300" />
 </div>
 <p className="text-sm text-gray-400 font-medium">Nessun lavoro in uscita</p>
 </div>
 );
 }

 return upcomingDeliveries.map((delivery, i) => {
 const dueDate = new Date(delivery.dateKey);
 const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
 let daysText;
 if (daysDiff === 0) daysText = t('common.today');
 else if (daysDiff === 1) daysText = t('common.tomorrow');
 else daysText = t('calendar.inDays', { count: daysDiff });

 return (
 <Link
 key={`${delivery.id}-${i}`}
 to={`/admin/cases/${delivery.id}`}
 className="bg-white border border-gray-100/80 p-4 block hover:-hover transition-all duration-200 group "
 >
 <div className="flex items-center gap-3 mb-1.5">
 <ClientAvatar
 studioName={delivery.client}
 logoUrl={delivery.clientLogoUrl}
 size={36}
 rounded=""
 />
 <div className="flex-1 min-w-0">
 <p className="text-sm font-semibold text-gray-800 truncate">{delivery.client}</p>
 <p className="text-xs text-gray-500 truncate">{delivery.patient}</p>
 </div>
 <span className={`text-[10px] font-semibold px-2 py-1 shrink-0 ${
 daysDiff === 0 ? 'bg-red-50 text-red-700' : daysDiff === 1 ? 'bg-gray-50 text-amber-700' : 'bg-gray-100 text-gray-600'
 }`}>{daysText}</span>
 </div>
 <p className="text-xs text-gray-600 pl-12">
 {delivery.type}
 {delivery.material && delivery.material !== t('common.noData') && (
 <span className="text-gray-400"> · {t(`dental.materials.${delivery.material}`, { defaultValue: delivery.material })}</span>
 )}
 {delivery.teeth && delivery.teeth !== t('common.noData') && (
 <span className="text-gray-400"> · {delivery.teeth.split(', ').length}d</span>
 )}
 </p>
 <p className="text-[10px] font-mono text-gray-400 pl-12 mt-1">#{delivery.caseNumber}</p>
 </Link>
 );
 });
 })()}
 </div>
 </div>

 {/* Undated cases */}
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 font-display">
 <AlertCircle size={14} className="text-orange-500" />
 Senza data
 </h3>
 <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 shrink-0">
 {cases.filter((c: any) => !c.dueDate).length}
 </span>
 </div>

 <div className="space-y-3">
 {(() => {
 const today = new Date();
 today.setHours(0, 0, 0, 0);
 const undatedCases = cases
 .filter((c: any) => !c.dueDate)
 .map((c: any) => {
 const receivedDate = c.receivedDate ? new Date(c.receivedDate) : new Date(c.createdAt);
 receivedDate.setHours(0, 0, 0, 0);
 const daysSince = Math.max(0, Math.floor((today.getTime() - receivedDate.getTime()) / (1000 * 60 * 60 * 24)));
 return {
 id: c.id,
 caseNumber: c.caseNumber,
 client: c.client?.studioName || t('calendar.unknownClient'),
 clientLogoUrl: c.client?.logoUrl ?? null,
 patient: c.patientName || t('common.noData'),
 type: c.teeth?.[0]?.workType || t('cases.workLabel'),
 material: c.teeth?.[0]?.material,
 teethCount: c.teeth?.length || 0,
 priority: c.priority || 'normal',
 daysSince,
 };
 })
 .sort((a: any, b: any) => b.daysSince - a.daysSince)
 .slice(0, 8);

 if (undatedCases.length === 0) {
 return (
 <div className="bg-white border border-gray-100/80 p-8 text-center ">
 <div className="w-12 h-12 bg-gray-50 flex items-center justify-center mx-auto mb-3">
 <AlertCircle size={22} className="text-gray-300" />
 </div>
 <p className="text-sm text-gray-400 font-medium">{t('common.noResults')}</p>
 </div>
 );
 }

 return undatedCases.map((c: any) => (
 <Link
 key={c.id}
 to={`/admin/cases/${c.id}`}
 className="bg-white border border-gray-100/80 p-4 block hover:-hover transition-all duration-200 group "
 >
 <div className="flex items-center gap-3 mb-1.5">
 <ClientAvatar
 studioName={c.client}
 logoUrl={c.clientLogoUrl}
 size={36}
 rounded=""
 />
 <div className="flex-1 min-w-0">
 <p className="text-sm font-semibold text-gray-800 truncate">{c.client}</p>
 <p className="text-xs text-gray-500 truncate">{c.patient}</p>
 </div>
 <span className={`text-[10px] font-semibold px-2 py-1 shrink-0 ${
 c.daysSince >= 7 ? 'bg-red-50 text-red-700' : c.daysSince >= 3 ? 'bg-gray-50 text-amber-700' : 'bg-gray-100 text-gray-600'
 }`}>
 {c.daysSince === 0 ? 'oggi' : `${c.daysSince}g`}
 </span>
 </div>
 <p className="text-xs text-gray-600 pl-12">
 {t(`dental.workTypes.${c.type}`, { defaultValue: c.type })}
 {c.material && (
 <span className="text-gray-400"> · {t(`dental.materials.${c.material}`, { defaultValue: c.material })}</span>
 )}
 {c.teethCount > 0 && (
 <span className="text-gray-400"> · {c.teethCount}d</span>
 )}
 </p>
 <p className="text-[10px] font-mono text-gray-400 pl-12 mt-1">#{c.caseNumber}</p>
 </Link>
 ));
 })()}
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
