import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Search,
  ChevronDown,
  ChevronUp,
  Filter,
  PlusCircle,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  ArrowUpDown,
  X,
  AlertCircle,
  FileDown,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import caseService, { type Case as ApiCase } from '../../services/case.service';
import pdfService from '../../services/pdf.service';
import { useAuthStore } from '../../store/authStore';
import { getDateLocale } from '@/utils/locale';

type StatusFilter = 'all' | 'active' | 'completed' | 'received' | 'in_progress' | 'qc' | 'shipped' | 'delivered';
type PriorityFilter = 'all' | 'normal' | 'urgent' | 'rush';
type SortField = 'caseNumber' | 'patient' | 'type' | 'dueDate' | 'status' | 'priority';
type SortOrder = 'asc' | 'desc';

interface Case {
  id: string;
  caseNumber: string;
  patient: string;
  submittedDate: string;
  dueDate?: string;
  status: ApiCase['status'];
  priority: ApiCase['priority'];
  type: string;
  teeth: string;
  teethCount: number;
  materials: string[];
  hasNewMessages: boolean;
}

export default function MyCases() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCases = async () => {
      try {
        setLoading(true);
        const clientId = user?.clientId || user?.client?.id;
        if (!clientId) {
          setCases([]);
          return;
        }
        const casesData = await caseService.getCases({ clientId });

        const mappedCases: Case[] = casesData.map((c: ApiCase) => ({
          id: c.id,
          caseNumber: c.caseNumber,
          patient: c.patientName || t('common.noData'),
          submittedDate: c.receivedDate,
          dueDate: c.dueDate,
          status: c.status,
          priority: c.priority,
          type: c.teeth?.[0]?.workType || t('cases.workLabel'),
          teeth: c.teeth?.map((t) => t.toothNumber).join(', ') || t('common.noData'),
          teethCount: c.teeth?.length || 0,
          materials: [...new Set(c.teeth?.map((t) => t.material) || [])],
          hasNewMessages: (c._count?.messages ?? 0) > 0,
        }));

        setCases(mappedCases);
      } catch (error) {
        console.error('Error loading cases:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCases();
  }, []);

  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      const matchesSearch = !searchQuery ||
        c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.teeth.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && ['received', 'in_progress', 'qc', 'shipped'].includes(c.status)) ||
        (statusFilter === 'completed' && c.status === 'delivered') ||
        c.status === statusFilter;

      const matchesPriority = priorityFilter === 'all' || c.priority === priorityFilter;

      const matchesType = typeFilter === 'all' ||
        c.type.toLowerCase().includes(typeFilter.toLowerCase());

      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo) : null;
      const caseDate = c.dueDate ? new Date(c.dueDate) : null;
      const matchesDate = (!fromDate && !toDate) || (caseDate !== null &&
        (!fromDate || caseDate >= fromDate) &&
        (!toDate || caseDate <= toDate));

      return matchesSearch && matchesStatus && matchesPriority && matchesType && matchesDate;
    });
  }, [cases, searchQuery, statusFilter, priorityFilter, typeFilter, dateFrom, dateTo]);

  const sortedCases = useMemo(() => {
    return [...filteredCases].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'caseNumber':
          comparison = a.caseNumber.localeCompare(b.caseNumber);
          break;
        case 'patient':
          comparison = a.patient.localeCompare(b.patient);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'dueDate': {
          const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
          const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
          comparison = aTime - bTime;
          break;
        }
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'priority': {
          const priorityOrder = { rush: 3, urgent: 2, normal: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        }
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredCases, sortField, sortOrder]);

  const availableTypes = useMemo(
    () => Array.from(new Set(cases.map((c) => c.type).filter(Boolean))).sort(),
    [cases]
  );

  const clearFilters = () => {
    setPriorityFilter('all');
    setTypeFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const sortFields: SortField[] = ['dueDate', 'priority', 'status', 'patient', 'caseNumber'];

  const stats = {
    active: cases.filter(c => ['received', 'in_progress', 'qc', 'shipped'].includes(c.status)).length,
    completed: cases.filter(c => c.status === 'delivered').length,
    total: cases.length,
    urgent: cases.filter(c => c.priority === 'urgent' || c.priority === 'rush').length,
  };

  const activeFiltersCount = [
    priorityFilter !== 'all',
    typeFilter !== 'all',
    dateFrom,
    dateTo
  ].filter(Boolean).length;

  const getStatusInfo = (status: Case['status']) => {
    switch (status) {
      case 'received':
        return { label: t('cases.statuses.received'), color: 'bg-amber-700', badgeClass: 'bg-orange-50 text-sky-700 border-sky-200', icon: Package, iconColor: 'text-amber-800' };
      case 'in_progress':
        return { label: t('cases.statuses.in_progress'), color: 'bg-orange-600', badgeClass: 'bg-orange-50 text-amber-700 border-amber-200', icon: Clock, iconColor: 'text-amber-600' };
      case 'qc':
        return { label: t('cases.statuses.qc'), color: 'bg-violet-500', badgeClass: 'bg-violet-50 text-violet-700 border-violet-200', icon: CheckCircle2, iconColor: 'text-violet-600' };
      case 'shipped':
        return { label: t('cases.statuses.shipped'), color: 'bg-green-700', badgeClass: 'bg-green-50 text-teal-700 border-teal-200', icon: Truck, iconColor: 'text-green-800' };
      case 'delivered':
        return { label: t('cases.statuses.delivered'), color: 'bg-stone-400', badgeClass: 'bg-stone-100 text-stone-600 border-stone-200', icon: CheckCircle2, iconColor: 'text-stone-600' };
      default:
        return { label: status, color: 'bg-stone-400', badgeClass: 'bg-stone-100 text-stone-600', icon: Package, iconColor: 'text-stone-600' };
    }
  };

  const getPriorityInfo = (priority: Case['priority']) => {
    switch (priority) {
      case 'rush':
        return { label: t('cases.priorities.rush'), class: 'bg-red-500 text-white', dotClass: 'bg-red-500' };
      case 'urgent':
        return { label: t('cases.priorities.urgent'), class: 'bg-orange-600 text-white', dotClass: 'bg-orange-600' };
      case 'normal':
        return { label: t('cases.priorities.normal'), class: 'bg-green-700 text-white', dotClass: 'bg-green-700' };
      default:
        return { label: priority, class: 'bg-stone-400 text-white', dotClass: 'bg-stone-400' };
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(getDateLocale(), { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const isOverdue = (dueDate: string, status: Case['status']) => {
    if (status === 'delivered') return false;
    return new Date(dueDate) < new Date();
  };

  const handleDownloadPDF = async (e: React.MouseEvent, caseId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const fullCase = await caseService.getCaseById(caseId);
      await pdfService.generateCasePDF(fullCase);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(t('cases.errorGeneratingPdf'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800 mx-auto mb-4"></div>
          <p className="text-stone-500">{t('common.loadingCases')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-scale-in pb-4">
      {/* CTA */}
      <div className="flex justify-end">
        <Link
          to="/portal/new-case"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-sky-500 to-sky-600 text-white rounded-xl text-sm font-semibold hover:scale-105 transition-all duration-300 shadow-lg shadow-sky-500/20"
        >
          <PlusCircle size={16} />
          {t('portal.newCase')}
        </Link>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-stone-100 shadow-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="inline-flex p-1 bg-stone-100 rounded-xl gap-1 self-start">
            {([
              { key: 'all', count: stats.total },
              { key: 'active', count: stats.active },
              { key: 'completed', count: stats.completed },
            ] as const).map(({ key, count }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  statusFilter === key
                    ? 'bg-white text-amber-800 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {t(`portal.${key}`, { count })}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input
              type="text"
              placeholder={t('cases.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-4 py-2 w-full bg-stone-100/50 hover:bg-white/80 focus:bg-white rounded-xl border border-transparent focus:border-sky-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/10 placeholder:text-stone-400 transition-all duration-300"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
              showFilters || activeFiltersCount > 0
                ? 'bg-orange-50 text-sky-700 border-sky-200'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200 border-transparent'
            }`}
          >
            <Filter size={15} />
            {t('portal.filters')}
            {activeFiltersCount > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-800 text-white text-[10px] leading-none rounded-full font-bold">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown size={14} className={`transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          <div className="inline-flex items-center gap-1 bg-stone-100 rounded-xl pl-3 pr-1 py-1">
            <ArrowUpDown size={14} className="text-stone-400 shrink-0" />
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="bg-transparent text-sm font-medium text-stone-600 focus:outline-none cursor-pointer py-1 pr-1"
            >
              {sortFields.map((f) => (
                <option key={f} value={f}>
                  {t(`portal.sortOptions.${f}`)}
                </option>
              ))}
            </select>
            <button
              onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-stone-500 transition-colors shrink-0"
              title={sortOrder === 'asc' ? t('portal.sortAsc') : t('portal.sortDesc')}
            >
              {sortOrder === 'asc' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm text-stone-500 hover:text-red-500 transition-colors"
            >
              <X size={14} />
              {t('portal.clearFilters')}
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-stone-100 animate-scale-in">
            <div>
              <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wide mb-1">
                {t('cases.priority')}
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
                className="w-full bg-stone-100/60 hover:bg-white focus:bg-white rounded-xl border border-transparent focus:border-sky-100 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/10 transition-all cursor-pointer"
              >
                <option value="all">{t('portal.allPriorities')}</option>
                <option value="normal">{t('cases.priorities.normal')}</option>
                <option value="urgent">{t('cases.priorities.urgent')}</option>
                <option value="rush">{t('cases.priorities.rush')}</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wide mb-1">
                {t('dental.workType')}
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full bg-stone-100/60 hover:bg-white focus:bg-white rounded-xl border border-transparent focus:border-sky-100 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/10 transition-all cursor-pointer"
              >
                <option value="all">{t('portal.allTypes')}</option>
                {availableTypes.map((tp) => (
                  <option key={tp} value={tp}>
                    {t(`dental.workTypes.${tp}`, { defaultValue: tp })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wide mb-1">
                {t('portal.dateFrom')}
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-stone-100/60 hover:bg-white focus:bg-white rounded-xl border border-transparent focus:border-sky-100 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wide mb-1">
                {t('portal.dateTo')}
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-stone-100/60 hover:bg-white focus:bg-white rounded-xl border border-transparent focus:border-sky-100 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/10 transition-all"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-stone-400">
          {t('portal.resultsCount', { count: sortedCases.length })}
        </p>
      </div>

      {/* Cases List */}
      <div className="space-y-3">
        {sortedCases.length > 0 ? sortedCases.map((caseItem) => {
          const statusInfo = getStatusInfo(caseItem.status);
          const StatusIcon = statusInfo.icon;
          const priorityInfo = getPriorityInfo(caseItem.priority);
          const overdue = caseItem.dueDate ? isOverdue(caseItem.dueDate, caseItem.status) : false;

          return (
            <Link
              key={caseItem.id}
              to={`/portal/cases/${caseItem.id}`}
              className="bg-white rounded-xl border border-stone-100 shadow-sm p-4 block hover:scale-[1.01] transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                  caseItem.status === 'delivered' ? 'bg-stone-100 group-hover:bg-stone-200' : 'bg-orange-50 group-hover:bg-sky-100'
                }`}>
                  <StatusIcon size={20} className={statusInfo.iconColor} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${priorityInfo.dotClass}`} title={priorityInfo.label} />
                    <span className="font-semibold text-stone-800 truncate">{caseItem.patient}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold text-white shrink-0 ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    {caseItem.hasNewMessages && (
                      <MessageSquare size={13} className="text-green-700 shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-stone-600">
                    {t(`dental.workTypes.${caseItem.type}`, { defaultValue: caseItem.type })}
                    {caseItem.teethCount > 0 && (
                      <span className="text-stone-400"> · {caseItem.teethCount} {t('dental.tooth', { count: caseItem.teethCount })}</span>
                    )}
                  </p>
                  <p className="text-[10px] font-mono text-stone-400 mt-0.5">#{caseItem.caseNumber}</p>
                </div>

                <div className="hidden sm:block text-right mr-2 shrink-0">
                  <p className="text-[10px] text-stone-400">{t('portal.deliveryLabel')}</p>
                  <p className={`text-sm font-semibold inline-flex items-center gap-1 ${overdue ? 'text-red-500' : 'text-stone-700'}`}>
                    {overdue && <AlertCircle size={13} className="shrink-0" />}
                    {caseItem.dueDate ? formatDate(caseItem.dueDate) : '—'}
                  </p>
                </div>

                <button
                  onClick={(e) => handleDownloadPDF(e, caseItem.id)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-400 hover:text-green-700 hover:bg-green-50 transition-all"
                  title={t('common.downloadPdf')}
                >
                  <FileDown size={18} />
                </button>

                <ChevronRight size={20} className="text-slate-300 group-hover:text-stone-500 transition-colors" />
              </div>
            </Link>
          );
        }) : (
          <div className="bg-white rounded-xl border border-stone-100 shadow-sm py-16 text-center">
            <div className="w-20 h-20 bg-stone-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Package size={32} className="text-stone-400" />
            </div>
            <p className="text-lg font-semibold text-stone-600 mb-2">{t('portal.noCasesFound')}</p>
            <p className="text-sm text-stone-400 mb-6">
              {searchQuery ? t('portal.tryOtherSearch') : t('portal.createFirstCase')}
            </p>
            <Link
              to="/portal/new-case"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-sky-500 to-sky-600 text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg shadow-sky-500/20"
            >
              <PlusCircle size={20} />
              {t('portal.createNewCase')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
