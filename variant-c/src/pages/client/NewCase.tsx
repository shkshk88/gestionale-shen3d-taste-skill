import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
 ArrowLeft,
 Check,
 Upload,
 User,
 AlertTriangle,
 X,
 Box,
 FileImage,
 FileBox,
 Clock,
 Flag,
 Stethoscope
} from 'lucide-react';
import caseService from '../../services/case.service';
import dentistService, { type Dentist } from '../../services/dentist.service';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/use-toast';
import { summarizeToothRanges } from '@/utils/teeth';

// FDI Dental Schema
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];

const WORK_TYPES = [
 { id: 'zirconia', name: 'dental.workTypes.coronaZirconia', color: 'bg-blue-500', material: 'ZR', workType: 'corona' },
 { id: 'emax', name: 'dental.workTypes.coronaEmax', color: 'bg-violet-500', material: 'EMAX', workType: 'corona' },
 { id: 'metal-ceramic', name: 'dental.workTypes.metalCeramic', color: 'bg-orange-500', material: 'CR_CO', workType: 'corona' },
 { id: 'implant', name: 'dental.workTypes.impianto', color: 'bg-blue-500', material: 'ZR', workType: 'impianto' },
 { id: 'bridge', name: 'dental.workTypes.ponte', color: 'bg-red-500', material: 'ZR', workType: 'protesi' },
 { id: 'veneer', name: 'dental.workTypes.faccetta', color: 'bg-pink-500', material: 'EMAX', workType: 'faccetta' },
 { id: 'temporary', name: 'dental.workTypes.provvisorio', color: 'bg-gray-400', material: 'PMMA', workType: 'altro' },
];

interface SelectedTooth {
 number: number;
 workType: typeof WORK_TYPES[0];
}

interface UploadedFile {
 file: File;
 id: string;
}

export default function NewCase() {
 const { t } = useTranslation();
 const navigate = useNavigate();
 const { user, _hasHydrated } = useAuthStore();
 const { toast } = useToast();
 const [loading, setLoading] = useState(false);
 const [uploadProgress, setUploadProgress] = useState(0);

 const [patientName, setPatientName] = useState('');
 const [patientNotes, setPatientNotes] = useState('');
 const [selectedDentistId, setSelectedDentistId] = useState('');
 const [dentists, setDentists] = useState<Dentist[]>([]);
 const [selectedTeeth, setSelectedTeeth] = useState<SelectedTooth[]>([]);
 const [currentWorkType, setCurrentWorkType] = useState(WORK_TYPES[0]);
 const [requestedDate, setRequestedDate] = useState('');
 const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
 const [files, setFiles] = useState<UploadedFile[]>([]);
 const fileInputRef = useRef<HTMLInputElement>(null);
 const [ctrlPressed, setCtrlPressed] = useState(false);
 const [lastClickedTooth, setLastClickedTooth] = useState<number | null>(null);

 const hasClientId = user?.clientId || user?.client?.id;

 useEffect(() => {
 const loadDentists = async () => {
 const currentUser = useAuthStore.getState().user;
 const clientId = currentUser?.clientId || currentUser?.client?.id;
 if (clientId) {
 try {
 const dentistsData = await dentistService.getDentistsByClient(clientId);
 setDentists(dentistsData);
 if (dentistsData.length === 1) {
 setSelectedDentistId(dentistsData[0].id);
 }
 } catch (error) {
 console.error('Error loading dentists:', error);
 }
 }
 };
 if (_hasHydrated) {
 loadDentists();
 }
 }, [user, _hasHydrated]);

 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.key === 'Control' || e.key === 'Meta') {
 setCtrlPressed(true);
 }
 };
 const handleKeyUp = (e: KeyboardEvent) => {
 if (e.key === 'Control' || e.key === 'Meta') {
 setCtrlPressed(false);
 }
 };
 window.addEventListener('keydown', handleKeyDown);
 window.addEventListener('keyup', handleKeyUp);
 return () => {
 window.removeEventListener('keydown', handleKeyDown);
 window.removeEventListener('keyup', handleKeyUp);
 };
 }, []);

 const isUpperTooth = (toothNumber: number): boolean => {
 return toothNumber >= 11 && toothNumber <= 28;
 };

 const getTeethInRange = (start: number, end: number): number[] => {
 const startIsUpper = isUpperTooth(start);
 const endIsUpper = isUpperTooth(end);
 if (startIsUpper !== endIsUpper) return [end];
 const allTeeth = startIsUpper
 ? [...UPPER_RIGHT, ...UPPER_LEFT]
 : [...LOWER_RIGHT, ...LOWER_LEFT];
 const startIndex = allTeeth.indexOf(start);
 const endIndex = allTeeth.indexOf(end);
 if (startIndex === -1 || endIndex === -1) return [end];
 const minIndex = Math.min(startIndex, endIndex);
 const maxIndex = Math.max(startIndex, endIndex);
 return allTeeth.slice(minIndex, maxIndex + 1);
 };

 const handleToothClick = (toothNumber: number) => {
 const existingIndex = selectedTeeth.findIndex(t => t.number === toothNumber);

 if (ctrlPressed && lastClickedTooth !== null && lastClickedTooth !== toothNumber) {
 const teethRange = getTeethInRange(lastClickedTooth, toothNumber);
 setSelectedTeeth(prev => {
 const newSelection = [...prev];
 teethRange.forEach(num => {
 const existingIdx = newSelection.findIndex(t => t.number === num);
 if (existingIdx >= 0) {
 newSelection[existingIdx] = { number: num, workType: currentWorkType };
 } else {
 newSelection.push({ number: num, workType: currentWorkType });
 }
 });
 return newSelection;
 });
 setLastClickedTooth(toothNumber);
 return;
 }

 if (existingIndex >= 0) {
 setSelectedTeeth(prev => prev.filter(t => t.number !== toothNumber));
 } else {
 setSelectedTeeth(prev => [...prev, { number: toothNumber, workType: currentWorkType }]);
 }
 setLastClickedTooth(toothNumber);
 };

 const getToothColor = (toothNumber: number): string => {
 const tooth = selectedTeeth.find(t => t.number === toothNumber);
 return tooth ? tooth.workType.color : 'bg-gray-200 hover:bg-gray-300';
 };

 const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
 const selectedFiles = event.target.files;
 if (selectedFiles && selectedFiles.length > 0) {
 const newFiles: UploadedFile[] = Array.from(selectedFiles).map(file => ({
 file,
 id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
 }));
 setFiles(prev => [...prev, ...newFiles]);
 }
 if (fileInputRef.current) {
 fileInputRef.current.value = '';
 }
 };

 const handleRemoveFile = (id: string) => {
 setFiles(prev => prev.filter(f => f.id !== id));
 };

 const formatFileSize = (bytes: number): string => {
 if (bytes < 1024) return bytes + ' B';
 if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
 return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
 };

 const getFileIcon = (filename: string) => {
 const ext = filename.split('.').pop()?.toLowerCase();
 if (['jpg', 'jpeg', 'png', 'heic', 'webp'].includes(ext || '')) {
 return <FileImage size={20} className="text-violet-600" />;
 }
 return <FileBox size={20} className="text-blue-600" />;
 };

 const handleSubmit = async () => {
 if (loading) return;
 if (!_hasHydrated) {
 toast({
 title: t('newCase.wait'),
 description: t('newCase.loadingUserData'),
 });
 return;
 }

 const clientId = user?.clientId || user?.client?.id;
 if (!clientId) {
 toast({
 title: t('newCase.configError'),
 description: t('newCase.clientNotAssociated'),
 variant: 'destructive',
 });
 return;
 }

 try {
 setLoading(true);
 setUploadProgress(0);

 const caseData = {
 clientId: clientId,
 dentistId: selectedDentistId || undefined,
 patientName: patientName.trim() || 'N/A',
 patientNotes: patientNotes.trim() || undefined,
 priority,
 dueDate: requestedDate ? new Date(requestedDate).toISOString() : undefined,
 teeth: selectedTeeth.map(tooth => ({
 toothNumber: tooth.number,
 workType: tooth.workType.workType,
 material: tooth.workType.material,
 unitPrice: 0,
 })),
 notesInternal: patientNotes.trim() || undefined,
 };

 const newCase = await caseService.createCase(caseData);

 if (files.length > 0) {
 try {
 const fileList = files.map(f => f.file);
 await caseService.uploadFiles(
 newCase.id,
 fileList,
 (progress) => setUploadProgress(progress)
 );
 } catch (uploadError) {
 toast({
 title: t('common.warning'),
 description: t('newCase.caseCreatedUploadError'),
 variant: 'destructive',
 });
 }
 }

 navigate('/portal/case-confirmation', {
 state: {
 caseNumber: newCase.caseNumber,
 patientName: newCase.patientName,
 teeth: selectedTeeth,
 fileCount: files.length,
 dueDate: requestedDate,
 priority,
 }
 });
 } catch (error: any) {
 toast({
 title: t('common.error'),
 description: error.response?.data?.message || error.message || t('newCase.cannotCreateCase'),
 variant: 'destructive',
 });
 } finally {
 setLoading(false);
 }
 };

 const ToothButton = ({ number }: { number: number }) => (
 <button
 type="button"
 onClick={() => handleToothClick(number)}
 className={`aspect-[3/4] w-full min-w-0 sm: ${getToothColor(number)} text-[10px] sm:text-xs font-medium transition-all duration-200 flex items-center justify-center ${
 selectedTeeth.find(t => t.number === number) ? 'text-white scale-105' : 'text-gray-600'
 }`}
 >
 {number}
 </button>
 );

 if (!_hasHydrated) {
 return (
 <div className="flex items-center justify-center min-h-[400px]">
 <div className="text-center">
 <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
 <p className="text-gray-500">{t('newCase.loadingUserData')}</p>
 </div>
 </div>
 );
 }

 const isFakeUser = user?.id === 'client-1' || user?.id === 'dev-client-user' || user?.id === 'dev-admin';
 if (!hasClientId && !isFakeUser && user?.role === 'client') {
 return (
 <div className="space-y-6 animate-fade-in max-w-4xl mx-auto p-4">
 <div className="flex items-center gap-4">
 <Link
 to="/portal"
 className="w-10 h-10 bg-white border border-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-all"
 >
 <ArrowLeft size={20} />
 </Link>
 <h1 className="text-2xl font-bold text-gray-800">{t('newCase.title')}</h1>
 </div>

 <div className="bg-white border border-gray-100 p-8 text-center">
 <div className="w-16 h-16 bg-red-50 flex items-center justify-center mx-auto mb-4">
 <AlertTriangle size={32} className="text-red-500" />
 </div>
 <h2 className="text-xl font-semibold text-red-600 mb-2">{t('newCase.configErrorTitle')}</h2>
 <p className="text-gray-600 mb-6">
 {t('newCase.clientNotAssociatedError')}
 </p>

 <div className="bg-gray-100 p-4 mb-6 text-left font-mono text-xs overflow-auto max-h-40">
 <p className="font-semibold mb-2">Debug Info:</p>
 <p>User ID: {user?.id || 'N/A'}</p>
 <p>User Name: {user?.name || 'N/A'}</p>
 <p>User Role: {user?.role || 'N/A'}</p>
 <p>Client ID: {user?.clientId || 'N/A'}</p>
 <p>Client Obj: {user?.client ? t('common.yes') : t('common.no')}</p>
 </div>

 <div className="flex flex-col sm:flex-row gap-3 justify-center">
 <button
 onClick={() => {
 localStorage.removeItem('auth-storage');
 window.location.reload();
 }}
 className="px-6 py-3 bg-blue-600 text-white font-medium hover:bg-sky-700 transition-all"
 >
 {t('newCase.reloadSession')}
 </button>
 </div>
 </div>
 </div>
 );
 }

 return (
 <div className="space-y-3 animate-fade-in max-w-6xl mx-auto p-2 sm:p-4">
 <div className="bg-white border border-gray-100 p-4 sm:p-6 space-y-4">

 {/* Top section: 3 columns */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Column 1: Patient Data */}
 <div className="space-y-4">
 <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-100">
 <User size={18} className="text-blue-500" />
 {t('newCase.patientData')}
 </h2>
 <div className="space-y-3">
 <div>
 <label className="block text-xs font-medium text-gray-600 mb-1.5">
 {t('newCase.patientNameLabel')}
 </label>
 <input
 type="text"
 value={patientName}
 onChange={(e) => setPatientName(e.target.value)}
 placeholder={t('newCase.patientNamePlaceholder')}
 className="input-modern w-full text-sm"
 />
 </div>
 <div>
 <label className="block text-xs font-medium text-gray-600 mb-1.5">
 {t('newCase.referringDentist')}
 </label>
 <div className="relative">
 <Stethoscope size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
 {dentists.length === 0 && (
 <div className="input-modern w-full text-sm pl-9 bg-gray-100 text-gray-500">
 {t('newCase.noDentists')}
 </div>
 )}
 {dentists.length === 1 && (
 <div className="input-modern w-full text-sm pl-9 bg-gray-50 text-gray-700">
 {dentists[0].name}
 {dentists[0].specialization && (
 <span className="text-gray-500 ml-1">({dentists[0].specialization})</span>
 )}
 </div>
 )}
 {dentists.length > 1 && (
 <select
 value={selectedDentistId}
 onChange={(e) => setSelectedDentistId(e.target.value)}
 className="input-modern w-full text-sm pl-9 appearance-none cursor-pointer"
 >
 <option value="">{t('newCase.selectDentist')}</option>
 {dentists.map((dentist) => (
 <option key={dentist.id} value={dentist.id}>
 {dentist.name} {dentist.specialization ? `(${dentist.specialization})` : ''}
 </option>
 ))}
 </select>
 )}
 </div>
 </div>
 <div>
 <label className="block text-xs font-medium text-gray-600 mb-1.5">
 {t('newCase.patientNotesLabel')}
 </label>
 <textarea
 value={patientNotes}
 onChange={(e) => setPatientNotes(e.target.value)}
 rows={2}
 placeholder={t('newCase.patientNotesPlaceholder')}
 className="input-modern w-full resize-none text-sm"
 />
 </div>
 </div>
 </div>

 {/* Column 2: Delivery & Priority */}
 <div className="space-y-4">
 <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-100">
 <Clock size={18} className="text-blue-500" />
 {t('newCase.deliveryAndPriority')}
 </h2>
 <div className="space-y-3">
 <div>
 <label className="block text-xs font-medium text-gray-600 mb-1.5">
 Data Invio
 </label>
 <input
 type="date"
 value={new Date().toISOString().split('T')[0]}
 disabled
 className="input-modern w-full text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
 />
 <p className="text-[10px] text-gray-400 mt-1">Data automatica di oggi</p>
 </div>

 <div>
 <label className="block text-xs font-medium text-gray-600 mb-1.5">
 {t('newCase.requestedDeliveryDate')}
 </label>
 <input
 type="date"
 value={requestedDate}
 onChange={(e) => setRequestedDate(e.target.value)}
 className="input-modern w-full text-sm"
 />
 </div>

 <div className="flex items-center gap-2">
 <label className="text-[10px] font-medium text-gray-500 shrink-0">
 {t('newCase.priorityLabel')}
 </label>
 <div className="flex gap-1 flex-1">
 <button
 onClick={() => setPriority('normal')}
 className={`flex-1 px-2 py-1 text-[10px] font-medium transition-all flex items-center justify-center gap-1 ${
 priority === 'normal'
 ? 'bg-gray-50 text-teal-700 ring-1 ring-teal-500'
 : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
 }`}
 >
 <Flag size={10} />
 Normale
 </button>
 <button
 onClick={() => setPriority('urgent')}
 className={`flex-1 px-2 py-1 text-[10px] font-medium transition-all flex items-center justify-center gap-1 ${
 priority === 'urgent'
 ? 'bg-gray-50 text-amber-700 ring-1 ring-amber-500'
 : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
 }`}
 >
 <AlertTriangle size={10} />
 Urgente
 </button>
 </div>
 </div>
 </div>
 </div>

 {/* Column 3: Attachments */}
 <div className="space-y-4">
 <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-100">
 <Box size={18} className="text-blue-500" />
 File Allegati
 {files.length > 0 && (
 <span className="ml-auto text-xs bg-blue-600 text-white px-2 py-0.5 ">
 {files.length}
 </span>
 )}
 </h2>

 <div>
 <input
 ref={fileInputRef}
 type="file"
 multiple
 accept=".jpg,.jpeg,.png,.heic,.webp,.stl,.ply"
 onChange={handleFileSelect}
 className="hidden"
 />
 <div
 onClick={() => fileInputRef.current?.click()}
 className="border-2 border-dashed border-gray-300 p-3 text-center hover:border-gray-500 hover:bg-gray-50/50 transition-colors cursor-pointer"
 >
 <div className="flex items-center justify-center gap-2">
 <Upload size={16} className="text-gray-400" />
 <div className="text-left">
 <p className="text-gray-700 text-xs font-medium">Clicca o trascina file</p>
 <p className="text-[10px] text-gray-400">JPG, PNG, STL, PLY - Max 20MB</p>
 </div>
 </div>
 </div>
 </div>

 <div className="bg-gray-100 p-3 min-h-[100px] max-h-[160px] overflow-y-auto">
 {files.length === 0 ? (
 <div className="flex flex-col items-center justify-center h-full text-gray-400 py-4">
 <FileBox size={20} className="mb-1 opacity-50" />
 <p className="text-[10px] text-center">Nessun file caricato</p>
 </div>
 ) : (
 <div className="space-y-2">
 {files.map((fileObj) => (
 <div key={fileObj.id} className="flex items-center justify-between p-2 bg-white border border-gray-100">
 <div className="flex items-center gap-2 min-w-0">
 <div className="w-7 h-7 bg-gray-100 flex items-center justify-center flex-shrink-0">
 {getFileIcon(fileObj.file.name)}
 </div>
 <div className="min-w-0">
 <p className="text-xs font-medium text-gray-700 truncate max-w-[120px]">{fileObj.file.name}</p>
 <p className="text-[10px] text-gray-400">{formatFileSize(fileObj.file.size)}</p>
 </div>
 </div>
 <button
 type="button"
 onClick={() => handleRemoveFile(fileObj.id)}
 className="text-gray-400 hover:text-red-500 p-1 flex-shrink-0"
 >
 <X size={12} />
 </button>
 </div>
 ))}
 </div>
 )}
 </div>

 {uploadProgress > 0 && uploadProgress < 100 && (
 <div className="space-y-1">
 <div className="flex justify-between text-xs">
 <span className="text-gray-600">Caricamento...</span>
 <span className="text-gray-800 font-medium">{uploadProgress}%</span>
 </div>
 <div className="h-1.5 bg-gray-200 overflow-hidden">
 <div className="h-full bg-blue-600 transition-all " style={{ width: `${uploadProgress}%` }} />
 </div>
 </div>
 )}
 </div>
 </div>

 <div className="border-t border-gray-100" />

 {/* Tooth selection section */}
 <div className="space-y-4">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
 Selezione Denti *
 </h2>
 <div className="flex flex-wrap gap-1.5">
 {WORK_TYPES.map(type => (
 <button
 key={type.id}
 onClick={() => setCurrentWorkType(type)}
 className={`flex items-center gap-1 px-2 py-1 text-[10px] font-medium transition-all ${
 currentWorkType.id === type.id
 ? 'bg-blue-600 text-white'
 : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
 }`}
 >
 <div className={`w-1.5 h-1.5 ${type.color}`} />
 {t(type.name)}
 </button>
 ))}
 </div>
 </div>

 <div className="bg-gray-100 p-2 sm:p-6">
 <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 sm:gap-2 mb-1">
 <div className="grid grid-cols-8 gap-px sm:gap-1">
 {UPPER_RIGHT.map(num => <ToothButton key={num} number={num} />)}
 </div>
 <div className="w-px h-full bg-gray-300" />
 <div className="grid grid-cols-8 gap-px sm:gap-1">
 {UPPER_LEFT.map(num => <ToothButton key={num} number={num} />)}
 </div>
 </div>

 <div className="flex items-center gap-2 sm:gap-4 my-2">
 <div className="flex-1 h-0.5 bg-gray-300" />
 <span className="text-[10px] sm:text-xs text-gray-400 font-medium">FDI</span>
 <div className="flex-1 h-0.5 bg-gray-300" />
 </div>

 <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 sm:gap-2 mt-1">
 <div className="grid grid-cols-8 gap-px sm:gap-1">
 {LOWER_RIGHT.map(num => <ToothButton key={num} number={num} />)}
 </div>
 <div className="w-px h-full bg-gray-300" />
 <div className="grid grid-cols-8 gap-px sm:gap-1">
 {LOWER_LEFT.map(num => <ToothButton key={num} number={num} />)}
 </div>
 </div>
 </div>

 {selectedTeeth.length > 0 && (
 <div className="bg-gray-50 p-3">
 <p className="text-xs font-medium text-gray-600 mb-2">
 Denti selezionati ({selectedTeeth.length}):
 </p>
 <div className="space-y-1.5">
 {Object.values(
 selectedTeeth.reduce((acc, tooth) => {
 const key = tooth.workType.id;
 if (!acc[key]) acc[key] = { workType: tooth.workType, numbers: [] };
 acc[key].numbers.push(tooth.number);
 return acc;
 }, {} as Record<string, { workType: typeof WORK_TYPES[0]; numbers: number[] }>)
 ).map((group) => (
 <div
 key={group.workType.id}
 className="flex items-center justify-between gap-2 bg-white border border-gray-100 px-2.5 py-1.5"
 >
 <div className="flex items-center gap-2 min-w-0">
 <div className={`w-2 h-2 shrink-0 ${group.workType.color}`} />
 <span className="text-xs font-medium text-gray-700 truncate">{t(group.workType.name)}</span>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <span className="text-xs font-mono text-gray-500">{summarizeToothRanges(group.numbers)}</span>
 <button
 type="button"
 onClick={() => setSelectedTeeth(prev => prev.filter(tt => !group.numbers.includes(tt.number)))}
 className="text-gray-400 hover:text-red-500"
 title="Rimuovi"
 >
 <X size={12} />
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>

 <div className="border-t border-gray-100" />

 {/* Footer */}
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
 <p className="text-[10px] text-gray-400 flex items-center gap-1">
 <span className="text-gray-500">💡</span> <kbd className="px-1 py-0.5 bg-gray-100 border rounded text-[9px]">CTRL</kbd> + click per selezionare range
 </p>
 <div className="flex items-center gap-2">
 <Link
 to="/portal"
 className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all"
 >
 <ArrowLeft size={12} />
 Annulla
 </Link>
 <button
 onClick={handleSubmit}
 disabled={loading || !_hasHydrated}
 className="flex items-center gap-1 px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold hover:bg-sky-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
 >
 <Check size={12} />
 {loading ? 'Invio…' : !_hasHydrated ? 'Caricamento…' : 'Invia Caso'}
 </button>
 </div>
 </div>
 </div>
 </div>
 );
}
