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
  AlertCircle
} from 'lucide-react';
import caseService from '../../services/case.service';
import { ClientAvatar } from '@/components/common/ClientAvatar';

type ViewMode = 'week' | 'biweekly' | 'month';

interface Delivery {
  id: string; // UUID for routing
  caseNumber: string; // Display case number (LAB-2025-0001)
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

// Day-cell content: one avatar per client (logo or initials). If a client has more
// than one case that day, show a count badge on the avatar instead of duplicating it.
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
            rounded="rounded-full"
            className={`ring-2 ${dark ? 'ring-white/80' : 'ring-white'} shadow-sm`}
          />
          {g.count > 1 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-0.5 rounded-full bg-brand-primary text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
              {g.count}
            </span>
          )}
        </div>
      ))}
      {extra > 0 && (
        <span className={`text-[11px] font-bold ${dark ? 'text-white' : 'text-neutral-600'}`}>+{extra}</span>
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

  // Format date for lookup (moved up so it can be used in initial state)
  // Use local date components to avoid timezone issues
  function formatDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Get week start (Sunday)
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
  };

  // Generate week days (7 for week, 14 for biweekly)
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

  // Generate month days (for calendar grid view)
  const generateMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of month
    const firstDay = new Date(year, month, 1);
    // Last day of month
    const lastDay = new Date(year, month + 1, 0);

    // Start from the Sunday of the week containing the 1st
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // End on the Saturday of the week containing the last day
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

  // Load cases from backend
  useEffect(() => {
    const loadCases = async () => {
      try {
        setLoading(true);
        const response = await caseService.getCases({});
        setCases(response);

        // Group cases by due date
        const grouped: Record<string, Delivery[]> = {};
        const casesData = response;

        casesData.forEach((case_: any, index: number) => {
          // Skip cases without a due date — they don't belong to any calendar day
          if (!case_.dueDate) return;

          // Extract date string directly to avoid timezone conversion issues
          const dueDateStr = case_.dueDate.split('T')[0]; // "2025-01-28"
          const [year, month, day] = dueDateStr.split('-');
          const dueDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          const dateKey = formatDateKey(dueDate);

          // Map case to delivery format
          const delivery: Delivery = {
            id: case_.id, // Use UUID for routing (consistent with Orders page)
            caseNumber: case_.caseNumber, // Display case number
            client: case_.client?.studioName || t('calendar.unknownClient'),
            clientLogoUrl: case_.client?.logoUrl ?? null,
            patient: case_.patientName || t('common.noData'),
            type: case_.teeth?.[0]?.workType || t('cases.workLabel'),
            material: case_.teeth?.[0]?.material || t('common.noData'),
            teeth: case_.teeth?.map((tooth: any) => tooth.toothNumber).join(', ') || t('common.noData'),
            priority: case_.priority || 'normal',
            status: case_.status === 'shipped' || case_.status === 'delivered' ? 'ready' : 'pending',
          };

          if (!grouped[dateKey]) {
            grouped[dateKey] = [];
          }
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

  // Navigate week/month
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);

    if (viewMode === 'month') {
      // Move by 1 month
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else {
      // Move by 1 week (both for week and biweekly views)
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    }

    setCurrentDate(newDate);
  };

  // Go to today
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(formatDateKey(today));
  };

  const weekDays = generateWeekDays();
  const monthDays = generateMonthDays();
  const selectedDeliveries = deliveriesByDate[selectedDate] || [];

  // Get week/month range text
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

  // Get status badge
  const getStatusBadge = (status: Delivery['status']) => {
    switch (status) {
      case 'ready':
        return <span className="badge-success flex items-center gap-1"><CheckCircle2 size={12} /> {t('calendar.readyStatus')}</span>;
      case 'delivered':
        return <span className="badge-info flex items-center gap-1"><Package size={12} /> {t('cases.statuses.delivered')}</span>;
      default:
        return <span className="badge-warning flex items-center gap-1"><Clock size={12} /> {t('calendar.inProgressStatus')}</span>;
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority: Delivery['priority']) => {
    switch (priority) {
      case 'rush':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">{t('calendar.rushStatus')}</span>;
      case 'urgent':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">{t('cases.priorities.urgent')}</span>;
      default:
        return null;
    }
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is selected
  const isSelected = (date: Date) => {
    return formatDateKey(date) === selectedDate;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-neutral-500">{t('calendar.loadingDeliveries')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Calendar toolbar + navigation — merged into a single row so the grid rises */}
      <div className="card-base p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          {/* Left: prev / range / next */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateWeek('prev')}
              className="w-9 h-9 rounded-xl bg-surface-secondary flex items-center justify-center text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-base sm:text-lg font-semibold text-neutral-800 min-w-[170px] sm:min-w-[220px] text-center">
              {getWeekRangeText()}
            </h2>
            <button
              onClick={() => navigateWeek('next')}
              className="w-9 h-9 rounded-xl bg-surface-secondary flex items-center justify-center text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Right: today + view toggle + new case */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={goToToday}
              className="px-3 py-2 bg-surface-secondary rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-200 transition-colors"
            >
              {t('calendar.today')}
            </button>
            <div className="flex bg-surface-secondary rounded-xl p-1">
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'week' ? 'bg-white shadow-soft text-neutral-800' : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {t('calendar.week')}
              </button>
              <button
                onClick={() => setViewMode('biweekly')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'biweekly' ? 'bg-white shadow-soft text-neutral-800' : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {t('calendar.twoWeeks')}
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'month' ? 'bg-white shadow-soft text-neutral-800' : 'text-neutral-500 hover:text-neutral-700'
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
          /* Month View - Calendar Grid */
          <div>
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
              {WEEK_DAY_KEYS.map((key, i) => (
                <div key={i} className="text-center text-sm font-medium text-neutral-500 py-2">
                  {t('calendar.weekDays.' + key)}
                </div>
              ))}
            </div>
            {/* Month Days Grid */}
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
                    className={`rounded-xl md:rounded-2xl p-1.5 md:p-3 text-center transition-all min-h-[52px] md:min-h-[80px] ${
                      !isCurrentMonth
                        ? 'opacity-30 bg-surface-secondary/50'
                        : dayIsSelected
                        ? 'bg-brand-primary text-white shadow-card'
                        : dayIsToday
                        ? 'bg-brand-primary/10 hover:bg-brand-primary/20'
                        : 'bg-surface-secondary hover:bg-neutral-200'
                    }`}
                  >
                    <p className={`text-sm md:text-lg font-bold mb-1 ${
                      dayIsSelected ? 'text-white' : dayIsToday ? 'text-brand-primary' : 'text-neutral-800'
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
            {/* First Week */}
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
                    className={`rounded-xl md:rounded-2xl p-1.5 md:p-3 text-center transition-all ${
                      dayIsSelected
                        ? 'bg-brand-primary text-white shadow-card'
                        : dayIsToday
                        ? 'bg-brand-primary/10 hover:bg-brand-primary/20'
                        : 'bg-surface-secondary hover:bg-neutral-200'
                    }`}
                  >
                    <p className={`text-xs font-medium mb-1 ${
                      dayIsSelected ? 'text-white/80' : 'text-neutral-400'
                    }`}>
                      {t('calendar.weekDays.' + WEEK_DAY_KEYS[date.getDay()])}
                    </p>
                    <p className={`text-base md:text-xl font-bold ${
                      dayIsSelected ? 'text-white' : dayIsToday ? 'text-brand-primary' : 'text-neutral-800'
                    }`}>
                      {date.getDate()}
                    </p>
                    <DayDeliveries deliveries={deliveries} dark={dayIsSelected} max={3} size={26} />
                  </button>
                );
              })}
            </div>
            {/* Second Week */}
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
                    className={`rounded-xl md:rounded-2xl p-1.5 md:p-3 text-center transition-all ${
                      dayIsSelected
                        ? 'bg-brand-primary text-white shadow-card'
                        : dayIsToday
                        ? 'bg-brand-primary/10 hover:bg-brand-primary/20'
                        : 'bg-surface-secondary hover:bg-neutral-200'
                    }`}
                  >
                    <p className={`text-xs font-medium mb-1 ${
                      dayIsSelected ? 'text-white/80' : 'text-neutral-400'
                    }`}>
                      {t('calendar.weekDays.' + WEEK_DAY_KEYS[date.getDay()])}
                    </p>
                    <p className={`text-base md:text-xl font-bold ${
                      dayIsSelected ? 'text-white' : dayIsToday ? 'text-brand-primary' : 'text-neutral-800'
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
            {/* Day Headers */}
            {weekDays.map((date, i) => {
            const dateKey = formatDateKey(date);
            const deliveries = deliveriesByDate[dateKey] || [];
            const dayIsToday = isToday(date);
            const dayIsSelected = isSelected(date);

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(dateKey)}
                className={`rounded-2xl p-3 text-center transition-all ${
                  dayIsSelected
                    ? 'bg-brand-primary text-white shadow-card'
                    : dayIsToday
                    ? 'bg-brand-primary/10 hover:bg-brand-primary/20'
                    : 'bg-surface-secondary hover:bg-neutral-200'
                }`}
              >
                <p className={`text-xs font-medium mb-1 ${
                  dayIsSelected ? 'text-white/80' : 'text-neutral-400'
                }`}>
                  {t('calendar.weekDays.' + WEEK_DAY_KEYS[date.getDay()])}
                </p>
                <p className={`text-base md:text-xl font-bold ${
                  dayIsSelected ? 'text-white' : dayIsToday ? 'text-brand-primary' : 'text-neutral-800'
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

      {/* Bottom section: selected day prominent, then two secondary lists */}
      <div className="space-y-4">
        {/* Selected day — full width, primary focus */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-800 truncate">
              {(() => {
                const loc = ({ it: 'it-IT', en: 'en-US', fr: 'fr-FR', he: 'he-IL' } as Record<string, string>)[i18n.language] || 'it-IT';
                return new Date(selectedDate).toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long' });
              })()}
            </h3>
            <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full shrink-0">
              {selectedDeliveries.length}
            </span>
          </div>

          {selectedDeliveries.length > 0 ? (
            <div className="space-y-2">
              {selectedDeliveries.map((delivery) => (
                <Link
                  key={delivery.id}
                  to={`/admin/cases/${delivery.id}`}
                  className="card-base p-3 block hover:shadow-card-hover transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ClientAvatar
                      studioName={delivery.client}
                      logoUrl={delivery.clientLogoUrl}
                      size={32}
                      rounded="rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-800 truncate">{delivery.client}</p>
                      <p className="text-xs text-neutral-600 truncate">{delivery.patient}</p>
                    </div>
                    {getPriorityBadge(delivery.priority)}
                  </div>
                  <p className="text-xs text-neutral-600 pl-10">
                    {delivery.type}
                    {delivery.material && delivery.material !== t('common.noData') && (
                      <span className="text-neutral-400"> · {t(`dental.materials.${delivery.material}`, { defaultValue: delivery.material })}</span>
                    )}
                    {delivery.teeth && delivery.teeth !== t('common.noData') && (
                      <span className="text-neutral-400"> · {delivery.teeth.split(', ').length} {t('dental.tooth', { count: delivery.teeth.split(', ').length })}</span>
                    )}
                  </p>
                  <p className="text-[10px] font-mono text-neutral-400 pl-10 mt-0.5">#{delivery.caseNumber}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card-base p-6 text-center">
              <Package size={20} className="text-neutral-300 mx-auto mb-2" />
              <p className="text-xs text-neutral-400">Nessuna consegna</p>
            </div>
          )}
        </div>

        {/* Secondary lists: upcoming (3 days) + undated, side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* COL 2 — Lavori in uscita (prossimi 3 giorni) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-800 flex items-center gap-2">
              <Package size={14} className="text-brand-primary" />
              Lavori in uscita
            </h3>
            <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full shrink-0">3gg</span>
          </div>

          <div className="space-y-2">
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
                  <div className="card-base p-6 text-center">
                    <Package size={20} className="text-neutral-300 mx-auto mb-2" />
                    <p className="text-xs text-neutral-400">Nessun lavoro in uscita</p>
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
                    className="card-base p-3 block hover:shadow-card-hover transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <ClientAvatar
                        studioName={delivery.client}
                        logoUrl={delivery.clientLogoUrl}
                        size={32}
                        rounded="rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-800 truncate">{delivery.client}</p>
                        <p className="text-xs text-neutral-600 truncate">{delivery.patient}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                        daysDiff === 0 ? 'bg-red-100 text-red-700' : daysDiff === 1 ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-600'
                      }`}>{daysText}</span>
                    </div>
                    <p className="text-xs text-neutral-600 pl-10">
                      {delivery.type}
                      {delivery.material && delivery.material !== t('common.noData') && (
                        <span className="text-neutral-400"> · {t(`dental.materials.${delivery.material}`, { defaultValue: delivery.material })}</span>
                      )}
                      {delivery.teeth && delivery.teeth !== t('common.noData') && (
                        <span className="text-neutral-400"> · {delivery.teeth.split(', ').length}d</span>
                      )}
                    </p>
                    <p className="text-[10px] font-mono text-neutral-400 pl-10 mt-0.5">#{delivery.caseNumber}</p>
                  </Link>
                );
              });
            })()}
          </div>
        </div>

        {/* COL 3 — Casi senza data di consegna */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-800 flex items-center gap-2">
              <AlertCircle size={14} className="text-amber-500" />
              Senza data
            </h3>
            <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full shrink-0">
              {cases.filter((c: any) => !c.dueDate).length}
            </span>
          </div>

          <div className="space-y-2">
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
                  <div className="card-base p-6 text-center">
                    <AlertCircle size={20} className="text-neutral-300 mx-auto mb-2" />
                    <p className="text-xs text-neutral-400">{t('common.noResults')}</p>
                  </div>
                );
              }

              return undatedCases.map((c: any) => (
                <Link
                  key={c.id}
                  to={`/admin/cases/${c.id}`}
                  className="card-base p-3 block hover:shadow-card-hover transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ClientAvatar
                      studioName={c.client}
                      logoUrl={c.clientLogoUrl}
                      size={32}
                      rounded="rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-800 truncate">{c.client}</p>
                      <p className="text-xs text-neutral-600 truncate">{c.patient}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                      c.daysSince >= 7 ? 'bg-red-100 text-red-700' : c.daysSince >= 3 ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {c.daysSince === 0 ? 'oggi' : `${c.daysSince}g`}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 pl-10">
                    {t(`dental.workTypes.${c.type}`, { defaultValue: c.type })}
                    {c.material && (
                      <span className="text-neutral-400"> · {t(`dental.materials.${c.material}`, { defaultValue: c.material })}</span>
                    )}
                    {c.teethCount > 0 && (
                      <span className="text-neutral-400"> · {c.teethCount}d</span>
                    )}
                  </p>
                  <p className="text-[10px] font-mono text-neutral-400 pl-10 mt-0.5">#{c.caseNumber}</p>
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
