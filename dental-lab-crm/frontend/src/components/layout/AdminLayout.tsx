import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  Users,
  Calendar,
  FileText,
  Receipt,
  BarChart3,
  Box,
  Settings,
  Search,
  LogOut,
  Clock,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { LanguageSelector } from './LanguageSelector';
import { NotificationDropdown } from '@/components/notifications';
import { AdminMobileNav } from './MobileBottomNav';

// NOTE: Invoices, Reports, Notifications sono stati nascosti dalla sidebar
// perché contengono solo dati mock (B-03/04/05 audit 2026-05-16).
// Le pagine restano accessibili via URL diretto per sviluppo finché non
// vengono integrate con dati reali.
const navItems = [
  { icon: LayoutDashboard, path: '/admin', label: 'nav.dashboard', exact: true },
  { icon: Package, path: '/admin/cases', label: 'nav.cases' },
  { icon: Users, path: '/admin/clients', label: 'nav.clients' },
  { icon: Calendar, path: '/admin/calendar', label: 'nav.calendar' },
  { icon: Box, path: '/admin/viewer-3d', label: 'viewer3d.title' },
  { icon: FileText, path: '/admin/price-lists', label: 'nav.priceLists' },
  { icon: Settings, path: '/admin/settings', label: 'nav.settings' },
];

export function AdminLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('it-IT', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) + ' - ' + date.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get current page title based on route
  const getCurrentPageInfo = () => {
    const path = location.pathname;
    if (path === '/admin') return { title: t('nav.dashboard'), subtitle: t('dashboard.welcomeBack') };
    if (path.includes('/cases')) return { title: t('nav.cases'), subtitle: t('cases.subtitle') };
    if (path.includes('/clients')) return { title: t('nav.clients'), subtitle: t('clients.subtitle') };
    if (path.includes('/calendar')) return { title: t('nav.calendar'), subtitle: t('calendar.subtitle') };
    if (path.includes('/viewer-3d')) return { title: t('viewer3d.title'), subtitle: t('viewer3d.demoSubtitle') };
    if (path.includes('/price-lists')) return { title: t('nav.priceLists'), subtitle: t('priceLists.subtitle') };
    if (path.includes('/reports')) return { title: t('nav.reports'), subtitle: t('reports.insightDesc') };
    if (path.includes('/invoices')) return { title: t('invoices.title'), subtitle: t('invoices.subtitle') };
    if (path.includes('/settings')) return { title: t('nav.settings'), subtitle: t('settings.subtitle') };
    return { title: 'Shen3D', subtitle: '' };
  };

  const pageInfo = getCurrentPageInfo();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-mesh">
      {/* Floating Glass Sidebar - More Compact - Hidden on mobile */}
      <aside className="fixed start-4 top-4 bottom-4 w-[80px] glass-sidebar rounded-[1.5rem] flex flex-col items-center py-6 gap-4 z-50 transition-all duration-300 hidden md:flex">
        {/* Logo */}
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform duration-300">
          <span className="text-white font-bold text-lg">S</span>
        </div>

        {/* Navigation Icons */}
        <nav className="flex flex-col gap-2 flex-1 w-full px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 relative group ${isActive
                  ? 'bg-slate-800 text-white shadow-lg shadow-slate-900/10 scale-105'
                  : 'text-slate-400 hover:bg-white/50 hover:text-slate-700 hover:scale-105'
                  }`}
                title={t(item.label)}
              >
                <Icon size={20} strokeWidth={isActive ? 2 : 2} />

                {/* Active Indicator Dot */}
                {isActive && (
                  <span className="absolute -end-1 top-1 w-2 h-2 bg-blue-500 rounded-full border-2 border-white" />
                )}

                {/* Tooltip on hover */}
                <div className="sidebar-tooltip absolute start-full ms-4 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap z-[60]">
                  {t(item.label)}
                </div>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout at bottom */}
        <button
          onClick={logout}
          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50/50 rounded-xl transition-all duration-300"
          title={t('auth.logout')}
        >
          <LogOut size={20} strokeWidth={2} />
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col ms-0 md:ms-[100px] me-4 my-4 mb-20 md:mb-4 overflow-hidden relative">

        {/* Glass Header - Compact */}
        <header className="h-[72px] mb-4 glass rounded-[1.5rem] px-6 flex items-center justify-between z-40 shrink-0 relative">
          {/* Page Title & Breadcrumbs */}
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{pageInfo.title}</h1>
            {pageInfo.subtitle && (
              <p className="text-xs text-slate-500 mt-0.5 font-medium">{pageInfo.subtitle}</p>
            )}
          </div>

          {/* Date/Time Center - Subtle & Clean - Hidden on mobile */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-slate-600 text-sm hidden md:flex">
            <span className="font-medium">
              {currentTime.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
            <span className="text-slate-300">|</span>
            <span className="font-semibold text-slate-700">
              {currentTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-5">
            {/* Search Pill - More Minimal */}
            <div className="relative group hidden md:block">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
              <input
                type="text"
                placeholder={t('common.search')}
                className="ps-9 pe-3 py-1.5 w-44 bg-slate-100/50 hover:bg-white/80 focus:bg-white rounded-full border border-transparent focus:border-blue-100
                         text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10
                         placeholder:text-slate-400 transition-all duration-300"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <NotificationDropdown />
              <div className="w-px h-6 bg-slate-200 mx-1" />
              <LanguageSelector />
            </div>

            {/* User Profile Pill */}
            <div className="flex items-center gap-3 ps-2 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="text-end hidden md:block">
                <p className="text-sm font-bold text-slate-700">{user?.name || 'Admin User'}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{user?.role || 'admin'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white/60">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-auto rounded-[2rem] no-scrollbar">
          {/* We don't add padding here to allow full-width bento grids, pages handle their own padding/grid */}
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <AdminMobileNav />
    </div>
  );
}
