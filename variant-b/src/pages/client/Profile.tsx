import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  Bell,
  Shield,
  ChevronRight,
  Check,
  Clock,
  Package,
  TrendingUp
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import caseService from '../../services/case.service';

export default function ClientProfile() {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCases: 0,
    completedCases: 0,
    avgDeliveryTime: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        // Privacy: scope cases to the logged-in client only
        const clientId = user?.clientId || user?.client?.id;
        if (!clientId) {
          setStats({ totalCases: 0, completedCases: 0, avgDeliveryTime: 0 });
          return;
        }
        const casesData = await caseService.getCases({ clientId });

        const totalCases = casesData.length;
        const completedCases = casesData.filter((c: any) => c.status === 'delivered').length;

        // Calculate average delivery time
        const deliveredCases = casesData.filter((c: any) => c.status === 'delivered' && c.receivedDate && c.shippedDate);
        let avgDeliveryTime = 0;

        if (deliveredCases.length > 0) {
          const totalDays = deliveredCases.reduce((sum: number, c: any) => {
            const received = new Date(c.receivedDate);
            const shipped = new Date(c.shippedDate);
            const days = Math.ceil((shipped.getTime() - received.getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0);
          avgDeliveryTime = Number((totalDays / deliveredCases.length).toFixed(1));
        }

        setStats({ totalCases, completedCases, avgDeliveryTime });
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const studioInfo = {
    name: user?.client?.studioName || 'Studio',
    contactPerson: user?.client?.contactPerson || 'N/A',
    phone: user?.client?.phone || 'N/A',
    email: user?.client?.email || user?.email || 'N/A',
    address: user?.client?.address ?
      `${user.client.address}${user.client.city ? ', ' + user.client.city : ''}${user.client.postalCode ? ' ' + user.client.postalCode : ''}` :
      'N/A',
    vatNumber: user?.client?.vatNumber || 'N/A',
    memberSince: user?.createdAt || new Date().toISOString(),
  };

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
        checked ? 'bg-stone-800 shadow-sm shadow-slate-800/20' : 'bg-stone-200'
      }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${
          checked ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800 mx-auto mb-4"></div>
          <p className="text-stone-500">{t('common.loadingProfile')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-scale-in max-w-4xl pb-4">
      {/* Compact identity row (no page title) */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-slate-800 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-sky-500/15 shrink-0">
          {studioInfo.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold text-stone-800 truncate">{studioInfo.name}</p>
          <p className="text-xs text-stone-500">{t('portal.clientSince', { date: new Date(studioInfo.memberSince).toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' }) })}</p>
        </div>
      </div>

      {/* Stats - Vibrant Cards */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl md:rounded-xl p-3 md:p-5 shadow-sm shadow-slate-800/15">
          <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
            <div className="w-6 h-6 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white/20 flex items-center justify-center">
              <Package size={14} className="text-white" />
            </div>
            <span className="text-[10px] md:text-sm text-white/80 font-medium">{t('portal.totalCases')}</span>
          </div>
          <p className="text-xl md:text-4xl font-bold text-white">{stats.totalCases}</p>
        </div>
        <div className="bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl md:rounded-xl p-3 md:p-5 shadow-sm shadow-sky-500/15">
          <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
            <div className="w-6 h-6 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white/20 flex items-center justify-center">
              <Check size={14} className="text-white" />
            </div>
            <span className="text-[10px] md:text-sm text-white/80 font-medium">{t('portal.completedCases')}</span>
          </div>
          <p className="text-xl md:text-4xl font-bold text-white">{stats.completedCases}</p>
        </div>
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl md:rounded-xl p-3 md:p-5 shadow-sm shadow-teal-500/15">
          <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
            <div className="w-6 h-6 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white/20 flex items-center justify-center">
              <TrendingUp size={14} className="text-white" />
            </div>
            <span className="text-[10px] md:text-sm text-white/80 font-medium">{t('portal.avgDeliveryTime')}</span>
          </div>
          <p className="text-xl md:text-4xl font-bold text-white">{stats.avgDeliveryTime} <span className="text-xs md:text-lg font-normal text-white/80">{t('common.daysShort')}</span></p>
        </div>
      </div>

      {/* Studio Info */}
      <div className="bg-white rounded-xl p-6 border border-stone-100 shadow-sm">
        <h2 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
          <Building2 size={20} className="text-amber-800" />
          {t('portal.studioInfo')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm border border-stone-100">
              <User size={18} className="text-stone-500" />
            </div>
            <div>
              <p className="text-xs text-stone-400 font-medium">{t('clients.contactPerson')}</p>
              <p className="font-semibold text-stone-800">{studioInfo.contactPerson}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm border border-stone-100">
              <Phone size={18} className="text-stone-500" />
            </div>
            <div>
              <p className="text-xs text-stone-400 font-medium">{t('clients.phone')}</p>
              <p className="font-semibold text-stone-800">{studioInfo.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm border border-stone-100">
              <Mail size={18} className="text-stone-500" />
            </div>
            <div>
              <p className="text-xs text-stone-400 font-medium">{t('clients.email')}</p>
              <p className="font-semibold text-stone-800">{studioInfo.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm border border-stone-100">
              <MapPin size={18} className="text-stone-500" />
            </div>
            <div>
              <p className="text-xs text-stone-400 font-medium">{t('clients.address')}</p>
              <p className="font-semibold text-stone-800">{studioInfo.address}</p>
            </div>
          </div>
        </div>
        <p className="text-sm text-stone-400 mt-4 font-medium">
          Per modificare i dati dello studio, contatta il laboratorio.
        </p>
      </div>

      {/* Language */}
      <div className="bg-white rounded-xl p-6 border border-stone-100 shadow-sm">
        <h2 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
          <Globe size={20} className="text-amber-800" />
          {t('settings.language')}
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            { code: 'it', label: 'Italiano' },
            { code: 'en', label: 'English' },
            { code: 'fr', label: 'Français' },
            { code: 'he', label: 'עברית' },
          ].map((lang) => (
            <button
              key={lang.code}
              onClick={() => i18n.changeLanguage(lang.code)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                i18n.language === lang.code
                  ? 'bg-stone-800 text-white shadow-sm shadow-slate-800/15'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl p-6 border border-stone-100 shadow-sm">
        <h2 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
          <Bell size={20} className="text-amber-800" />
          Notifiche
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
            <div>
              <p className="font-semibold text-stone-800">Notifiche push</p>
              <p className="text-sm text-stone-500">Ricevi notifiche sullo stato dei casi</p>
            </div>
            <ToggleSwitch
              checked={notificationsEnabled}
              onChange={setNotificationsEnabled}
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
            <div>
              <p className="font-semibold text-stone-800">Notifiche email</p>
              <p className="text-sm text-stone-500">Ricevi aggiornamenti via email</p>
            </div>
            <ToggleSwitch
              checked={emailNotifications}
              onChange={setEmailNotifications}
            />
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-xl p-6 border border-stone-100 shadow-sm">
        <h2 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
          <Shield size={20} className="text-amber-800" />
          Sicurezza
        </h2>
        <div className="space-y-2">
          <button className="w-full flex items-center justify-between p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition-all duration-200 group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm border border-stone-100">
                <Shield size={18} className="text-stone-500 group-hover:text-amber-800 transition-colors" />
              </div>
              <span className="font-semibold text-stone-800">Cambia password</span>
            </div>
            <ChevronRight size={18} className="text-stone-400 group-hover:text-stone-600 transition-colors" />
          </button>
          <button className="w-full flex items-center justify-between p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition-all duration-200 group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm border border-stone-100">
                <Clock size={18} className="text-stone-500 group-hover:text-amber-800 transition-colors" />
              </div>
              <div className="text-left">
                <span className="font-semibold text-stone-800 block">Sessioni attive</span>
                <span className="text-sm text-stone-500">1 sessione attiva</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-stone-400 group-hover:text-stone-600 transition-colors" />
          </button>
        </div>
      </div>

      {/* Contact Lab */}
      <div className="bg-gradient-to-br from-sky-500 to-slate-800 rounded-xl p-6 shadow-sm shadow-sky-500/15">
        <h3 className="font-bold text-white mb-2">Hai bisogno di assistenza?</h3>
        <p className="text-sm text-white/90 mb-4 font-medium">
          Contatta il laboratorio Shen3D per qualsiasi domanda o richiesta.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="tel:+390212345678"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-sm font-semibold text-white hover:bg-white/30 transition-all duration-200"
          >
            <Phone size={16} />
            Chiama
          </a>
          <a
            href="mailto:supporto@shen3d.it"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-sm font-semibold text-white hover:bg-white/30 transition-all duration-200"
          >
            <Mail size={16} />
            Email
          </a>
        </div>
      </div>
    </div>
  );
}
