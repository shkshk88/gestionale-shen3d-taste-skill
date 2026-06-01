import { useState, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import {
 Settings,
 Bell,
 Palette,
 Building2,
 Mail,
 Clock,
 Euro,
 Shield,
 Save,
 ChevronRight,
 Check,
 Globe,
 Moon,
 Sun,
 FileText,
 Loader2,
} from 'lucide-react';

const PriceListPage = lazy(() => import('./PriceLists/PriceListPage'));

type SettingsSection = 'general' | 'notifications' | 'pricing' | 'priceLists' | 'appearance' | 'laboratory' | 'security';

export default function SettingsPage() {
 const { t, i18n } = useTranslation();
 const [activeSection, setActiveSection] = useState<SettingsSection>('general');
 const [savedMessage, setSavedMessage] = useState(false);

 // Settings state
 const [settings, setSettings] = useState({
 // General
 defaultDeliveryDays: 7,
 delayAlertThreshold: 1,
 workingHoursStart: '08:00',
 workingHoursEnd: '18:00',
 weekendWork: false,

 // Notifications
 notifyNewCase: true,
 notifyNewMessage: true,
 notifyDelayAlert: true,
 notifyStatusChange: true,
 emailNotifications: true,

 // Appearance
 language: 'it',
 theme: 'light',
 compactMode: false,

 // Laboratory
 labName: 'Shen3D Lab',
 labEmail: 'info@shen3d.co.il',
 labPhone: '+972 3 1234567',
 labAddress: 'Tel Aviv, Israel',
 vatNumber: '514123456',

 // Pricing
 defaultTaxRate: 17,
 currency: 'ILS',
 showPricesWithTax: true,
 });

 const handleSave = () => {
 setSavedMessage(true);
 setTimeout(() => setSavedMessage(false), 2000);
 };

 const sections: { id: SettingsSection; icon: typeof Settings; label: string }[] = [
 { id: 'general', icon: Settings, label: t('settings.general') },
 { id: 'notifications', icon: Bell, label: t('settings.notifications') },
 { id: 'laboratory', icon: Building2, label: t('settings.laboratory') },
 { id: 'pricing', icon: Euro, label: t('settings.pricing') },
 { id: 'priceLists', icon: FileText, label: 'Listini Prezzi' },
 { id: 'appearance', icon: Palette, label: t('settings.appearance') },
 { id: 'security', icon: Shield, label: t('settings.security') },
 ];

 const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) => (
 <button
 type="button"
 onClick={() => onChange(!checked)}
 className={`relative w-12 h-6 transition-colors ${
 checked ? 'bg-blue-600' : 'bg-gray-200'
 }`}
 >
 <div
 className={`absolute top-1 w-4 h-4 bg-white ${
 checked ? 'translate-x-7' : 'translate-x-1'
 }`}
 />
 </button>
 );

 const renderContent = () => {
 switch (activeSection) {
 case 'general':
 return (
 <div className="space-y-8">
 <div>
 <h3 className="text-lg font-semibold text-gray-800 mb-5 font-display">{t('settings.generalTitle')}</h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
 <div>
 <label className="block text-sm font-medium text-gray-600 mb-2">
 {t('settings.defaultDeliveryDays')}
 </label>
 <input
 type="number"
 value={settings.defaultDeliveryDays}
 onChange={(e) => setSettings({ ...settings, defaultDeliveryDays: parseInt(e.target.value) })}
 className="input-modern w-full"
 />
 <p className="text-xs text-gray-400 mt-1.5">{t('settings.defaultDeliveryDaysDesc')}</p>
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-600 mb-2">
 {t('settings.delayAlertThreshold')}
 </label>
 <input
 type="number"
 value={settings.delayAlertThreshold}
 onChange={(e) => setSettings({ ...settings, delayAlertThreshold: parseInt(e.target.value) })}
 className="input-modern w-full"
 />
 <p className="text-xs text-gray-400 mt-1.5">{t('settings.delayAlertThresholdDesc')}</p>
 </div>
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
 <Clock size={16} className="text-blue-600" />
 {t('settings.workingHours')}
 </label>
 <div className="flex items-center gap-3">
 <input
 type="time"
 value={settings.workingHoursStart}
 onChange={(e) => setSettings({ ...settings, workingHoursStart: e.target.value })}
 className="input-modern w-32"
 />
 <span className="text-gray-400">—</span>
 <input
 type="time"
 value={settings.workingHoursEnd}
 onChange={(e) => setSettings({ ...settings, workingHoursEnd: e.target.value })}
 className="input-modern w-32"
 />
 </div>
 </div>

 <div className="flex items-center justify-between p-5 bg-white border border-gray-100/80 ">
 <div>
 <p className="font-medium text-gray-800">{t('settings.weekendWork')}</p>
 <p className="text-sm text-gray-500 mt-0.5">{t('settings.weekendWorkDesc')}</p>
 </div>
 <ToggleSwitch
 checked={settings.weekendWork}
 onChange={(val) => setSettings({ ...settings, weekendWork: val })}
 />
 </div>
 </div>
 );

 case 'notifications':
 return (
 <div className="space-y-5">
 <h3 className="text-lg font-semibold text-gray-800 mb-5 font-display">{t('settings.notifPreferences')}</h3>

 {[
 { key: 'notifyNewCase', label: t('notifications.newCase'), desc: t('settings.notifNewCaseDesc') },
 { key: 'notifyNewMessage', label: t('notifications.newMessage'), desc: t('settings.notifMessagesDesc') },
 { key: 'notifyDelayAlert', label: t('notifications.delayAlert'), desc: t('settings.notifDelayAlertsDesc') },
 { key: 'notifyStatusChange', label: t('settings.statusChange'), desc: t('settings.notifStatusChangeDesc') },
 ].map((item) => (
 <div key={item.key} className="flex items-center justify-between p-5 bg-white border border-gray-100/80 ">
 <div>
 <p className="font-medium text-gray-800">{item.label}</p>
 <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
 </div>
 <ToggleSwitch
 checked={settings[item.key as keyof typeof settings] as boolean}
 onChange={(val) => setSettings({ ...settings, [item.key]: val })}
 />
 </div>
 ))}

 <div className="pt-5 border-t border-gray-100">
 <div className="flex items-center justify-between p-5 bg-white border border-gray-100/80 ">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-gray-50 flex items-center justify-center">
 <Mail size={20} className="text-blue-600" />
 </div>
 <div>
 <p className="font-medium text-gray-800">{t('settings.emailNotif')}</p>
 <p className="text-sm text-gray-500 mt-0.5">{t('settings.emailNotifDesc')}</p>
 </div>
 </div>
 <ToggleSwitch
 checked={settings.emailNotifications}
 onChange={(val) => setSettings({ ...settings, emailNotifications: val })}
 />
 </div>
 </div>
 </div>
 );

 case 'laboratory':
 return (
 <div className="space-y-8">
 <h3 className="text-lg font-semibold text-gray-800 mb-5 font-display">{t('settings.labData')}</h3>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
 <div>
 <label className="block text-sm font-medium text-gray-600 mb-2">{t('settings.labName')}</label>
 <input
 type="text"
 value={settings.labName}
 onChange={(e) => setSettings({ ...settings, labName: e.target.value })}
 className="input-modern w-full"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-600 mb-2">{t('clients.vatNumber')}</label>
 <input
 type="text"
 value={settings.vatNumber}
 onChange={(e) => setSettings({ ...settings, vatNumber: e.target.value })}
 className="input-modern w-full"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-600 mb-2">{t('clients.email')}</label>
 <input
 type="email"
 value={settings.labEmail}
 onChange={(e) => setSettings({ ...settings, labEmail: e.target.value })}
 className="input-modern w-full"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-600 mb-2">{t('clients.phone')}</label>
 <input
 type="tel"
 value={settings.labPhone}
 onChange={(e) => setSettings({ ...settings, labPhone: e.target.value })}
 className="input-modern w-full"
 />
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-600 mb-2">{t('clients.address')}</label>
 <input
 type="text"
 value={settings.labAddress}
 onChange={(e) => setSettings({ ...settings, labAddress: e.target.value })}
 className="input-modern w-full"
 />
 </div>

 <div className="bg-white border border-amber-200/60 p-5 ">
 <p className="text-sm font-medium mb-1 text-gray-800">{t('settings.logoBranding')}</p>
 <p className="text-sm text-gray-600 mb-4">{t('settings.logoBrandingDesc')}</p>
 <button className="px-4 py-2.5 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors border border-gray-200 ">
 {t('settings.uploadLogo')}
 </button>
 </div>
 </div>
 );

 case 'priceLists':
 return (
 <div className="-mx-4 sm:-mx-6">
 <Suspense
 fallback={
 <div className="flex items-center justify-center min-h-[300px]">
 <Loader2 size={28} className="animate-spin text-blue-600" />
 </div>
 }
 >
 <PriceListPage />
 </Suspense>
 </div>
 );

 case 'pricing':
 return (
 <div className="space-y-8">
 <h3 className="text-lg font-semibold text-gray-800 mb-5 font-display">{t('settings.pricing')}</h3>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
 <div>
 <label className="block text-sm font-medium text-gray-600 mb-2">{t('settings.taxRate')}</label>
 <input
 type="number"
 value={settings.defaultTaxRate}
 onChange={(e) => setSettings({ ...settings, defaultTaxRate: parseInt(e.target.value) })}
 className="input-modern w-full"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-600 mb-2">{t('settings.currency')}</label>
 <select
 value={settings.currency}
 onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
 className="input-modern w-full"
 >
 <option value="ILS">{t('settings.currencyOptionILS')}</option>
 <option value="USD">{t('settings.currencyOptionUSD')}</option>
 <option value="EUR">{t('settings.currencyOptionEUR')}</option>
 </select>
 </div>
 </div>

 <div className="flex items-center justify-between p-5 bg-white border border-gray-100/80 ">
 <div>
 <p className="font-medium text-gray-800">{t('settings.showPricesWithTax')}</p>
 <p className="text-sm text-gray-500 mt-0.5">{t('settings.showPricesWithTaxDesc')}</p>
 </div>
 <ToggleSwitch
 checked={settings.showPricesWithTax}
 onChange={(val) => setSettings({ ...settings, showPricesWithTax: val })}
 />
 </div>

 <div className="p-5 bg-white border border-gray-100/80 ">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-gray-50 flex items-center justify-center">
 <Euro size={20} className="text-blue-600" />
 </div>
 <div>
 <p className="font-medium text-gray-800">{t('settings.priceListManagement')}</p>
 <p className="text-sm text-gray-500 mt-0.5">{t('settings.priceListManagementDesc')}</p>
 </div>
 </div>
 <ChevronRight size={20} className="text-gray-400" />
 </div>
 </div>
 </div>
 );

 case 'appearance':
 return (
 <div className="space-y-8">
 <h3 className="text-lg font-semibold text-gray-800 mb-5 font-display">{t('settings.appearance')}</h3>

 <div>
 <label className="block text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
 <Globe size={16} className="text-blue-600" />
 {t('settings.language')}
 </label>
 <div className="flex gap-2">
 {[
 { code: 'it', label: 'Italiano' },
 { code: 'en', label: 'English' },
 ].map((lang) => (
 <button
 key={lang.code}
 onClick={() => {
 i18n.changeLanguage(lang.code);
 setSettings({ ...settings, language: lang.code });
 }}
 className={`px-4 py-2.5 text-sm font-medium transition-all ${
 settings.language === lang.code
 ? 'bg-blue-600 text-white '
 : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-100/80 '
 }`}
 >
 {lang.label}
 </button>
 ))}
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-600 mb-3">{t('settings.theme')}</label>
 <div className="flex gap-2">
 {[
 { value: 'light', label: t('settings.themeLight'), icon: Sun },
 { value: 'dark', label: t('settings.themeDark'), icon: Moon },
 ].map((theme) => (
 <button
 key={theme.value}
 onClick={() => setSettings({ ...settings, theme: theme.value })}
 className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all ${
 settings.theme === theme.value
 ? 'bg-blue-600 text-white '
 : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-100/80 '
 }`}
 >
 <theme.icon size={16} />
 {theme.label}
 </button>
 ))}
 </div>
 </div>

 <div className="flex items-center justify-between p-5 bg-white border border-gray-100/80 ">
 <div>
 <p className="font-medium text-gray-800">{t('settings.compactMode')}</p>
 <p className="text-sm text-gray-500 mt-0.5">{t('settings.compactModeDesc')}</p>
 </div>
 <ToggleSwitch
 checked={settings.compactMode}
 onChange={(val) => setSettings({ ...settings, compactMode: val })}
 />
 </div>
 </div>
 );

 case 'security':
 return (
 <div className="space-y-8">
 <h3 className="text-lg font-semibold text-gray-800 mb-5 font-display">{t('settings.security')}</h3>

 <div className="p-5 bg-white border border-gray-100/80 ">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-gray-50 flex items-center justify-center">
 <Shield size={20} className="text-amber-600" />
 </div>
 <div>
 <p className="font-medium text-gray-800">{t('settings.changePassword')}</p>
 <p className="text-sm text-gray-500 mt-0.5">{t('settings.changePasswordDesc')}</p>
 </div>
 </div>
 <ChevronRight size={20} className="text-gray-400" />
 </div>
 </div>

 <div className="p-5 bg-white border border-gray-100/80 ">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-violet-50 flex items-center justify-center">
 <Shield size={20} className="text-violet-600" />
 </div>
 <div>
 <p className="font-medium text-gray-800">{t('settings.twoFactor')}</p>
 <p className="text-sm text-gray-500 mt-0.5">{t('settings.twoFactorDesc')}</p>
 </div>
 </div>
 <span className="px-3 py-1 bg-gray-100 text-xs font-medium text-gray-600">
 {t('settings.disabled')}
 </span>
 </div>
 </div>

 <div className="p-5 bg-white border border-gray-100/80 ">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-gray-50 flex items-center justify-center">
 <Clock size={20} className="text-blue-600" />
 </div>
 <div>
 <p className="font-medium text-gray-800">{t('settings.activeSessions')}</p>
 <p className="text-sm text-gray-500 mt-0.5">{t('settings.activeSessionsDesc')}</p>
 </div>
 </div>
 <span className="px-3 py-1 bg-gray-50 text-xs font-medium text-teal-700">
 {t('settings.oneActive')}
 </span>
 </div>
 </div>

 <div className="pt-4 border-t border-gray-100">
 <button className="text-red-600 text-sm font-medium hover:underline transition-colors">
 {t('settings.deleteAccount')}
 </button>
 </div>
 </div>
 );
 }
 };

 return (
 <div className="space-y-6 animate-fade-in">
 {/* Header */}
 <div className="flex items-center justify-end">
 <button
 onClick={handleSave}
 className="btn-primary flex items-center gap-2 "
 >
 {savedMessage ? (
 <>
 <Check size={18} />
 {t('settings.saved')}
 </>
 ) : (
 <>
 <Save size={18} />
 {t('common.save')}
 </>
 )}
 </button>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
 {/* Sidebar Navigation */}
 <div className="lg:col-span-1">
 <nav className="bg-white border border-gray-100/80 p-2 space-y-1">
 {sections.map((section) => (
 <button
 key={section.id}
 onClick={() => setActiveSection(section.id)}
 className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
 activeSection === section.id
 ? 'bg-blue-600 text-white '
 : 'text-gray-600 hover:bg-gray-50'
 }`}
 >
 <section.icon size={18} />
 <span className="text-sm font-medium">{section.label}</span>
 </button>
 ))}
 </nav>
 </div>

 {/* Content */}
 <div className="lg:col-span-3">
 <div className="bg-white border border-gray-100/80 p-6">
 {renderContent()}
 </div>
 </div>
 </div>
 </div>
 );
}
