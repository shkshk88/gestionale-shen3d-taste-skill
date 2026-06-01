import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function LoadingScreen() {
  const { t } = useTranslation()
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-sky-600 to-brand-secondary rounded-2xl flex items-center justify-center shadow-soft animate-pulse">
          <span className="text-white font-bold text-2xl">S</span>
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
          <p className="text-slate-500">{t('common.loadingApp')}</p>
        </div>
      </div>
    </div>
  )
}
