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
    <div className="flex h-screen w-full overflow-hidden bg-white">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex fixed start-0 top-0 bottom-0 w-[72px] bg-white border-r border-gray-200 flex-col items-center py-5 gap-1 z-50">
        {/* Logo */}
        <div className="w-11 h-11 bg-blue-600 flex items-center justify-center mb-5 hover:opacity-90 transition-opacity">
          <span className="text-white font-bold text-lg">S</span>
        </div>

        {/* Navigation Icons */}
        <nav className="flex flex-col gap-1 flex-1 w-full px-2.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`w-11 h-11 flex items-center justify-center transition-colors duration-200 relative group ${isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                title={t(item.label)}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />

                {/* Active Indicator */}
                {isActive && (
                  <span className="absolute -end-0 top-1 w-1 h-1 bg-blue-400 border border-white" />
                )}

                {/* Tooltip */}
                <div className="absolute start-full ms-3 px-2.5 py-1.5 bg-gray-800 text-white text-xs font-medium opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap z-[60]">
                  {t(item.label)}
                </div>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors duration-200"
          title={t('auth.logout')}
        >
          <LogOut size={20} strokeWidth={2} />
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:ms-[72px] overflow-hidden relative">

        {/* Header */}
        <header className="h-[68px] border-b border-gray-200 px-4 md:px-5 flex items-center justify-between z-40 shrink-0">
          {/* Page Title */}
          <div className="flex flex-col min-w-0">
            <h1 className="text-lg md:text-xl font-semibold text-gray-900 tracking-tight truncate">{pageInfo.title}</h1>
            {pageInfo.subtitle && (
              <p className="text-xs text-gray-500 mt-0.5 font-medium hidden md:block">{pageInfo.subtitle}</p>
            )}
          </div>

          {/* Date/Time Center - Desktop */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-gray-600 text-sm hidden md:flex">
            <Clock size={14} className="text-gray-400" />
            <span className="font-medium">
              {currentTime.toLocaleDateString(getDateLocale(), { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
            <span className="text-gray-300">|</span>
            <span className="font-semibold text-gray-700">
              {currentTime.toLocaleTimeString(getDateLocale(), { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Search */}
            <div className="relative group hidden md:block">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={15} />
              <input
                type="text"
                placeholder={t('common.search')}
                className="ps-9 pe-3 py-1.5 w-40 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 text-sm focus:outline-none focus:border-blue-600 placeholder:text-gray-400 transition-colors duration-300"
              />
            </div>

            <div className="flex items-center gap-2">
              <NotificationDropdown />
              <div className="w-px h-5 bg-gray-200 mx-0.5 hidden md:block" />
              <LanguageSelector />
              {/* Mobile logout */}
              <button
                onClick={logout}
                className="md:hidden w-9 h-9 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                title={t('auth.logout')}
                aria-label={t('auth.logout')}
              >
                <LogOut size={18} strokeWidth={2} />
              </button>
            </div>

            {/* User Profile */}
            <div className="hidden md:flex items-center gap-2.5 ps-2 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="text-end hidden md:block">
                <p className="text-sm font-semibold text-gray-700">{user?.name || 'Admin'}</p>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{user?.role || 'admin'}</p>
              </div>
              <div className="w-9 h-9 bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-auto no-scrollbar">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <AdminMobileNav />
    </div>
  );
}
