import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, MessageSquare, RefreshCw, Truck, AlertTriangle } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const notificationIcons: Record<string, any> = {
  new_message: MessageSquare,
  status_change: RefreshCw,
  new_case: Truck,
  delay_alert: AlertTriangle,
  default: Bell,
};

const notificationColors: Record<string, string> = {
  new_message: 'bg-blue-100 text-blue-600',
  status_change: 'bg-amber-100 text-amber-600',
  new_case: 'bg-green-100 text-green-600',
  delay_alert: 'bg-red-100 text-red-600',
  default: 'bg-neutral-100 text-neutral-600',
};

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    return notificationIcons[type] || notificationIcons.default;
  };

  const getColor = (type: string) => {
    return notificationColors[type] || notificationColors.default;
  };

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-xl flex items-center justify-center text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -end-1 min-w-[20px] h-5 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute end-0 mt-2 w-96 bg-white rounded-2xl shadow-lg border border-neutral-100 overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
            <h3 className="font-semibold text-neutral-800">Notifiche</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-brand-primary hover:text-brand-primary/80 flex items-center gap-1"
              >
                <CheckCheck size={14} />
                Segna tutte lette
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-neutral-400">
                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nessuna notifica</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => {
                const Icon = getIcon(notification.notificationType);
                const colorClass = getColor(notification.notificationType);

                return (
                  <Link
                    key={notification.id}
                    to={notification.link || '#'}
                    onClick={() => handleNotificationClick(notification.id)}
                    className={`block px-4 py-3 border-b border-neutral-50 hover:bg-neutral-50 transition-colors ${
                      !notification.isRead ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm ${!notification.isRead ? 'font-semibold text-neutral-800' : 'text-neutral-700'}`}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-neutral-400 mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: it,
                          })}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-neutral-100 text-center">
              <Link
                to="/admin/notifications"
                onClick={() => setIsOpen(false)}
                className="text-sm text-brand-primary hover:text-brand-primary/80"
              >
                Vedi tutte le notifiche
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
