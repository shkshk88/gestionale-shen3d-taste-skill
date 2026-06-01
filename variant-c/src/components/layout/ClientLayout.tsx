import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  User,
  LogOut,
  MessageSquare,
  Clock,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { LanguageSelector } from './LanguageSelector';
import { NotificationDropdown } from '@/components/notifications';
import { ClientMobileNav } from './MobileBottomNav';

const navItems = [
  { icon: LayoutDashboard, path: '/portal', end: true },
  { icon: PlusCircle, path: '/portal/new-case' },
  { icon: ClipboardList, path: '/portal/cases' },
  { icon: User, path: '/portal/profile' },
];

export function ClientLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { t, i18n } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());

  const dateLocale = i18n.language === 'he' ? 'he-IL' : i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'en' ? 'en-US' : 'it-IT';

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `w-11 h-11 flex items-center justify-center transition-colors duration-200 relative group ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  {isActive && (
                    <span className="absolute -end-0 top-1 w-1 h-1 bg-blue-400 border border-white" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* DEV switch */}
        {import.meta.env.DEV && (
          <button
            onClick={() => {
              localStorage.removeItem('auth-storage');
              window.location.href = '/admin';
            }}
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
            title={t('common.devAdmin')}
          >
            <span className="text-xs font-bold">A</span>
          </button>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors duration-200"
        >
          <LogOut size={20} strokeWidth={2} />
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:ms-[72px] overflow-hidden relative">
        {/* Header */}
        <header className="h-[68px] border-b border-gray-200 px-5 flex items-center justify-between z-40 shrink-0">
          <div className="flex flex-col min-w-0">
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">{t('portal.headerTitle')}</h1>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">{user?.client?.studioName || user?.name || t('portal.defaultStudioName')}</p>
          </div>

          {/* Date/Time Center - Desktop */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-gray-600 text-sm hidden md:flex">
            <Clock size={14} className="text-gray-400" />
            <span className="font-medium">
              {currentTime.toLocaleDateString(dateLocale, { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
            <span className="text-gray-300">|</span>
            <span className="font-semibold text-gray-700">
              {currentTime.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <NotificationDropdown />
            <button className="hidden md:flex relative w-9 h-9 bg-gray-50 hover:bg-white items-center justify-center text-gray-500 hover:text-gray-800 transition-colors border border-gray-200">
              <MessageSquare size={18} />
            </button>
            <div className="w-px h-5 bg-gray-200 mx-0.5 hidden md:block" />
            <LanguageSelector />
            {/* Mobile logout */}
            <button
              onClick={handleLogout}
              className="md:hidden w-9 h-9 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
              title={t('auth.logout')}
              aria-label={t('auth.logout')}
            >
              <LogOut size={18} strokeWidth={2} />
            </button>
            {/* User Avatar - Desktop */}
            <div className="hidden md:flex w-9 h-9 bg-blue-600 items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-auto no-scrollbar">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <ClientMobileNav />
    </div>
  );
}
