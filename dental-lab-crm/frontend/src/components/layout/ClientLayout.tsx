import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  User,
  LogOut,
  MessageSquare,
  Clock
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { LanguageSelector } from './LanguageSelector';
import { NotificationDropdown } from '@/components/notifications';

const navItems = [
  { icon: LayoutDashboard, path: '/portal', end: true },
  { icon: PlusCircle, path: '/portal/new-case' },
  { icon: ClipboardList, path: '/portal/cases' },
  { icon: User, path: '/portal/profile' },
];

export function ClientLayout() {
  const navigate = useNavigate();
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-mesh">
      {/* Floating Glass Sidebar - Teal Theme */}
      <aside className="fixed start-4 top-4 bottom-4 w-[80px] glass-sidebar rounded-[1.5rem] flex flex-col items-center py-6 gap-4 z-50 transition-all duration-300">
        {/* Logo */}
        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-teal-500/20 hover:scale-105 transition-transform duration-300">
          <span className="text-white font-bold text-lg">S</span>
        </div>

        {/* Navigation Icons */}
        <nav className="flex flex-col gap-2 flex-1 w-full px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 relative group ${
                  isActive
                    ? 'bg-[#4ECDC4] text-white shadow-lg shadow-teal-500/20 scale-105'
                    : 'text-slate-400 hover:bg-white/50 hover:text-slate-700 hover:scale-105'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} strokeWidth={2} />
                  {/* Active Indicator Dot */}
                  {isActive && (
                    <span className="absolute -end-1 top-1 w-2 h-2 bg-teal-500 rounded-full border-2 border-white" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Switch to Admin (DEV only) */}
        {import.meta.env.DEV && (
          <button
            onClick={() => {
              localStorage.removeItem('auth-storage');
              window.location.href = '/admin';
            }}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all duration-300"
            title="Vai all'Admin (DEV)"
          >
            <span className="text-xs font-bold">A</span>
          </button>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50/50 transition-all duration-300"
        >
          <LogOut size={20} strokeWidth={2} />
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col ms-[100px] me-4 my-4 overflow-hidden relative">
        {/* Glass Header */}
        <header className="h-[72px] mb-4 glass rounded-[1.5rem] px-6 flex items-center justify-between z-40 shrink-0 relative">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Portale Cliente</h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{user?.client?.studioName || user?.name || 'Studio Dentistico'}</p>
          </div>

          {/* Date/Time Center - Subtle & Clean */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-slate-600 text-sm">
            <span className="font-medium">
              {currentTime.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
            <span className="text-slate-300">|</span>
            <span className="font-semibold text-slate-700">
              {currentTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <NotificationDropdown />

            {/* Messages - placeholder */}
            <button className="relative w-10 h-10 rounded-xl bg-slate-100/50 hover:bg-white/80 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all">
              <MessageSquare size={20} />
            </button>

            <div className="w-px h-6 bg-slate-200 mx-1" />

            {/* Language */}
            <LanguageSelector />

            {/* User Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white/60">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-auto rounded-[2rem] no-scrollbar">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
