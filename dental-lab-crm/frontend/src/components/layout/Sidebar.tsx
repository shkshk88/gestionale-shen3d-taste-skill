import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ClipboardList,
  Workflow,
  Calendar,
  Users,
  Settings,
  Receipt,
  Globe,
  FileText,
} from 'lucide-react'

const navItems = [
  { key: 'dashboard', icon: LayoutDashboard, path: '/admin' },
  { key: 'cases', icon: ClipboardList, path: '/admin/cases' },
  { key: 'workflow', icon: Workflow, path: '/admin/workflow' },
  { key: 'calendar', icon: Calendar, path: '/admin/calendar' },
  { key: 'clients', icon: Users, path: '/admin/clients' },
  { key: 'priceLists', icon: FileText, path: '/admin/pricelists' },
  { key: 'billing', icon: Receipt, path: '/admin/billing' },
  { key: 'clientPortal', icon: Globe, path: '/portal' },
  { key: 'settings', icon: Settings, path: '/admin/settings' },
]

export function Sidebar() {
  const { t } = useTranslation()

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <img src="/logo.png" alt="Shen3D" className="h-10 w-10" />
        <div>
          <h1 className="text-lg font-bold text-white">Shen3D</h1>
          <p className="text-xs text-sidebar-foreground/70">{t('nav.labManagement')}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            end={item.path === '/admin'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {t(`nav.${item.key}`)}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium">
            U
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{t('nav.userLabel')}</p>
            <p className="text-xs text-sidebar-foreground/70">{t('auth.logout')}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
