import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Shield, Zap, Clock, CheckCircle } from 'lucide-react'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { login } = useAuthStore()

  // Demo login con utenti reali del seed DB.
  // Sostituisce il vecchio mock con id fittizi 1/client-1 (vedi M-05 audit).
  const handleGoogleLogin = () => {
    const adminUser = {
      id: '27b100b3-b1f0-4edc-ac1c-31d5e84754dc', // real seeded admin from DB
      email: 'admin@shen3d.com',
      name: 'Admin Principale',
      role: 'admin' as const,
      language: 'it' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    login(adminUser, 'dev-token')
    navigate('/admin')
  }

  const handleClientLogin = () => {
    const dentistUser = {
      id: '519c1fdb-e321-48a6-ad9f-df3b946fdf59', // real seeded user mario.rossi@clinicarossi.it
      email: 'mario.rossi@clinicarossi.it',
      name: 'Dr. Mario Rossi',
      role: 'client' as const,
      language: 'it' as const,
      clientId: 'f309ce3a-2eed-49ba-909d-4200d58363d8', // real Clinica Dentale Rossi client id
      client: {
        id: 'f309ce3a-2eed-49ba-909d-4200d58363d8',
        studioName: 'Clinica Dentale Rossi',
        contactPerson: 'Dr. Mario Rossi',
        address: 'Via Roma 123',
        city: 'Milano',
        postalCode: '20100',
        country: 'Israel',
        phone: '+972 3 1234567',
        email: 'info@clinic-rossi.co.il',
        whatsapp: '+972 50 1234567',
        vatNumber: '514123456',
        active: true,
        createdAt: '2026-02-05T00:20:45.208Z',
        updatedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    login(dentistUser, 'dev-token')
    navigate('/portal')
  }

  const features = [
    { icon: Shield, text: t('auth.featureDataSecurity') },
    { icon: Zap, text: t('auth.featureRealTimeOrders') },
    { icon: Clock, text: t('auth.featureDeliveryTracking') },
    { icon: CheckCircle, text: t('auth.featureDirectComm') },
  ]

  return (
    <div className="min-h-screen bg-mesh flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-500 to-cyan-600 relative overflow-hidden">
        {/* Background Pattern with Mesh */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-40 right-10 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-cyan-300/20 blur-2xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-16 text-white">
          {/* Logo */}
          <div className="mb-12">
            <div className="mb-8">
              <img
                src="/logo-shen3d.png"
                alt="Shen3D Logo"
                className="h-24 w-auto drop-shadow-2xl"
              />
            </div>
            <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">Shen3D</h1>
            <p className="text-xl text-white/90 font-medium">
              {t('auth.labManagement')}
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <feature.icon size={22} />
                </div>
                <span className="text-lg text-white/90">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8">
            <div>
              <p className="text-4xl font-bold">500+</p>
              <p className="text-white/70">{t('auth.stat1Short')}</p>
            </div>
            <div>
              <p className="text-4xl font-bold">10k+</p>
              <p className="text-white/70">{t('auth.stat2Label')}</p>
            </div>
            <div>
              <p className="text-4xl font-bold">99%</p>
              <p className="text-white/70">{t('auth.stat3Short')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img
              src="/logo-shen3d.png"
              alt="Shen3D Logo"
              className="h-16 w-auto mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-slate-800">Shen3D</h1>
          </div>

          {/* Login Card - Glass Design */}
          <div className="glass-card p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">
                {t('auth.welcomeBack')}
              </h2>
              <p className="text-slate-500 font-medium">
                {t('auth.loginSubtitle')}
              </p>
            </div>

            {/* Google Login Button */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-slate-200 rounded-[1.5rem] text-slate-700 font-semibold hover:border-teal-500 hover:bg-teal-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {t('auth.loginWithGoogle')}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-sm text-slate-400 font-medium">{t('auth.or')}</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Demo Login Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleGoogleLogin}
                className="w-full px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-[1.5rem] font-semibold hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-slate-800/20"
              >
                <Shield size={20} />
                {t('auth.loginAsLab')}
              </button>
              <button
                onClick={handleClientLogin}
                className="w-full px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-[1.5rem] font-semibold hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
              >
                <CheckCircle size={20} />
                {t('auth.loginAsStudio')}
              </button>
            </div>

            {/* Demo Notice */}
            <div className="mt-6 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-[1.5rem] border border-amber-200">
              <p className="text-sm text-slate-700 text-center font-medium">
                {t('auth.demoMode')}
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-slate-400 mt-6 font-medium">
            {t('auth.copyright')}
          </p>
        </div>
      </div>
    </div>
  )
}
