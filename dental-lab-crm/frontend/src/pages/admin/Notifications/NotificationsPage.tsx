import { useState } from 'react';
import {
  Bell,
  Package,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  Euro,
  Users,
  Check,
  Trash2,
  Filter,
  MailOpen,
  Settings
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

const typeConfig: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  case: { icon: Package, color: 'text-card-teal', bg: 'bg-card-teal/10' },
  message: { icon: MessageSquare, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
  payment: { icon: Euro, color: 'text-green-600', bg: 'bg-green-100' },
  alert: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100' },
  system: { icon: Bell, color: 'text-neutral-500', bg: 'bg-neutral-100' },
};

export default function NotificationsPage() {
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'case',
      title: 'Nuovo caso ricevuto',
      message: 'Clinica Dentale Rossi ha inviato un nuovo caso: Corona su impianto 16',
      time: '5 minuti fa',
      read: false,
      actionUrl: '/admin/cases/new-123',
      actionLabel: 'Visualizza caso'
    },
    {
      id: '2',
      type: 'message',
      title: 'Nuovo messaggio',
      message: 'Dr. Verdi ha inviato un messaggio riguardo al caso #2024-089',
      time: '15 minuti fa',
      read: false,
      actionUrl: '/admin/cases/089',
      actionLabel: 'Leggi messaggio'
    },
    {
      id: '3',
      type: 'alert',
      title: 'Caso in ritardo',
      message: 'Il caso #2024-075 per Studio Bianchi ha superato la data di consegna prevista',
      time: '1 ora fa',
      read: false,
      actionUrl: '/admin/cases/075',
      actionLabel: 'Gestisci caso'
    },
    {
      id: '4',
      type: 'payment',
      title: 'Pagamento ricevuto',
      message: 'Dental Care Center ha effettuato il pagamento di €1,820 per la fattura FT-2024-003',
      time: '2 ore fa',
      read: true,
      actionUrl: '/admin/invoices',
      actionLabel: 'Vedi fattura'
    },
    {
      id: '5',
      type: 'case',
      title: 'Caso completato',
      message: 'Il caso #2024-088 è stato completato e pronto per la consegna',
      time: '3 ore fa',
      read: true,
    },
    {
      id: '6',
      type: 'system',
      title: 'Backup completato',
      message: 'Il backup giornaliero dei dati è stato completato con successo',
      time: '6 ore fa',
      read: true,
    },
    {
      id: '7',
      type: 'message',
      title: 'Richiesta modifica',
      message: 'Smile Center Ferrari richiede una modifica al caso #2024-082',
      time: 'Ieri',
      read: true,
      actionUrl: '/admin/cases/082',
      actionLabel: 'Visualizza'
    },
    {
      id: '8',
      type: 'alert',
      title: 'Fattura scaduta',
      message: 'La fattura FT-2024-005 per Clinica Dentale Rossi risulta scaduta',
      time: 'Ieri',
      read: true,
      actionUrl: '/admin/invoices',
      actionLabel: 'Gestisci'
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
    { value: 'all', label: 'Tutte', icon: Bell },
    { value: 'case', label: 'Casi', icon: Package },
    { value: 'message', label: 'Messaggi', icon: MessageSquare },
    { value: 'payment', label: 'Pagamenti', icon: Euro },
    { value: 'alert', label: 'Avvisi', icon: AlertCircle },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Notifiche</h1>
          <p className="text-sm text-neutral-500">
            {unreadCount > 0
              ? `Hai ${unreadCount} notifiche non lette`
              : 'Tutte le notifiche sono state lette'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-all flex items-center gap-2"
            >
              <MailOpen size={18} />
              Segna tutte come lette
            </button>
          )}
          <button className="w-10 h-10 rounded-xl bg-surface-secondary flex items-center justify-center text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200 transition-all">
            <Settings size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Filter */}
        <div className="space-y-4">
          <div className="card-base p-4">
            <h3 className="font-medium text-neutral-800 mb-3">Filtra per tipo</h3>
            <div className="space-y-1">
              {filterOptions.map((opt) => {
                const count = opt.value === 'all'
                  ? notifications.length
                  : notifications.filter(n => n.type === opt.value).length;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setFilter(opt.value)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                      filter === opt.value
                        ? 'bg-brand-primary/10 text-brand-primary'
                        : 'text-neutral-600 hover:bg-surface-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} />
                      <span className="text-sm font-medium">{opt.label}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      filter === opt.value
                        ? 'bg-brand-primary text-white'
                        : 'bg-surface-secondary text-neutral-500'
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
            <h3 className="font-medium text-neutral-800 mb-3">Riepilogo</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Non lette</span>
                <span className="font-semibold text-brand-primary">{unreadCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Oggi</span>
                <span className="font-semibold text-neutral-800">
                  {notifications.filter(n => n.time.includes('fa') || n.time.includes('minuti')).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Totale</span>
                <span className="font-semibold text-neutral-800">{notifications.length}</span>
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
                    !notification.read ? 'border-l-4 border-brand-primary bg-brand-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={20} className={config.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className={`font-medium ${!notification.read ? 'text-neutral-800' : 'text-neutral-600'}`}>
                            {notification.title}
                          </h4>
                          <p className="text-sm text-neutral-500 mt-1">{notification.message}</p>
                          <div className="flex items-center gap-4 mt-3">
                            <span className="text-xs text-neutral-400 flex items-center gap-1">
                              <Clock size={12} />
                              {notification.time}
                            </span>
                            {notification.actionUrl && (
                              <button className="text-xs font-medium text-brand-primary hover:underline">
                                {notification.actionLabel || 'Visualizza'}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-green-600 hover:bg-green-50 transition-all"
                              title="Segna come letta"
                            >
                              <Check size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            title="Elimina"
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
              <div className="w-16 h-16 bg-surface-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bell size={28} className="text-neutral-300" />
              </div>
              <p className="text-neutral-500">Nessuna notifica in questa categoria</p>
            </div>
          )}
        </div>
      </div>

      {/* Notification Settings Hint */}
      <div className="bg-card-navy/5 border border-card-navy/10 rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-card-navy/10 flex items-center justify-center">
            <Settings size={22} className="text-card-navy" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-800">Preferenze notifiche</h3>
            <p className="text-sm text-neutral-500">Personalizza quali notifiche ricevere e come</p>
          </div>
        </div>
        <button className="px-4 py-2 bg-card-navy text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all">
          Configura
        </button>
      </div>
    </div>
  );
}
