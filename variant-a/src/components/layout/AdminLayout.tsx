import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  Users,
  Calendar,
  Receipt,
  Box,
  Settings,
  Search,
  LogOut,
  Clock,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { LanguageSelector } from './LanguageSelector';
import { NotificationDropdown } from '@/components/notifications';
import { AdminMobileNav } from './MobileBottomNav';
import { getDateLocale } from '@/utils/locale';

const navItems = [
  { icon: LayoutDashboard, path: '/admin', label: 'nav.dashboard', exact: true },
  { icon: Package, path: '/admin/cases', label: 'nav.cases' },
  { icon: Sparkles, path: '/admin/import-vision', label: 'nav.importVision' },
  { icon: MessageCircle, path: '/admin/whatsapp', label: 'nav.whatsapp' },
  { icon: Users, path: '/admin/clients', label: 'nav.clients' },
  { icon: Calendar, path: '/admin/calendar', label: 'nav.calendar' },
  { icon: Box, path: '/admin/viewer-3d', label: 'viewer3d.title' },
  { icon: Receipt, path: '/admin/billing', label: 'nav.billing' },
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

  const getCurrentPageInfo = () => {
    const path = location.pathname;
    if (path === '/admin') return { title: t('nav.dashboard'), subtitle: t('dashboard.welcomeBack') };
    if (path.includes('/cases')) return { title: t('nav.cases'), subtitle: t('cases.subtitle') };
    if (path.includes('/clients')) return { title: t('nav.clients'), subtitle: t('clients.subtitle') };
    if (path.includes('/calendar')) return { title: t('nav.calendar'), subtitle: t('calendar.subtitle') };
    if (path.includes('/viewer-3d')) return { title: t('viewer3d.title'), subtitle: t('viewer3d.demoSubtitle') };
    if (path.includes('/price-lists')) return { title: t('nav.priceLists'), subtitle: t('priceLists.subtitle') };
    if (path.includes('/reports')) return { title: t('nav.reports'), subtitle: t('reports.insightDesc') };
    if (path.includes('/billing')) return { title: t('nav.billing'), subtitle: t('billing.banner.description') };
    if (path.includes('/invoices')) return { title: t('invoices.title'), subtitle: t('invoices.subtitle') };
    if (path.includes('/settings')) return { title: t('nav.settings'), subtitle: t('settings.subtitle') };
    return { title: 'Shen3D', subtitle: '' };
  };

  const pageInfo = getCurrentPageInfo();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface md:bg-grain">
      {/* Floating Sidebar - Desktop Only */}
      <aside className="hidden md:flex fixed start-3 top-3 bottom-3 w-[72px] bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-[1.5rem] flex-col items-center py-5 gap-1 z-50 shadow-elevated">
        {/* Logo */}
        <div className="w-11 h-11 bg-gradient-to-br from-brand to-brand-dark rounded-xl flex items-center justify-center mb-5 shadow-soft hover:scale-105 transition-transform duration-300">
          <span className="text-white font-bold text-lg font-display">S</span>
        </div>

        {/* Navigation Icons */}
        <nav className="flex flex-col gap-1.5 flex-1 w-full px-2.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200 relative group ${isActive
                  ? 'bg-brand text-white shadow-soft scale-105'
                  : 'text-slate-400 hover:bg-surface-secondary hover:text-slate-700'
                  }`}
                title={t(item.label)}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />

                {/* Active Indicator */}
                {isActive && (
                  <span className="absolute -end-0.5 top-1 w-1.5 h-1.5 bg-brand-accent rounded-full border-2 border-white" />
                )}

                {/* Tooltip */}
                <div className="absolute start-full ms-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap z-[60]">
                  {t(item.label)}
                </div>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
          title={t('auth.logout')}
        >
          <LogOut size={20} strokeWidth={2} />
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col mx-2 md:ms-[88px] md:me-3 my-2 md:my-3 mb-24 md:mb-3 overflow-hidden relative">

        {/* Header */}
        <header className="h-[68px] mb-3 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-[1.5rem] px-4 md:px-5 flex items-center justify-between z-40 shrink-0 shadow-soft">
          {/* Page Title */}
          <div className="flex flex-col min-w-0">
            <h1 className="text-lg md:text-xl font-semibold text-slate-800 font-display tracking-tight truncate">{pageInfo.title}</h1>
            {pageInfo.subtitle && (
              <p className="text-xs text-slate-500 mt-0.5 font-medium hidden md:block">{pageInfo.subtitle}</p>
            )}
          </div>

          {/* Date/Time Center - Desktop */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-slate-600 text-sm hidden md:flex">
            <Clock size={14} className="text-slate-400" />
            <span className="font-medium">
              {currentTime.toLocaleDateString(getDateLocale(), { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
            <span className="text-slate-300">|</span>
            <span className="font-semibold text-slate-700">
              {currentTime.toLocaleTimeString(getDateLocale(), { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Search */}
            <div className="relative group hidden md:block">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" size={15} />
              <input
                type="text"
                placeholder={t('common.search')}
                className="ps-9 pe-3 py-1.5 w-40 bg-surface-secondary hover:bg-white focus:bg-white rounded-full border border-transparent focus:border-sky-500/20 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/10 placeholder:text-slate-400 transition-all duration-300"
              />
            </div>

            <div className="flex items-center gap-2">
              <NotificationDropdown />
              <div className="w-px h-5 bg-slate-200 mx-0.5 hidden md:block" />
              <LanguageSelector />
              {/* Mobile logout */}
              <button
                onClick={logout}
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-50/60 transition-all"
                title={t('auth.logout')}
                aria-label={t('auth.logout')}
              >
                <LogOut size={18} strokeWidth={2} />
              </button>
            </div>

            {/* User Profile */}
            <div className="hidden md:flex items-center gap-2.5 ps-2 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="text-end hidden md:block">
                <p className="text-sm font-semibold text-slate-700">{user?.name || 'Admin'}</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{user?.role || 'admin'}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand to-brand-light flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white/80">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-auto rounded-[1.5rem] no-scrollbar">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <AdminMobileNav />
    </div>
  );
}
