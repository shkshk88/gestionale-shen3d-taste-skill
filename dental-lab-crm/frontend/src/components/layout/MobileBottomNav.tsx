import { NavLink, useNavigate } from 'react-router-dom';
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
  fabPath: string;
  accentFrom: string;
  accentTo: string;
}

function MobileBottomNavBase({ items, fabPath, accentFrom, accentTo }: MobileBottomNavProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Two side items left, FAB center, two side items right
  const left = items.slice(0, 2);
  const right = items.slice(2, 4);

  return (
    <nav
      className="fixed bottom-4 left-3 right-3 z-50 md:hidden glass-v3-nav rounded-[28px] h-16 grid grid-cols-5 items-center safe-area-inset-bottom"
      aria-label="Mobile navigation"
    >
      {left.map((item) => (
        <NavItemView key={item.path} item={item} t={t} accentFrom={accentFrom} accentTo={accentTo} />
      ))}

      {/* Center FAB */}
      <button
        type="button"
        onClick={() => navigate(fabPath)}
        className={`w-[50px] h-[50px] mx-auto -mt-5 rounded-2xl bg-gradient-to-br ${accentFrom} ${accentTo} text-white flex items-center justify-center shadow-[0_6px_18px_rgba(37,99,235,0.45),0_2px_6px_rgba(37,99,235,0.3),inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(15,23,42,0.08)] active:scale-95 transition-transform`}
        aria-label={t('cases.newCase')}
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>

      {right.map((item) => (
        <NavItemView key={item.path} item={item} t={t} accentFrom={accentFrom} accentTo={accentTo} />
      ))}
    </nav>
  );
}

function NavItemView({
  item,
  t,
  accentFrom,
  accentTo,
}: {
  item: NavItem;
  t: (key: string) => string;
  accentFrom: string;
  accentTo: string;
}) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
      end={item.exact}
      className={({ isActive }) =>
        `relative flex flex-col items-center justify-center gap-0.5 h-full text-[10px] font-semibold tracking-tight transition-colors ${
          isActive ? 'text-blue-600' : 'text-slate-500'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              className={`absolute top-0 left-1/2 -translate-x-1/2 w-7 h-[2.5px] rounded-b-md bg-gradient-to-r ${accentFrom} ${accentTo} shadow-[0_0_8px_rgba(37,99,235,0.4)]`}
            />
          )}
          <Icon size={20} strokeWidth={2} />
          <span className="truncate px-1">{t(item.label)}</span>
        </>
      )}
    </NavLink>
  );
}

export function AdminMobileNav() {
  // 4 nav items + center FAB = 5 columns
  const adminItems: NavItem[] = [
    { icon: Home, path: '/admin', label: 'nav.dashboard', exact: true },
    { icon: Package, path: '/admin/cases', label: 'nav.cases' },
    { icon: Users, path: '/admin/clients', label: 'nav.clients' },
    { icon: Settings, path: '/admin/settings', label: 'nav.settings' },
  ];

  return (
    <MobileBottomNavBase
      items={adminItems}
      fabPath="/admin/cases/new"
      accentFrom="from-blue-600"
      accentTo="to-indigo-600"
    />
  );
}

export function ClientMobileNav() {
  const clientItems: NavItem[] = [
    { icon: Home, path: '/portal', label: 'nav.dashboard', exact: true },
    { icon: Package, path: '/portal/cases', label: 'nav.cases' },
    { icon: MessageSquare, path: '/portal/chat', label: 'nav.chat' },
    { icon: Settings, path: '/portal/profile', label: 'nav.profile' },
  ];

  return (
    <MobileBottomNavBase
      items={clientItems}
      fabPath="/portal/new-case"
      accentFrom="from-teal-500"
      accentTo="to-cyan-600"
    />
  );
}
