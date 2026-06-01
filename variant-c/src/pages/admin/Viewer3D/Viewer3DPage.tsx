import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, FolderOpen, ChevronRight, AlertCircle, Box, Scan } from 'lucide-react';
import api from '@/services/api';
import Case3DViewer from '@/components/viewer3d/Case3DViewer';
import { ClientAvatar } from '@/components/common/ClientAvatar';

interface CaseWithFiles {
 id: string;
 caseNumber: string;
 patientName?: string;
 client: { studioName: string; logoUrl?: string | null };
 teeth?: Array<{ toothNumber: number; workType: string; material: string }>;
 files: Array<{ id: string; fileName: string; fileType: string }>;
 createdAt: string;
 status: string;
}

export default function Viewer3DPage() {
 const { t } = useTranslation();
 const [cases, setCases] = useState<CaseWithFiles[]>([]);
 const [loading, setLoading] = useState(true);
 const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

 useEffect(() => {
 const loadCases = async () => {
 try {
 setLoading(true);
 const response = await api.get<{ data: CaseWithFiles[]; total: number }>('/cases?take=100');
 const all: CaseWithFiles[] = response.data ?? [];
 const withFiles = all.filter(c =>
 c.files?.some(f =>
 f.fileType === 'stl' || f.fileType === 'ply' ||
 f.fileName?.toLowerCase().endsWith('.stl') ||
 f.fileName?.toLowerCase().endsWith('.ply')
 )
 );
 setCases(withFiles);
 if (withFiles.length > 0) setSelectedCaseId(withFiles[0].id);
 } catch (err) {
 console.error('Error loading cases:', err);
 } finally {
 setLoading(false);
 }
 };
 loadCases();
 }, []);

 const selectedCase = cases.find(c => c.id === selectedCaseId);

 const getStatusBadge = (status: string) => {
 const map: Record<string, string> = {
 in_progress: 'bg-gray-50 text-amber-700 ring-1 ring-amber-500/20',
 received: 'bg-gray-50 text-sky-700 ring-1 ring-sky-500/20',
 qc: 'bg-violet-50 text-violet-700 ring-1 ring-violet-500/20',
 shipped: 'bg-gray-50 text-teal-700 ring-1 ring-teal-500/20',
 };
 const labelKey = `cases.statuses.${status}`;
 return (
 <span className={`px-2.5 py-1 text-xs font-semibold ${map[status] ?? 'bg-gray-100 text-gray-600 ring-1 ring-slate-400/20'}`}>
 {t(labelKey, { defaultValue: status })}
 </span>
 );
 };

 return (
 <div className="space-y-6 animate-fade-in">
 {loading ? (
 <div className="h-[500px] flex items-center justify-center">
 <div className="flex flex-col items-center gap-3 text-gray-400">
 <Loader2 size={32} className="animate-spin" />
 <p className="text-sm font-medium">Caricamento casi…</p>
 </div>
 </div>
 ) : cases.length === 0 ? (
 <div className="h-[500px] flex flex-col items-center justify-center gap-4 text-gray-400">
 <div className="w-16 h-16 bg-gray-50 flex items-center justify-center ring-1 ring-slate-100">
 <Box size={32} className="text-gray-300" />
 </div>
 <div className="text-center">
 <p className="text-sm font-medium text-gray-500">{t('viewer3d.noFilesAvailable', { defaultValue: 'Nessun caso con file 3D caricati' })}</p>
 <p className="text-xs text-gray-400 mt-1">{t('viewer3d.uploadToView', { defaultValue: 'Carica file STL o PLY su un caso per vederli qui' })}</p>
 </div>
 </div>
 ) : (
 <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
 {/* Case Selector Sidebar */}
 <div className="lg:h-[calc(100vh-8rem)]">
 <div className="card-base p-4 flex flex-col lg:h-full">
 <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 shrink-0 text-sm">
 <div className="w-8 h-8 bg-gray-100 flex items-center justify-center ring-1 ring-slate-200">
 <FolderOpen size={16} className="text-gray-500" />
 </div>
 {t('viewer3d.casesWithScans', { defaultValue: 'Casi con scan 3D' })}
 <span className="ml-auto text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 ">
 {cases.length}
 </span>
 </h3>
 <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
 {cases.map((c) => {
 const active = selectedCaseId === c.id;
 const firstType = c.teeth?.[0]?.workType;
 const teethList = c.teeth?.map((tooth) => tooth.toothNumber).join(', ');
 return (
 <button
 key={c.id}
 onClick={() => setSelectedCaseId(c.id)}
 className={`w-full text-left p-3 transition-all ${
 active
 ? 'bg-gray-800 text-white '
 : 'bg-gray-50 hover:bg-gray-100 text-gray-700 ring-1 ring-slate-100'
 }`}
 >
 <div className="flex items-center gap-3">
 <ClientAvatar
 studioName={c.client?.studioName || '?'}
 logoUrl={c.client?.logoUrl}
 size={36}
 rounded=""
 />
 <div className="flex-1 min-w-0">
 <p className={`font-semibold text-sm truncate ${active ? 'text-white' : 'text-gray-800'}`} dir="auto">
 {c.client?.studioName}
 </p>
 {c.patientName && (
 <p className={`text-xs truncate ${active ? 'text-white/70' : 'text-gray-500'}`} dir="auto">
 {c.patientName}
 </p>
 )}
 {(firstType || teethList) && (
 <p className={`text-[11px] truncate ${active ? 'text-white/50' : 'text-gray-400'}`}>
 {firstType ? t(`dental.workTypes.${firstType}`, { defaultValue: firstType }) : ''}
 {teethList ? ` · ${teethList}` : ''}
 </p>
 )}
 </div>
 <ChevronRight size={16} className={active ? 'text-white/70' : 'text-gray-400'} />
 </div>
 </button>
 );
 })}
 </div>
 </div>
 </div>

 {/* 3D Viewer */}
 <div className="lg:col-span-3 lg:h-[calc(100vh-8rem)]">
 <div className="card-base overflow-hidden lg:h-full flex flex-col">
 {selectedCase && (
 <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3 shrink-0">
 <div className="flex items-center gap-3 min-w-0">
 <ClientAvatar
 studioName={selectedCase.client?.studioName || '?'}
 logoUrl={selectedCase.client?.logoUrl}
 size={40}
 rounded=""
 />
 <div className="min-w-0">
 <h2 className="font-bold text-gray-800 truncate text-sm" dir="auto">{selectedCase.client?.studioName}</h2>
 {selectedCase.patientName && (
 <p className="text-xs text-gray-500 truncate" dir="auto">{selectedCase.patientName}</p>
 )}
 </div>
 </div>
 <div className="shrink-0 flex items-center gap-2">
 <div className="w-8 h-8 bg-gray-50 flex items-center justify-center ring-1 ring-slate-100">
 <Scan size={16} className="text-gray-400" />
 </div>
 {getStatusBadge(selectedCase.status)}
 </div>
 </div>
 )}
 <div className="flex-1 min-h-0">
 {selectedCaseId && <Case3DViewer key={selectedCaseId} caseId={selectedCaseId} />}
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
