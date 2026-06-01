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
    <div className="flex h-screen w-full overflow-hidden bg-surface md:bg-grain">
      {/* Floating Sidebar - Desktop Only */}
      <aside className="hidden md:flex fixed start-3 top-3 bottom-3 w-[72px] bg-white/80 backdrop-blur-xl border border-stone-200/50 rounded-[1.5rem] flex-col items-center py-5 gap-1 z-50 shadow-elevated">
        {/* Logo */}
        <div className="w-11 h-11 bg-gradient-to-br from-brand-accent to-brand-accent-dark rounded-xl flex items-center justify-center mb-5 shadow-soft hover:scale-105 transition-transform duration-300">
          <span className="text-white font-bold text-lg font-display">S</span>
        </div>

        {/* Navigation Icons */}
        <nav className="flex flex-col gap-1.5 flex-1 w-full px-2.5">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200 relative group ${
                  isActive
                    ? 'bg-brand-accent text-white shadow-soft scale-105'
                    : 'text-stone-400 hover:bg-surface-secondary hover:text-stone-700'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  {isActive && (
                    <span className="absolute -end-0.5 top-1 w-1.5 h-1.5 bg-brand rounded-full border-2 border-white" />
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
            className="w-10 h-10 flex items-center justify-center rounded-xl text-stone-400 hover:text-brand hover:bg-brand/5 transition-all duration-200"
            title={t('common.devAdmin')}
          >
            <span className="text-xs font-bold">A</span>
          </button>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-stone-400 hover:text-red-500/80 hover:bg-red-50/60 transition-all duration-200"
        >
          <LogOut size={20} strokeWidth={2} />
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col mx-2 md:ms-[88px] md:me-3 my-2 md:my-3 mb-24 md:mb-3 overflow-hidden relative">
        {/* Header */}
        <header className="h-[68px] mb-3 bg-white/70 backdrop-blur-xl border border-stone-200/50 rounded-[1.5rem] px-5 flex items-center justify-between z-40 shrink-0 shadow-soft">
          <div className="flex flex-col min-w-0">
            <h1 className="text-xl font-semibold text-stone-800 font-display tracking-tight">{t('portal.headerTitle')}</h1>
            <p className="text-xs text-stone-500 mt-0.5 font-medium">{user?.client?.studioName || user?.name || t('portal.defaultStudioName')}</p>
          </div>

          {/* Date/Time Center - Desktop */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-stone-600 text-sm hidden md:flex">
            <Clock size={14} className="text-stone-400" />
            <span className="font-medium">
              {currentTime.toLocaleDateString(dateLocale, { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
            <span className="text-stone-300">|</span>
            <span className="font-semibold text-stone-700">
              {currentTime.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <NotificationDropdown />
            <button className="hidden md:flex relative w-9 h-9 rounded-xl bg-surface-secondary hover:bg-white items-center justify-center text-stone-500 hover:text-stone-800 transition-all border border-stone-200/50">
              <MessageSquare size={18} />
            </button>
            <div className="w-px h-5 bg-stone-200 mx-0.5 hidden md:block" />
            <LanguageSelector />
            {/* Mobile logout */}
            <button
              onClick={handleLogout}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-stone-500 hover:text-red-500/80 hover:bg-red-50/50 transition-all"
              title={t('auth.logout')}
              aria-label={t('auth.logout')}
            >
              <LogOut size={18} strokeWidth={2} />
            </button>
            {/* User Avatar - Desktop */}
            <div className="hidden md:flex w-9 h-9 rounded-full bg-gradient-to-tr from-brand-accent to-brand-accent-light items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white/80">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-auto rounded-[1.5rem] no-scrollbar">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <ClientMobileNav />
    </div>
  );
}
