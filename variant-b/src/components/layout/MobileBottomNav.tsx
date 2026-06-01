import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home,
  Package,
  Plus,
  MessageSquare,
  Calendar,
  User,
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
  fabPath: string;
  accentColor: string;
}

function MobileBottomNavBase({ items, fabPath, accentColor }: MobileBottomNavProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const left = items.slice(0, 2);
  const right = items.slice(2, 4);

  return (
    <nav
      className="fixed bottom-3 left-3 right-3 z-50 md:hidden bg-white/80 backdrop-blur-xl border border-stone-200/50 rounded-[1.75rem] h-[68px] grid grid-cols-5 items-center shadow-elevated safe-area-inset-bottom"
      aria-label="Mobile navigation"
    >
      {left.map((item) => (
        <NavItemView key={item.path} item={item} t={t} accentColor={accentColor} />
      ))}

      {/* Center FAB */}
      <button
        type="button"
        onClick={() => navigate(fabPath)}
        className={`w-12 h-12 mx-auto -mt-5 rounded-full ${accentColor} text-white flex items-center justify-center shadow-soft-lg active:scale-95 transition-transform`}
        aria-label={t('cases.newCase')}
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>

      {right.map((item) => (
        <NavItemView key={item.path} item={item} t={t} accentColor={accentColor} />
      ))}
    </nav>
  );
}

function NavItemView({
  item,
  t,
  accentColor,
}: {
  item: NavItem;
  t: (key: string) => string;
  accentColor: string;
}) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
      end={item.exact}
      className={({ isActive }) =>
        `relative flex flex-col items-center justify-center gap-0.5 h-full text-[10px] font-semibold tracking-tight transition-colors ${
          isActive ? 'text-brand' : 'text-stone-500'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className={`absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-b-md ${accentColor}`} />
          )}
          <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
          <span className="truncate px-1">{t(item.label)}</span>
        </>
      )}
    </NavLink>
  );
}

export function AdminMobileNav() {
  const adminItems: NavItem[] = [
    { icon: Home, path: '/admin', label: 'nav.dashboard', exact: true },
    { icon: Package, path: '/admin/cases', label: 'nav.cases' },
    { icon: Calendar, path: '/admin/calendar', label: 'nav.calendar' },
    { icon: Users, path: '/admin/clients', label: 'nav.clients' },
  ];

  return (
    <MobileBottomNavBase
      items={adminItems}
      fabPath="/admin/cases/new"
      accentColor="bg-brand"
    />
  );
}

export function ClientMobileNav() {
  const clientItems: NavItem[] = [
    { icon: Home, path: '/portal', label: 'nav.dashboard', exact: true },
    { icon: Package, path: '/portal/cases', label: 'nav.cases' },
    { icon: MessageSquare, path: '/portal/chat', label: 'nav.chat' },
    { icon: User, path: '/portal/profile', label: 'nav.profile' },
  ];

  return (
    <MobileBottomNavBase
      items={clientItems}
      fabPath="/portal/new-case"
      accentColor="bg-brand-accent"
    />
  );
}
