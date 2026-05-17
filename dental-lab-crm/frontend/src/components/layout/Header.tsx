import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { Search, ChevronDown, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/authStore'
import { LanguageSelector } from './LanguageSelector'
import { NotificationDropdown } from '@/components/notifications'

interface HeaderProps {
  isClientPortal?: boolean
}

export function Header({ isClientPortal: _isClientPortal }: HeaderProps) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('it-IT', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) + ' - ' + date.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative w-72">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('common.search')}
            className="ps-10"
          />
        </div>
      </div>

      {/* Date/Time Center */}
      <div className="flex items-center gap-2 text-foreground bg-slate-100 border border-slate-200 px-4 py-2 rounded-lg shadow-sm">
        <Clock className="h-4 w-4 text-slate-600" />
        <span className="text-sm font-semibold text-slate-700">
          {formatDateTime(currentTime)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Language Selector */}
        <LanguageSelector />

        {/* Notifications */}
        <NotificationDropdown />

        {/* User Menu */}
        <Button variant="ghost" className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatarUrl} />
            <AvatarFallback>
              {user?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium md:inline-block">
            {user?.name || t('nav.userLabel')}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
