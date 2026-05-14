import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
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
  Calendar,
  AlertCircle,
  FileDown,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import caseService, { type Case as ApiCase } from '../../services/case.service';
import pdfService from '../../services/pdf.service';

type StatusFilter = 'all' | 'received' | 'in_progress' | 'qc' | 'shipped' | 'delivered';
type PriorityFilter = 'all' | 'normal' | 'urgent' | 'rush';
type SortField = 'caseNumber' | 'patient' | 'type' | 'dueDate' | 'status' | 'priority';
type SortOrder = 'asc' | 'desc';

interface Case {
  id: string;
  caseNumber: string;
  patient: string;
  submittedDate: string;
  dueDate: string;
  status: ApiCase['status'];
  priority: ApiCase['priority'];
  type: string;
  teeth: string;
  materials: string[];
  hasNewMessages: boolean;
}

const workTypes = [
  { value: 'corona', label: 'Corona' },
  { value: 'ponte', label: 'Ponte' },
  { value: 'protesi_totale', label: 'Protesi Totale' },
  { value: 'protesi_parziale', label: 'Protesi Parziale' },
  { value: 'impianto', label: 'Impianto' },
  { value: 'bite', label: 'Bite' },
  { value: 'facette', label: 'Facette' },
  { value: 'altro', label: 'Altro' },
];

export default function MyCases() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Filtri
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Data
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCases = async () => {
      try {
        setLoading(true);
        const response = await caseService.getCases({});
        // Handle both { data: [], total: number } and direct array responses
        const casesData = Array.isArray(response) ? response : (response.data || []);

        // Map backend data to frontend format
        const mappedCases: Case[] = casesData.map((c: ApiCase) => ({
          id: c.id,
          caseNumber: c.caseNumber,
          patient: c.patientName || 'N/A',
          submittedDate: c.receivedDate,
          dueDate: c.dueDate,
          status: c.status,
          priority: c.priority,
          type: c.teeth?.[0]?.workType || 'Lavorazione',
          teeth: c.teeth?.map((t) => t.toothNumber).join(', ') || 'N/A',
          materials: [...new Set(c.teeth?.map((t) => t.material) || [])],
          hasNewMessages: false,
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

  // Filtri applicati
  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      // Search filter (cerca in numero caso, paziente, tipo, denti)
      const matchesSearch = !searchQuery ||
        c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.teeth.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

      // Priority filter
      const matchesPriority = priorityFilter === 'all' || c.priority === priorityFilter;

      // Type filter
      const matchesType = typeFilter === 'all' ||
        c.type.toLowerCase().includes(typeFilter.toLowerCase());

      // Date range filter
      const caseDate = new Date(c.dueDate);
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo) : null;
      const matchesDate = (!fromDate || caseDate >= fromDate) &&
                          (!toDate || caseDate <= toDate);

      return matchesSearch && matchesStatus && matchesPriority && matchesType && matchesDate;
    });
  }, [cases, searchQuery, statusFilter, priorityFilter, typeFilter, dateFrom, dateTo]);

  // Sorted cases
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
        case 'dueDate':
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'priority':
          const priorityOrder = { rush: 3, urgent: 2, normal: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredCases, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setTypeFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const stats = {
    active: cases.filter(c => ['received', 'in_progress', 'qc', 'shipped'].includes(c.status)).length,
    completed: cases.filter(c => c.status === 'delivered').length,
    total: cases.length,
    urgent: cases.filter(c => c.priority === 'urgent' || c.priority === 'rush').length,
  };

  const activeFiltersCount = [
    statusFilter !== 'all',
    priorityFilter !== 'all',
    typeFilter !== 'all',
    dateFrom,
    dateTo
  ].filter(Boolean).length;

  const getStatusInfo = (status: Case['status']) => {
    switch (status) {
      case 'received':
        return { label: 'Ricevuto', color: 'bg-blue-500', badgeClass: 'bg-blue-100 text-blue-700 border-blue-200', icon: Package, iconColor: 'text-blue-600' };
      case 'in_progress':
        return { label: 'In lavorazione', color: 'bg-amber-500', badgeClass: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock, iconColor: 'text-amber-600' };
      case 'qc':
        return { label: 'QC', color: 'bg-violet-500', badgeClass: 'bg-violet-100 text-violet-700 border-violet-200', icon: CheckCircle2, iconColor: 'text-violet-600' };
      case 'shipped':
        return { label: 'Spedito', color: 'bg-cyan-500', badgeClass: 'bg-cyan-100 text-cyan-700 border-cyan-200', icon: Truck, iconColor: 'text-cyan-600' };
      case 'delivered':
        return { label: 'Consegnato', color: 'bg-neutral-400', badgeClass: 'bg-neutral-100 text-neutral-600 border-neutral-200', icon: CheckCircle2, iconColor: 'text-neutral-600' };
      default:
        return { label: status, color: 'bg-neutral-400', badgeClass: 'bg-neutral-100 text-neutral-600', icon: Package, iconColor: 'text-neutral-600' };
    }
  };

  const getPriorityInfo = (priority: Case['priority']) => {
    switch (priority) {
      case 'rush':
        return { label: 'Rush', class: 'bg-red-500 text-white', dotClass: 'bg-red-500' };
      case 'urgent':
        return { label: 'Urgente', class: 'bg-amber-500 text-white', dotClass: 'bg-amber-500' };
      case 'normal':
        return { label: 'Normale', class: 'bg-emerald-500 text-white', dotClass: 'bg-emerald-500' };
      default:
        return { label: priority, class: 'bg-neutral-400 text-white', dotClass: 'bg-neutral-400' };
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });
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
      alert('Errore durante la generazione del PDF');
    }
  };

  const SortHeader = ({ field, children, className = '' }: { field: SortField; children: React.ReactNode; className?: string }) => (
    <th
      className={`text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-50 transition-colors ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
        ) : (
          <ArrowUpDown size={14} className="text-slate-300" />
        )}
      </div>
    </th>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-neutral-500">Caricamento casi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-scale-in pb-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{t('portal.myCases')}</h1>
          <p className="text-slate-500 mt-1">Gestisci tutti i tuoi casi</p>
        </div>
        <Link
          to="/portal/new-case"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-[1.5rem] font-semibold hover:scale-105 transition-all duration-300 shadow-lg shadow-teal-500/20"
        >
          <PlusCircle size={20} />
          Nuovo caso
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Stats Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                statusFilter === 'all'
                  ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tutti ({stats.total})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                statusFilter === 'active'
                  ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Attivi ({stats.active})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                statusFilter === 'completed'
                  ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Completati ({stats.completed})
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cerca per ID, paziente o tipo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-4 py-2 w-full sm:w-64 bg-slate-100/50 hover:bg-white/80 focus:bg-white rounded-xl border border-transparent focus:border-teal-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/10 placeholder:text-slate-400 transition-all duration-300"
            />
          </div>
        </div>
      </div>

      {/* Cases List */}
      <div className="space-y-3">
        {filteredCases.length > 0 ? filteredCases.map((caseItem) => {
          const statusInfo = getStatusInfo(caseItem.status);
          const StatusIcon = statusInfo.icon;

          return (
            <Link
              key={caseItem.id}
              to={`/portal/cases/${caseItem.id}`}
              className="glass-card p-4 block hover:scale-[1.01] transition-all duration-200 group"
            >
              <div className="flex items-center gap-4">
                {/* Status Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  caseItem.status === 'delivered' ? 'bg-slate-100 group-hover:bg-slate-200' : 'bg-teal-50 group-hover:bg-teal-100'
                }`}>
                  <StatusIcon size={24} className={statusInfo.iconColor} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-800">{caseItem.caseNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    {caseItem.hasNewMessages && (
                      <span className="flex items-center gap-1 text-teal-600">
                        <MessageSquare size={14} />
                        <span className="text-xs font-semibold">Nuovo</span>
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 font-medium">
                    {caseItem.patient} - {caseItem.type}
                  </p>
                  <p className="text-xs text-slate-400">
                    Denti: {caseItem.teeth}
                  </p>
                </div>

                {/* Dates & Actions */}
                <div className="hidden sm:block text-right mr-2">
                  <p className="text-xs text-slate-400">Consegna</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {new Date(caseItem.dueDate).toLocaleDateString('it-IT')}
                  </p>
                </div>

                {/* PDF Download Button */}
                <button
                  onClick={(e) => handleDownloadPDF(e, caseItem.id)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-card-teal hover:bg-teal-50 transition-all"
                  title="Scarica PDF"
                >
                  <FileDown size={18} />
                </button>

                <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
            </Link>
          );
        }) : (
          <div className="glass-card py-16 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
              <Package size={32} className="text-slate-400" />
            </div>
            <p className="text-lg font-semibold text-slate-600 mb-2">Nessun caso trovato</p>
            <p className="text-sm text-slate-400 mb-6">
              {searchQuery ? 'Prova con un altro termine di ricerca' : 'Inizia creando il tuo primo caso'}
            </p>
            <Link
              to="/portal/new-case"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-[1.5rem] font-semibold hover:scale-105 transition-all duration-300 shadow-lg shadow-teal-500/20"
            >
              <PlusCircle size={20} />
              Crea nuovo caso
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
