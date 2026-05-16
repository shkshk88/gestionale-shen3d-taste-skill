import { useState, lazy, Suspense } from 'react';
import { Box, Loader2, FolderOpen, ChevronRight } from 'lucide-react';

const Dental3DViewer = lazy(() => import('@/components/viewer3d/Dental3DViewer'));

interface CaseModel {
  id: string;
  name: string;
  client: string;
  date: string;
  upperUrl: string;
  lowerUrl: string;
  status: string;
}

export default function Viewer3DPage() {
  const [selectedCase, setSelectedCase] = useState<string>('case-1');

  const cases: CaseModel[] = [
    {
      id: 'case-1',
      name: 'LAB-2025-0001',
      client: 'Clinica Dentale Rossi',
      date: '26 Gen 2025',
      upperUrl: '/models/case-1/275669335_shell_occlusion_u.ply',
      lowerUrl: '/models/case-1/275669335_shell_occlusion_l.ply',
      status: 'in_progress'
    },
    {
      id: 'case-2',
      name: 'LAB-2025-0002',
      client: 'Studio Dr. Verdi',
      date: '26 Gen 2025',
      upperUrl: '/models/case-2/275686958_shell_occlusion_u.ply',
      lowerUrl: '/models/case-2/275686958_shell_occlusion_l.ply',
      status: 'received'
    }
  ];

  const currentCase = cases.find(c => c.id === selectedCase) || cases[0];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">In Lavorazione</span>;
      case 'received':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Ricevuto</span>;
      case 'completed':
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Completato</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Info banner — questa è una demo del viewer con scansioni statiche (M-03 audit) */}
      <div className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-900">
        <strong>ℹ️ Demo Viewer 3D.</strong> Questa pagina mostra il visualizzatore con due
        scansioni di esempio caricate dalla cartella <code>public/models/</code>. Per vedere i
        file 3D reali di un caso vai in <strong>Ordini → apri un caso → tab File / 3D</strong>.
      </div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Viewer 3D</h1>
          <p className="text-sm text-neutral-500">Demo visualizzatore con scansioni di esempio</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Case Selector Sidebar */}
        <div className="space-y-4">
          <div className="card-base p-4">
            <h3 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
              <FolderOpen size={18} className="text-neutral-400" />
              Casi con scansioni
            </h3>
            <div className="space-y-2">
              {cases.map((caseItem) => (
                <button
                  key={caseItem.id}
                  onClick={() => setSelectedCase(caseItem.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    selectedCase === caseItem.id
                      ? 'bg-brand-primary text-white'
                      : 'bg-surface-secondary hover:bg-neutral-200 text-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${selectedCase === caseItem.id ? 'text-white' : 'text-neutral-800'}`}>
                        {caseItem.name}
                      </p>
                      <p className={`text-xs ${selectedCase === caseItem.id ? 'text-white/70' : 'text-neutral-500'}`}>
                        {caseItem.client}
                      </p>
                    </div>
                    <ChevronRight size={16} className={selectedCase === caseItem.id ? 'text-white' : 'text-neutral-400'} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Current Case Info */}
          <div className="card-base p-4">
            <h3 className="font-semibold text-neutral-800 mb-3">Dettagli Caso</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-neutral-400">ID Caso</p>
                <p className="font-medium text-neutral-800">{currentCase.name}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-400">Cliente</p>
                <p className="font-medium text-neutral-800">{currentCase.client}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-400">Data Scansione</p>
                <p className="font-medium text-neutral-800">{currentCase.date}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-400">Stato</p>
                <div className="mt-1">{getStatusBadge(currentCase.status)}</div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-card-navy/5 border border-card-navy/10 rounded-2xl p-4">
            <h4 className="font-medium text-neutral-800 mb-2">Controlli Mouse</h4>
            <ul className="text-sm text-neutral-600 space-y-1">
              <li>• <strong>Tasto DX</strong> - Ruota vista</li>
              <li>• <strong>Tasto SX</strong> - Sposta vista</li>
              <li>• <strong>Scroll</strong> - Zoom in/out</li>
              <li>• <strong>Click Scroll</strong> - Centra punto</li>
            </ul>
          </div>
        </div>

        {/* 3D Viewer */}
        <div className="lg:col-span-3">
          <div className="card-base overflow-hidden">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                  <Box size={20} className="text-brand-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-neutral-800">{currentCase.name}</h2>
                  <p className="text-sm text-neutral-500">{currentCase.client}</p>
                </div>
              </div>
              {getStatusBadge(currentCase.status)}
            </div>

            <Suspense
              fallback={
                <div className="h-[600px] flex items-center justify-center" style={{ backgroundColor: '#5D5A87' }}>
                  <div className="text-center">
                    <Loader2 size={48} className="mx-auto mb-4 text-white animate-spin" />
                    <p className="text-white font-medium">Caricamento modello 3D...</p>
                    <p className="text-sm text-white/60 mt-1">I file PLY potrebbero richiedere alcuni secondi</p>
                  </div>
                </div>
              }
            >
              <div className="h-[600px]">
                <Dental3DViewer
                  key={selectedCase}
                  files={[
                    { id: 'upper', url: currentCase.upperUrl, name: 'Arcata Superiore' },
                    { id: 'lower', url: currentCase.lowerUrl, name: 'Arcata Inferiore' }
                  ]}
                  caseId={currentCase.id}
                />
              </div>
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
