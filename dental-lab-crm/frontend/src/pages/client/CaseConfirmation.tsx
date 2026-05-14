import { useTranslation } from 'react-i18next';
import { Link, useLocation, Navigate } from 'react-router-dom';
import {
  CheckCircle,
  ClipboardList,
  PlusCircle,
  Calendar,
  User,
  FileText,
  Package,
  Flag,
} from 'lucide-react';

interface CaseConfirmationState {
  caseNumber: string;
  patientName: string;
  teeth: Array<{
    number: number;
    workType: {
      name: string;
      color: string;
      workType: string;
      material: string;
    };
  }>;
  fileCount: number;
  dueDate: string;
  priority: 'normal' | 'urgent';
}

export default function CaseConfirmation() {
  const { t } = useTranslation();
  const location = useLocation();
  const caseData = location.state as CaseConfirmationState | null;

  // Redirect if accessed directly without state
  if (!caseData) {
    return <Navigate to="/portal/cases" replace />;
  }

  const { caseNumber, patientName, teeth, fileCount, dueDate, priority } = caseData;

  // Group teeth by work type for display
  const teethByWorkType = teeth.reduce((acc, tooth) => {
    const type = tooth.workType.workType;
    if (!acc[type]) {
      acc[type] = { teeth: [], name: tooth.workType.name, material: tooth.workType.material };
    }
    acc[type].teeth.push(tooth.number);
    return acc;
  }, {} as Record<string, { teeth: number[]; name: string; material: string }>);

  // Format material for display
  const formatMaterial = (material?: string): string => {
    const materialMap: Record<string, string> = {
      ZR: 'Zirconia',
      EMAX: 'E.max',
      PMMA: 'PMMA',
      RES: 'Resina',
      CR_CO: 'Cr-Co',
      CERAM: 'Ceramica',
      COMP: 'Composito',
      ALT: 'Altro',
    };
    return material ? materialMap[material] || material : '';
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center animate-fade-in py-8">
      <div className="w-full max-w-2xl mx-auto">
        {/* Success Card */}
        <div className="card-base overflow-hidden">
          {/* Header Section with Green Gradient */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-center relative overflow-hidden">
            {/* Decorative blur circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none" />

            {/* Success Icon */}
            <div className="relative z-10">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CheckCircle size={40} className="text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Caso inviato con successo!
              </h1>
              <p className="text-emerald-100 mt-2 text-sm">
                Il laboratorio ha ricevuto la tua richiesta
              </p>
            </div>
          </div>

          {/* Case Summary Section */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Case Number Badge */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-card-teal/10 rounded-full">
                <ClipboardList size={16} className="text-card-teal" />
                <span className="text-sm font-semibold text-card-teal">
                  {caseNumber}
                </span>
              </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Patient Name */}
              <div className="bg-surface-secondary rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-teal-100 rounded-xl flex items-center justify-center">
                    <User size={16} className="text-teal-600" />
                  </div>
                  <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    Paziente
                  </span>
                </div>
                <p className="font-semibold text-neutral-800 text-lg">
                  {patientName}
                </p>
              </div>

              {/* Due Date */}
              <div className="bg-surface-secondary rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Calendar size={16} className="text-amber-600" />
                  </div>
                  <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    Consegna richiesta
                  </span>
                </div>
                <p className="font-semibold text-neutral-800 text-lg">
                  {dueDate
                    ? new Date(dueDate).toLocaleDateString('it-IT', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Non specificata'}
                </p>
              </div>

              {/* Files Count */}
              <div className="bg-surface-secondary rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                    <FileText size={16} className="text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    File allegati
                  </span>
                </div>
                <p className="font-semibold text-neutral-800 text-lg">
                  {fileCount || 0} {(fileCount || 0) === 1 ? 'file' : 'file'}
                </p>
              </div>

              {/* Priority */}
              <div className="bg-surface-secondary rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Flag size={16} className="text-amber-600" />
                  </div>
                  <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    Priorità
                  </span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  priority === 'urgent' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                }`}>
                  {priority === 'urgent' ? 'Urgente' : 'Normale'}
                </span>
              </div>

              {/* Teeth Count */}
              <div className="bg-surface-secondary rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Package size={16} className="text-purple-600" />
                  </div>
                  <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    Denti selezionati
                  </span>
                </div>
                <p className="font-semibold text-neutral-800 text-lg">
                  {teeth.length} {teeth.length === 1 ? 'dente' : 'denti'}
                </p>
              </div>
            </div>

            {/* Selected Teeth Details */}
            <div className="bg-surface-secondary rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                <ClipboardList size={16} className="text-card-teal" />
                Dettaglio lavorazioni
              </h3>
              <div className="space-y-2">
                {Object.entries(teethByWorkType).map(([workType, data]) => (
                  <div
                    key={workType}
                    className="flex items-center justify-between py-2 border-b border-neutral-200 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-card-teal" />
                      <span className="text-sm text-neutral-600">
                        {data.name}
                      </span>
                      {data.material && (
                        <span className="text-xs text-neutral-400">
                          ({formatMaterial(data.material)})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {data.teeth.map((num) => (
                        <span
                          key={num}
                          className="w-7 h-7 bg-white rounded-lg text-xs font-medium text-neutral-700 flex items-center justify-center shadow-sm"
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info Note */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 text-lg">i</span>
              </div>
              <div>
                <p className="text-sm text-blue-800 font-medium">
                  Cosa succede ora?
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  Il laboratorio prenderà in carico il caso e ti aggiornerà sullo
                  stato di avanzamento. Riceverai una notifica quando il caso
                  sarà in lavorazione.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                to="/portal/cases"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-card-teal text-white rounded-2xl font-semibold hover:bg-card-teal/90 transition-all shadow-lg shadow-teal-500/20 hover:scale-[1.02]"
              >
                <ClipboardList size={20} />
                Vai ai miei casi
              </Link>
              <Link
                to="/portal/new-case"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white text-neutral-700 border-2 border-neutral-200 rounded-2xl font-semibold hover:border-card-teal hover:text-card-teal transition-all hover:scale-[1.02]"
              >
                <PlusCircle size={20} />
                Crea nuovo caso
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
