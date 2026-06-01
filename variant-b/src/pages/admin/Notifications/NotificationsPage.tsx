import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  Package,
  MessageSquare,
  AlertCircle,
  Clock,
  Euro,
  Check,
  Trash2,
  MailOpen,
  Settings,
  Inbox,
} from 'lucide-react';

type NotificationType = 'case' | 'message' | 'payment' | 'alert' | 'system';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

const typeConfig: Record<NotificationType, { icon: typeof Bell; color: string; bg: string; ring: string }> = {
  case:     { icon: Package,     color: 'text-green-800', bg: 'bg-green-50', ring: 'ring-teal-500/20' },
  message:  { icon: MessageSquare, color: 'text-amber-800', bg: 'bg-orange-50', ring: 'ring-sky-500/20' },
  payment:  { icon: Euro,        color: 'text-emerald-600', bg: 'bg-green-50', ring: 'ring-emerald-500/20' },
  alert:    { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', ring: 'ring-red-500/20' },
  system:   { icon: Bell,        color: 'text-stone-500', bg: 'bg-stone-100', ring: 'ring-slate-400/20' },
};

export default function NotificationsPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'case',
      title: t('notifications.newCase'),
      message: 'Clinica Dentale Rossi - Corona su impianto 16',
      time: '5 min',
      read: false,
      actionUrl: '/admin/cases/new-123',
      actionLabel: t('notifications.viewCase')
    },
    {
      id: '2',
      type: 'message',
      title: t('notifications.newMessage'),
      message: '#2024-089',
      time: '15 min',
      read: false,
      actionUrl: '/admin/cases/089',
      actionLabel: t('notifications.readMessage')
    },
    {
      id: '3',
      type: 'alert',
      title: t('notifications.delayAlert'),
      message: '#2024-075',
      time: '1h',
      read: false,
      actionUrl: '/admin/cases/075',
      actionLabel: t('notifications.manageCase')
    },
    {
      id: '4',
      type: 'payment',
      title: t('notifications.paymentReceived'),
      message: '₪1,820 - FT-2024-003',
      time: '2h',
      read: true,
      actionUrl: '/admin/invoices',
      actionLabel: t('notifications.viewInvoice')
    },
    {
      id: '5',
      type: 'case',
      title: t('notifications.caseCompleted'),
      message: '#2024-088',
      time: '3h',
      read: true,
    },
    {
      id: '6',
      type: 'system',
      title: t('notifications.backupCompleted'),
      message: t('notifications.backupCompletedDesc'),
      time: '6h',
      read: true,
    },
    {
      id: '7',
      type: 'message',
      title: t('notifications.changeRequest'),
      message: '#2024-082',
      time: '1d',
      read: true,
      actionUrl: '/admin/cases/082',
      actionLabel: t('notifications.view')
    },
    {
      id: '8',
      type: 'alert',
      title: t('notifications.overdueInvoice'),
      message: t('notifications.overdueInvoiceDesc'),
      time: '1d',
      read: true,
      actionUrl: '/admin/invoices',
      actionLabel: t('notifications.manage')
    },
  ]);

  const filteredNotifications = notifications.filter(n =>
    filter === 'all' || n.type === filter
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filterOptions: { value: NotificationType | 'all'; label: string; icon: typeof Bell }[] = [
    { value: 'all', label: t('notifications.all'), icon: Inbox },
    { value: 'case', label: t('notifications.cases'), icon: Package },
    { value: 'message', label: t('notifications.messages_cat'), icon: MessageSquare },
    { value: 'payment', label: t('notifications.payments'), icon: Euro },
    { value: 'alert', label: t('notifications.alerts_cat'), icon: AlertCircle },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* WIP banner */}
      <div className="rounded-xl border border-amber-200 bg-orange-50/80 px-5 py-4 text-sm text-amber-900 shadow-soft">
        <strong>🚧 {t('notifications.pageUnderConstruction')}</strong>{' '}
        {t('notifications.pageUnderConstructionDesc')}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">{t('notifications.title')}</h1>
          <p className="text-sm text-stone-500 mt-1">
            {unreadCount > 0
              ? t('notifications.youHaveUnread', { count: unreadCount })
              : t('notifications.allRead')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-all flex items-center gap-2 shadow-soft text-sm font-medium"
            >
              <MailOpen size={16} />
              {t('notifications.markAllRead')}
            </button>
          )}
          <button className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-all shadow-soft">
            <Settings size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Filter */}
        <div className="space-y-4">
          <div className="card-base p-4">
            <h3 className="font-semibold text-stone-800 mb-3 text-sm">{t('notifications.filterByType')}</h3>
            <div className="space-y-1">
              {filterOptions.map((opt) => {
                const count = opt.value === 'all'
                  ? notifications.length
                  : notifications.filter(n => n.type === opt.value).length;
                const Icon = opt.icon;
                const active = filter === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setFilter(opt.value)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-sm ${
                      active
                        ? 'bg-orange-50 text-sky-700 shadow-soft ring-1 ring-sky-500/20'
                        : 'text-stone-600 hover:bg-stone-50 hover:text-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={16} className={active ? 'text-amber-800' : 'text-stone-400'} />
                      <span className="font-medium">{opt.label}</span>
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                      active
                        ? 'bg-amber-800 text-white shadow-sm'
                        : 'bg-stone-100 text-stone-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card-base p-4">
            <h3 className="font-semibold text-stone-800 mb-3 text-sm">{t('notifications.summary')}</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-stone-600">{t('notifications.unread')}</span>
                <span className="font-semibold text-amber-800">{unreadCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-stone-600">{t('notifications.today')}</span>
                <span className="font-semibold text-stone-800">
                  {notifications.filter(n => n.time.includes('min') || n.time.includes('h')).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-stone-600">{t('notifications.total')}</span>
                <span className="font-semibold text-stone-800">{notifications.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="lg:col-span-3 space-y-3">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => {
              const config = typeConfig[notification.type];
              const Icon = config.icon;
              return (
                <div
                  key={notification.id}
                  className={`card-base p-4 transition-all ${
                    !notification.read
                      ? 'ring-1 ring-sky-500/20 bg-orange-50/40'
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0 ring-1 ${config.ring}`}>
                      <Icon size={20} className={config.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className={`font-semibold text-sm ${!notification.read ? 'text-stone-800' : 'text-stone-600'}`}>
                            {notification.title}
                          </h4>
                          <p className="text-sm text-stone-500 mt-1">{notification.message}</p>
                          <div className="flex items-center gap-4 mt-3">
                            <span className="text-xs text-stone-400 flex items-center gap-1">
                              <Clock size={12} />
                              {notification.time}
                            </span>
                            {notification.actionUrl && (
                              <button className="text-xs font-semibold text-amber-800 hover:text-sky-700 hover:underline transition-colors">
                                {notification.actionLabel || t('notifications.view')}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-green-800 hover:bg-green-50 transition-all"
                              title={t('notifications.markAsRead')}
                            >
                              <Check size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            title={t('common.delete')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="card-base p-12 text-center">
              <div className="w-16 h-16 bg-stone-50 rounded-xl flex items-center justify-center mx-auto mb-4 ring-1 ring-slate-100">
                <Bell size={28} className="text-slate-300" />
              </div>
              <p className="text-stone-500 font-medium">{t('notifications.noNotificationsInCategory')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Notification Settings Hint */}
      <div className="card-base p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center ring-1 ring-slate-200">
            <Settings size={22} className="text-stone-600" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-800">{t('notifications.notificationPreferences')}</h3>
            <p className="text-sm text-stone-500">{t('notifications.notificationPreferencesDesc')}</p>
          </div>
        </div>
        <button className="px-4 py-2.5 bg-stone-800 text-white rounded-xl text-sm font-semibold hover:bg-stone-700 transition-all shadow-soft">
          {t('notifications.configure')}
        </button>
      </div>
    </div>
  );
}
