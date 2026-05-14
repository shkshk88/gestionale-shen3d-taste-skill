import { Loader2 } from 'lucide-react'

export function LoadingScreen() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl flex items-center justify-center shadow-soft animate-pulse">
          <span className="text-white font-bold text-2xl">S</span>
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
          <p className="text-neutral-500">Caricamento...</p>
        </div>
      </div>
    </div>
  )
}
