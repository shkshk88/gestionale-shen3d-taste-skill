import { useTranslation } from 'react-i18next';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { getDateLocale } from '@/utils/locale';
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

const MATERIAL_MAP: Record<string, string> = {
  ZR: 'Zirconia',
  EMAX: 'E.max',
  PMMA: 'PMMA',
  RES: 'Resina',
  CR_CO: 'Cr-Co',
  CERAM: 'Ceramica',
  COMP: 'Composito',
  ALT: 'Altro',
};

export default function CaseConfirmation() {
  const { t } = useTranslation();
  const location = useLocation();
  const caseData = location.state as CaseConfirmationState | null;

  if (!caseData) {
    return <Navigate to="/portal/cases" replace />;
  }

  const { caseNumber, patientName, teeth, fileCount, dueDate, priority } = caseData;

  // Group teeth by material (only the material is shown to the client)
  const teethByMaterial = teeth.reduce((acc, tooth) => {
    const mat = tooth.workType.material || 'ALT';
    if (!acc[mat]) acc[mat] = [];
    acc[mat].push(tooth.number);
    return acc;
  }, {} as Record<string, number[]>);

  const formatMaterial = (material?: string): string =>
    material ? MATERIAL_MAP[material] || material : t('common.noData');

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center animate-fade-in py-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="card-base overflow-hidden">
          {/* Compact success header */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="relative z-10 flex items-center justify-center gap-3">
              <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shrink-0">
                <CheckCircle size={24} className="text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">
                  {t('caseConfirmation.successTitle')}
                </h1>
                <p className="text-emerald-100 text-xs">{t('portal.caseReceived')}</p>
              </div>
              <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-full shrink-0">
                <ClipboardList size={13} className="text-white" />
                <span className="text-xs font-semibold text-white">{caseNumber}</span>
              </span>
            </div>
          </div>

          {/* Compact body */}
          <div className="p-4 sm:p-5 space-y-4">
            {/* Patient — prominent */}
            <div className="flex items-center gap-3 bg-surface-secondary rounded-2xl p-3">
              <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center shrink-0">
                <User size={18} className="text-teal-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-wide">Paziente</p>
                <p className="font-semibold text-neutral-800 truncate" dir="auto">{patientName}</p>
              </div>
            </div>

            {/* Compact info grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-surface-secondary rounded-xl p-2.5 text-center">
                <Calendar size={15} className="text-amber-600 mx-auto mb-1" />
                <p className="text-[9px] font-medium text-neutral-500 uppercase tracking-wide">{t('portal.deliveryExpected')}</p>
                <p className="text-sm font-semibold text-neutral-800 leading-tight mt-0.5">
                  {dueDate
                    ? new Date(dueDate).toLocaleDateString(getDateLocale(), { day: 'numeric', month: 'short' })
                    : '—'}
                </p>
              </div>
              <div className="bg-surface-secondary rounded-xl p-2.5 text-center">
                <FileText size={15} className="text-blue-600 mx-auto mb-1" />
                <p className="text-[9px] font-medium text-neutral-500 uppercase tracking-wide">File</p>
                <p className="text-sm font-semibold text-neutral-800 leading-tight mt-0.5">{fileCount || 0}</p>
              </div>
              <div className="bg-surface-secondary rounded-xl p-2.5 text-center">
                <Flag size={15} className={`mx-auto mb-1 ${priority === 'urgent' ? 'text-amber-600' : 'text-green-600'}`} />
                <p className="text-[9px] font-medium text-neutral-500 uppercase tracking-wide">{t('newCase.priorityLabel')}</p>
                <p className="text-sm font-semibold text-neutral-800 leading-tight mt-0.5">
                  {priority === 'urgent' ? t('newCase.urgentPriority') : t('newCase.normalPriority')}
                </p>
              </div>
            </div>

            {/* Work detail — material only */}
            <div className="bg-surface-secondary rounded-2xl p-3">
              <h3 className="text-xs font-semibold text-neutral-700 mb-2 flex items-center gap-2">
                <Package size={14} className="text-card-teal" />
                {teeth.length} {t('dental.tooth', { count: teeth.length })}
              </h3>
              <div className="space-y-1.5">
                {Object.entries(teethByMaterial).map(([material, nums]) => (
                  <div
                    key={material}
                    className="flex items-center justify-between gap-2 py-1.5 border-b border-neutral-200 last:border-0"
                  >
                    <span className="text-sm font-medium text-neutral-700 shrink-0">
                      {formatMaterial(material)}
                    </span>
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      {nums.map((num) => (
                        <span
                          key={num}
                          className="w-6 h-6 bg-white rounded-md text-[11px] font-medium text-neutral-700 flex items-center justify-center shadow-sm"
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* One-line note */}
            <p className="text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-center">
              {t('caseConfirmation.nextSteps')}
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Link
                to="/portal/cases"
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-card-teal text-white rounded-2xl font-semibold hover:bg-card-teal/90 transition-all shadow-lg shadow-teal-500/20"
              >
                <ClipboardList size={18} />
                {t('portal.manageCases')}
              </Link>
              <Link
                to="/portal/new-case"
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-white text-neutral-700 border-2 border-neutral-200 rounded-2xl font-semibold hover:border-card-teal hover:text-card-teal transition-all"
              >
                <PlusCircle size={18} />
                {t('portal.createNewCase')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
