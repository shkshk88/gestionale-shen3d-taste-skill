import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  Package,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight
} from 'lucide-react';
import caseService from '../../services/case.service';

type ViewMode = 'week' | 'biweekly' | 'month';

interface Delivery {
  id: string; // UUID for routing
  caseNumber: string; // Display case number (LAB-2025-0001)
  client: string;
  clientAvatar: string;
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

// Avatar colors for clients (will cycle through)
const AVATAR_COLORS = ['bg-card-yellow', 'bg-card-teal', 'bg-card-navy', 'bg-card-olive', 'bg-card-rose'];

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

          // Get client avatar color (cycle through colors)
          const colorIndex = case_.client?.id ?
            case_.client.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % AVATAR_COLORS.length :
            index % AVATAR_COLORS.length;

          // Map case to delivery format
          const delivery: Delivery = {
            id: case_.id, // Use UUID for routing (consistent with Orders page)
            caseNumber: case_.caseNumber, // Display case number
            client: case_.client?.studioName || t('calendar.unknownClient'),
            clientAvatar: AVATAR_COLORS[colorIndex],
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-neutral-800">{t('calendar.title')}</h1>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-surface-secondary rounded-xl p-1">
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'week'
                  ? 'bg-white shadow-soft text-neutral-800'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {t('calendar.week')}
            </button>
            <button
              onClick={() => setViewMode('biweekly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'biweekly'
                  ? 'bg-white shadow-soft text-neutral-800'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {t('calendar.twoWeeks')}
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'month'
                  ? 'bg-white shadow-soft text-neutral-800'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {t('calendar.month')}
            </button>
          </div>
          <Link to="/admin/cases/new" className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            {t('cases.newCase')}
          </Link>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="card-base p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateWeek('prev')}
              className="w-10 h-10 rounded-xl bg-surface-secondary flex items-center justify-center text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-semibold text-neutral-800 min-w-[240px] text-center">
              {getWeekRangeText()}
            </h2>
            <button
              onClick={() => navigateWeek('next')}
              className="w-10 h-10 rounded-xl bg-surface-secondary flex items-center justify-center text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-surface-secondary rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-200 transition-colors"
          >
            {t('calendar.today')}
          </button>
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
                    {deliveries.length > 0 && (
                      <div className="mt-1 flex flex-col gap-0.5">
                        {deliveries.slice(0, 2).map((delivery, idx) => (
                          <div
                            key={idx}
                            className={`w-full h-1 rounded-full ${
                              delivery.priority === 'rush'
                                ? 'bg-red-500'
                                : delivery.priority === 'urgent'
                                ? 'bg-amber-500'
                                : dayIsSelected ? 'bg-white/60' : 'bg-brand-primary'
                            }`}
                          />
                        ))}
                        {deliveries.length > 2 && (
                          <p className={`text-xs font-medium mt-0.5 ${
                            dayIsSelected ? 'text-white/80' : 'text-neutral-400'
                          }`}>
                            +{deliveries.length - 2}
                          </p>
                        )}
                      </div>
                    )}
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
                    {deliveries.length > 0 && (
                      <div className="mt-2 flex flex-col gap-1">
                        {deliveries.slice(0, 2).map((delivery, idx) => (
                          <div
                            key={idx}
                            className={`w-full h-1 rounded-full ${
                              delivery.priority === 'rush'
                                ? 'bg-red-500'
                                : delivery.priority === 'urgent'
                                ? 'bg-amber-500'
                                : dayIsSelected ? 'bg-white/60' : 'bg-brand-primary'
                            }`}
                          />
                        ))}
                        {deliveries.length > 2 && (
                          <p className={`text-xs font-medium ${
                            dayIsSelected ? 'text-white/80' : 'text-neutral-400'
                          }`}>
                            +{deliveries.length - 2}
                          </p>
                        )}
                      </div>
                    )}
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
                    {deliveries.length > 0 && (
                      <div className="mt-2 flex flex-col gap-1">
                        {deliveries.slice(0, 2).map((delivery, idx) => (
                          <div
                            key={idx}
                            className={`w-full h-1 rounded-full ${
                              delivery.priority === 'rush'
                                ? 'bg-red-500'
                                : delivery.priority === 'urgent'
                                ? 'bg-amber-500'
                                : dayIsSelected ? 'bg-white/60' : 'bg-brand-primary'
                            }`}
                          />
                        ))}
                        {deliveries.length > 2 && (
                          <p className={`text-xs font-medium ${
                            dayIsSelected ? 'text-white/80' : 'text-neutral-400'
                          }`}>
                            +{deliveries.length - 2}
                          </p>
                        )}
                      </div>
                    )}
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
                {deliveries.length > 0 && (
                  <div className="mt-2 flex justify-center gap-1">
                    {deliveries.slice(0, 3).map((d, j) => (
                      <div
                        key={j}
                        className={`w-2 h-2 rounded-full ${
                          dayIsSelected ? 'bg-white/60' : d.clientAvatar
                        }`}
                      />
                    ))}
                    {deliveries.length > 3 && (
                      <span className={`text-xs ${dayIsSelected ? 'text-white/80' : 'text-neutral-400'}`}>
                        +{deliveries.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
            })}
          </div>
        )}
      </div>

      {/* Selected Day Deliveries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deliveries List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-800">
              {t('calendar.deliveryDate', { date: new Date(selectedDate).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }) })}
            </h3>
            <span className="text-sm text-neutral-500">
              {selectedDeliveries.length} {selectedDeliveries.length === 1 ? t('calendar.deliverySingular') : t('calendar.deliveryPlural')}
            </span>
          </div>

          {selectedDeliveries.length > 0 ? (
            <div className="space-y-3">
              {selectedDeliveries.map((delivery) => (
                <Link
                  key={delivery.id}
                  to={`/admin/cases/${delivery.id}`}
                  className="card-base p-5 block hover:shadow-card-hover transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl ${delivery.clientAvatar} flex items-center justify-center text-white font-bold`}>
                        {delivery.client.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-neutral-800">{delivery.client}</h4>
                          {getPriorityBadge(delivery.priority)}
                        </div>
                        <p className="text-sm text-neutral-500">{delivery.caseNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {delivery.time && (
                        <span className="text-sm text-neutral-500 flex items-center gap-1">
                          <Clock size={14} />
                          {delivery.time}
                        </span>
                      )}
                      {getStatusBadge(delivery.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-neutral-100">
                    <div>
                      <p className="text-xs text-neutral-400 mb-1">{t('calendar.patient')}</p>
                      <p className="text-sm font-medium text-neutral-700 flex items-center gap-1">
                        <User size={14} className="text-neutral-400" />
                        {delivery.patient}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-400 mb-1">{t('calendar.type')}</p>
                      <p className="text-sm font-medium text-neutral-700">{delivery.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-400 mb-1">Materiale</p>
                      <p className="text-sm font-medium text-neutral-700">{delivery.material}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-400 mb-1">Denti</p>
                      <p className="text-sm font-medium text-neutral-700">{delivery.teeth}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card-base p-12 text-center">
              <div className="w-16 h-16 bg-surface-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package size={28} className="text-neutral-300" />
              </div>
              <p className="text-neutral-500 mb-4">Nessuna consegna per questa data</p>
              <Link
                to="/admin/cases/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-medium hover:bg-brand-primary/90 transition-colors"
              >
                <Plus size={16} />
                Nuovo caso
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-4">
          {/* Lavori in uscita - Casi con consegna nei prossimi 3 giorni */}
          <div className="card-base p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                <Package size={18} className="text-brand-primary" />
                Lavori in uscita
              </h3>
              <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-1 rounded-full">
                Prossimi 3 giorni
              </span>
            </div>
            <div className="space-y-3">
              {(() => {
                // Get today's date at midnight for comparison
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // Calculate date 3 days from now
                const threeDaysFromNow = new Date(today);
                threeDaysFromNow.setDate(today.getDate() + 3);
                threeDaysFromNow.setHours(23, 59, 59, 999);

                // Filter and sort upcoming deliveries
                const upcomingDeliveries = Object.entries(deliveriesByDate)
                  .flatMap(([dateKey, deliveries]) =>
                    deliveries.map(delivery => ({
                      ...delivery,
                      dateKey,
                      dueDate: new Date(dateKey)
                    }))
                  )
                  .filter(delivery => {
                    const dueDate = new Date(delivery.dateKey);
                    dueDate.setHours(0, 0, 0, 0);
                    return dueDate >= today && dueDate <= threeDaysFromNow;
                  })
                  .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
                  .slice(0, 8); // Limit to 8 items

                if (upcomingDeliveries.length === 0) {
                  return (
                    <div className="text-center py-6">
                      <Package size={24} className="text-neutral-300 mx-auto mb-2" />
                      <p className="text-sm text-neutral-400">Nessun lavoro in uscita</p>
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
                      className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary hover:bg-neutral-100 transition-colors group"
                    >
                      <div className={`w-10 h-10 rounded-lg ${delivery.clientAvatar} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {delivery.caseNumber.slice(-2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-neutral-800 truncate">
                            {delivery.caseNumber}
                          </span>
                          {delivery.priority === 'rush' && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700">
                              Rush
                            </span>
                          )}
                          {delivery.priority === 'urgent' && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">
                              Urg
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 truncate">{delivery.patient}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-xs font-medium ${
                          daysDiff === 0 ? 'text-red-600' : daysDiff === 1 ? 'text-amber-600' : 'text-neutral-600'
                        }`}>
                          {daysText}
                        </p>
                        <p className={`text-[10px] ${
                          delivery.status === 'ready' ? 'text-green-600' : 'text-amber-600'
                        }`}>
                          {delivery.status === 'ready' ? t('calendar.readyStatus') : t('calendar.inProgressStatus')}
                        </p>
                      </div>
                      <ArrowUpRight size={14} className="text-neutral-300 group-hover:text-brand-primary transition-colors flex-shrink-0" />
                    </Link>
                  );
                });
              })()}
            </div>
          </div>

          {/* Alerts */}
          <div className="card-base p-5 border-l-4 border-amber-400">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-neutral-800 mb-1">Attenzione</h4>
                <p className="text-sm text-neutral-500">
                  3 casi con consegna domani sono ancora in lavorazione
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
