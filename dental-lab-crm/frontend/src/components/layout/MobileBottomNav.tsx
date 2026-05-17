import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home,
  Package,
  Plus,
  MessageSquare,
  Settings,
  Users,
  LucideIcon,
} from 'lucide-react';

interface NavItem {
  icon: LucideIcon;
  path: string;
  label: string;
  exact?: boolean;
}

interface MobileBottomNavProps {
  items: NavItem[];
}

function MobileBottomNavBase({ items }: MobileBottomNavProps) {
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/80 backdrop-blur-xl border-t border-white/50 safe-area-inset-bottom">
      <div className="grid grid-cols-5 h-16 w-full">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`
              }
              title={t(item.label)}
            >
              <Icon size={20} strokeWidth={2} />
              <span className="text-[10px] font-medium truncate px-1">
                {t(item.label)}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export function AdminMobileNav() {
  const adminItems: NavItem[] = [
    { icon: Home, path: '/admin', label: 'nav.dashboard', exact: true },
    { icon: Package, path: '/admin/cases', label: 'nav.cases' },
    { icon: Plus, path: '/admin/cases/new', label: 'cases.newCase' },
    { icon: Users, path: '/admin/clients', label: 'nav.clients' },
    { icon: Settings, path: '/admin/settings', label: 'nav.settings' },
  ];

  return <MobileBottomNavBase items={adminItems} />;
}

export function ClientMobileNav() {
  const clientItems: NavItem[] = [
    { icon: Home, path: '/client', label: 'nav.dashboard', exact: true },
    { icon: Package, path: '/client/cases', label: 'nav.cases' },
    { icon: Plus, path: '/client/new-case', label: 'cases.newCase' },
    { icon: MessageSquare, path: '/client/chat', label: 'nav.chat' },
    { icon: Settings, path: '/client/profile', label: 'nav.profile' },
  ];

  return <MobileBottomNavBase items={clientItems} />;
}
