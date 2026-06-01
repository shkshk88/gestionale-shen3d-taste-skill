import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  TrendingDown,
  Euro,
  Package,
  Users,
  Download,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface MonthlyData {
  monthKey: string;
  revenue: number;
  cases: number;
}

interface ClientRevenue {
  name: string;
  revenue: number;
  cases: number;
  color: string;
}

interface MaterialUsage {
  id: string;
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export default function ReportsPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  // Mock data
  type Trend = 'up' | 'down' | 'neutral';
  const stats: Record<'revenue' | 'cases' | 'avgValue' | 'clients', { value: number; change: number; trend: Trend }> = {
    revenue: { value: 45280, change: 12.5, trend: 'up' },
    cases: { value: 156, change: 8.3, trend: 'up' },
    avgValue: { value: 290, change: -2.1, trend: 'down' },
    clients: { value: 12, change: 0, trend: 'neutral' },
  };

  const monthlyData: MonthlyData[] = [
    { monthKey: 'jan', revenue: 32000, cases: 98 },
    { monthKey: 'feb', revenue: 35500, cases: 112 },
    { monthKey: 'mar', revenue: 38200, cases: 125 },
    { monthKey: 'apr', revenue: 36800, cases: 118 },
    { monthKey: 'may', revenue: 42100, cases: 142 },
    { monthKey: 'jun', revenue: 45280, cases: 156 },
  ];

  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue));

  const topClients: ClientRevenue[] = [
    { name: 'Clinica Dentale Rossi', revenue: 12450, cases: 45, color: 'bg-amber-700' },
    { name: 'Studio Dr. Verdi', revenue: 9820, cases: 32, color: 'bg-green-700' },
    { name: 'Dental Care Center', revenue: 8340, cases: 28, color: 'bg-stone-700' },
    { name: 'Smile Center Ferrari', revenue: 6200, cases: 22, color: 'bg-stone-500' },
    { name: 'Studio Bianchi', revenue: 4890, cases: 18, color: 'bg-amber-800' },
  ];

  const totalClientRevenue = topClients.reduce((acc, c) => acc + c.revenue, 0);

  const materialUsage: MaterialUsage[] = [
    { id: 'zr', name: t('dental.materials.ZR'), count: 68, percentage: 35, color: 'bg-amber-700' },
    { id: 'emax', name: t('dental.materialsShort.EMAX'), count: 52, percentage: 27, color: 'bg-green-700' },
    { id: 'mc', name: t('dental.materialsShort.METAL_CERAMIC'), count: 38, percentage: 20, color: 'bg-stone-700' },
    { id: 'pmma', name: t('dental.materials.PMMA'), count: 22, percentage: 11, color: 'bg-stone-500' },
    { id: 'comp', name: t('dental.materials.COMP'), count: 14, percentage: 7, color: 'bg-amber-800' },
  ];

  const casesByStatus = [
    { key: 'completed', status: t('reports.status_completed'), count: 124, color: 'bg-green-700', percentage: 79 },
    { key: 'inProgress', status: t('reports.status_inProgress'), count: 22, color: 'bg-amber-700', percentage: 14 },
    { key: 'pending', status: t('reports.status_pending'), count: 8, color: 'bg-orange-600', percentage: 5 },
    { key: 'issues', status: t('reports.status_issues'), count: 2, color: 'bg-red-500', percentage: 2 },
  ];

  const periodOptions = [
    { value: 'week', label: t('reports.periodWeek') },
    { value: 'month', label: t('reports.periodMonth') },
    { value: 'quarter', label: t('reports.periodQuarter') },
    { value: 'year', label: t('reports.periodYear') },
  ];

  const rankColors = [
    'bg-stone-800',
    'bg-amber-800',
    'bg-green-700',
    'bg-stone-500',
    'bg-stone-400',
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* WIP banner — pagina mock, nascosta dalla sidebar (B-04 audit) */}
      <div className="rounded-xl border border-amber-300 bg-orange-50 px-5 py-4 text-sm text-amber-900">
        <strong>{t('reports.wipBannerTitle')}</strong> {t('reports.wipBannerDesc')}
      </div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">{t('reports.title')}</h1>
          <p className="text-sm text-stone-500">{t('reports.insightDesc')}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <div className="flex bg-stone-50 rounded-xl p-1">
            {periodOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value as typeof period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  period === opt.value
                    ? 'bg-white text-stone-800 shadow-soft'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition-all flex items-center gap-2">
            <Download size={18} />
            {t('common.export')}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="card-base p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-amber-700/20 flex items-center justify-center">
              <Euro size={22} className="text-amber-800" />
            </div>
            <span className={`flex items-center gap-1 text-sm font-medium ${
              stats.revenue.trend === 'up' ? 'text-green-800' : 'text-red-600'
            }`}>
              {stats.revenue.trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {stats.revenue.change}%
            </span>
          </div>
          <p className="text-sm text-stone-500 mb-1">{t('reports.revenue')}</p>
          <p className="text-2xl font-bold text-stone-800">₪{stats.revenue.value.toLocaleString('he-IL')}</p>
        </div>

        {/* Cases */}
        <div className="card-base p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-green-700/20 flex items-center justify-center">
              <Package size={22} className="text-green-700" />
            </div>
            <span className={`flex items-center gap-1 text-sm font-medium ${
              stats.cases.trend === 'up' ? 'text-green-800' : 'text-red-600'
            }`}>
              {stats.cases.trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {stats.cases.change}%
            </span>
          </div>
          <p className="text-sm text-stone-500 mb-1">{t('reports.completedCases')}</p>
          <p className="text-2xl font-bold text-stone-800">{stats.cases.value}</p>
        </div>

        {/* Average Value */}
        <div className="card-base p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-stone-800/20 flex items-center justify-center">
              <BarChart3 size={22} className="text-stone-800" />
            </div>
            <span className={`flex items-center gap-1 text-sm font-medium ${
              stats.avgValue.trend === 'up' ? 'text-green-800' : 'text-red-600'
            }`}>
              {stats.avgValue.trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {Math.abs(stats.avgValue.change)}%
            </span>
          </div>
          <p className="text-sm text-stone-500 mb-1">{t('reports.avgCaseValue')}</p>
          <p className="text-2xl font-bold text-stone-800">₪{stats.avgValue.value}</p>
        </div>

        {/* Active Clients */}
        <div className="card-base p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-stone-500/20 flex items-center justify-center">
              <Users size={22} className="text-stone-500" />
            </div>
            <span className="text-sm font-medium text-stone-400">—</span>
          </div>
          <p className="text-sm text-stone-500 mb-1">{t('clients.activeClients')}</p>
          <p className="text-2xl font-bold text-stone-800">{stats.clients.value}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 card-base p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-stone-800">Andamento Fatturato</h3>
              <p className="text-sm text-stone-500">Ultimi 6 mesi</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-800" />
                <span className="text-stone-600">Fatturato</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-700" />
                <span className="text-stone-600">Casi</span>
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="flex items-end justify-between gap-4 h-48">
            {monthlyData.map((data) => (
              <div key={data.monthKey} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center gap-1" style={{ height: '180px' }}>
                  {/* Revenue Bar */}
                  <div
                    className="w-full max-w-[40px] bg-amber-800 rounded-t-lg transition-all hover:opacity-80 relative group"
                    style={{ height: `${(data.revenue / maxRevenue) * 100}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-stone-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ₪{data.revenue.toLocaleString('he-IL')}
                    </div>
                  </div>
                </div>
                <span className="text-sm text-stone-500">{t(`calendar.shortMonths.${data.monthKey}`)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cases by Status */}
        <div className="card-base p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-stone-800">Casi per Stato</h3>
            <PieChart size={20} className="text-stone-400" />
          </div>

          {/* Donut Chart Placeholder */}
          <div className="relative w-40 h-40 mx-auto mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {casesByStatus.reduce((acc, item, index) => {
                const prevPercentage = casesByStatus.slice(0, index).reduce((sum, i) => sum + i.percentage, 0);
                const strokeDasharray = `${item.percentage * 2.51} ${251 - item.percentage * 2.51}`;
                const strokeDashoffset = -prevPercentage * 2.51;

                acc.push(
                  <circle
                    key={item.status}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={item.color.replace('bg-', 'var(--')}
                    strokeWidth="12"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className={item.color.replace('bg-', 'stroke-')}
                  />
                );
                return acc;
              }, [] as JSX.Element[])}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold text-stone-800">156</p>
                <p className="text-xs text-stone-500">{t('reports.total')}</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2">
            {casesByStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm text-stone-600">{item.status}</span>
                </div>
                <span className="text-sm font-medium text-stone-800">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clients */}
        <div className="card-base p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-stone-800">Top Clienti per Fatturato</h3>
            <button className="text-sm text-amber-800 hover:underline">Vedi tutti</button>
          </div>

          <div className="space-y-4">
            {topClients.map((client, index) => (
              <div key={client.name} className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${rankColors[index] || 'bg-stone-400'} flex items-center justify-center text-white font-bold text-sm`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-800 truncate">{client.name}</p>
                  <p className="text-sm text-stone-500">{t('reports.casesCount', { count: client.cases })}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-stone-800">₪{client.revenue.toLocaleString('he-IL')}</p>
                  <p className="text-xs text-stone-400">
                    {((client.revenue / totalClientRevenue) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Materials Usage */}
        <div className="card-base p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-stone-800">Utilizzo Materiali</h3>
            <span className="text-sm text-stone-500">Questo mese</span>
          </div>

          <div className="space-y-4">
            {materialUsage.map((material) => (
              <div key={material.name}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${material.color}`} />
                    <span className="text-sm font-medium text-stone-700">{material.name}</span>
                  </div>
                  <span className="text-sm text-stone-500">{material.count} {t('reports.units')} ({material.percentage}%)</span>
                </div>
                <div className="h-2 bg-stone-50 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${material.color} rounded-full transition-all`}
                    style={{ width: `${material.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
            <span className="text-sm font-medium text-stone-600">{t('reports.totalWork')}</span>
            <span className="text-lg font-bold text-stone-800">
              {materialUsage.reduce((acc, m) => acc + m.count, 0)} {t('reports.units')}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-800/80 rounded-xl p-6 text-white shadow-soft">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Insight del Mese</h3>
            <ul className="space-y-2 text-white/80 text-sm">
              <li className="flex items-center gap-2">
                <TrendingUp size={16} className="text-teal-400" />
                Fatturato in crescita del 12.5% rispetto al mese scorso
              </li>
              <li className="flex items-center gap-2">
                <TrendingUp size={16} className="text-teal-400" />
                {t('reports.insightTopClient', { client: 'Clinica Dentale Rossi', count: 45 })}
              </li>
              <li className="flex items-center gap-2">
                <TrendingDown size={16} className="text-amber-400" />
                {t('reports.insightAvgDown', { percent: '2.1' })}
              </li>
            </ul>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">+12.5%</p>
            <p className="text-white/60 text-sm">crescita mensile</p>
          </div>
        </div>
      </div>
    </div>
  );
}
