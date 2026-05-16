import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Upload,
  User,
  Calendar,
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

// FDI Dental Schema
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];

const WORK_TYPES = [
  { id: 'zirconia', name: 'dental.workTypes.coronaZirconia', color: 'bg-blue-500', material: 'ZR', workType: 'corona' },
  { id: 'emax', name: 'dental.workTypes.coronaEmax', color: 'bg-purple-500', material: 'EMAX', workType: 'corona' },
  { id: 'metal-ceramic', name: 'dental.workTypes.metalCeramic', color: 'bg-orange-500', material: 'CR_CO', workType: 'corona' },
  { id: 'implant', name: 'dental.workTypes.impianto', color: 'bg-green-500', material: 'ZR', workType: 'impianto' },
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

  // Form state
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

  // Check if user has client association
  const hasClientId = user?.clientId || user?.client?.id;

  // Load dentists when component mounts, user changes, or store hydrates
  useEffect(() => {
    const loadDentists = async () => {
      // Get clientId from user store at runtime
      const currentUser = useAuthStore.getState().user;
      const clientId = currentUser?.clientId || currentUser?.client?.id;
      if (clientId) {
        try {
          const dentistsData = await dentistService.getDentistsByClient(clientId);
          setDentists(dentistsData);

          // Auto-select if only one dentist
          if (dentistsData.length === 1) {
            setSelectedDentistId(dentistsData[0].id);
          }
        } catch (error) {
          console.error('Error loading dentists:', error);
        }
      }
    };
    // Only load dentists after store has hydrated
    if (_hasHydrated) {
      loadDentists();
    }
  }, [user, _hasHydrated]);

  // Track CTRL key for multi-selection
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

  // Check if a tooth is in upper or lower arch
  const isUpperTooth = (toothNumber: number): boolean => {
    return toothNumber >= 11 && toothNumber <= 28;
  };

  // Get all teeth in range for the same arch
  const getTeethInRange = (start: number, end: number): number[] => {
    const startIsUpper = isUpperTooth(start);
    const endIsUpper = isUpperTooth(end);

    // Only select range if both teeth are in the same arch
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

    // If CTRL is pressed and we have a previous selection, select range
    if (ctrlPressed && lastClickedTooth !== null && lastClickedTooth !== toothNumber) {
      const teethRange = getTeethInRange(lastClickedTooth, toothNumber);
      setSelectedTeeth(prev => {
        const newSelection = [...prev];
        teethRange.forEach(num => {
          const existingIdx = newSelection.findIndex(t => t.number === num);
          if (existingIdx >= 0) {
            // Update work type if already selected
            newSelection[existingIdx] = { number: num, workType: currentWorkType };
          } else {
            // Add new tooth
            newSelection.push({ number: num, workType: currentWorkType });
          }
        });
        return newSelection;
      });
      setLastClickedTooth(toothNumber);
      return;
    }

    // Normal single click behavior
    if (existingIndex >= 0) {
      setSelectedTeeth(prev => prev.filter(t => t.number !== toothNumber));
    } else {
      setSelectedTeeth(prev => [...prev, { number: toothNumber, workType: currentWorkType }]);
    }
    setLastClickedTooth(toothNumber);
  };

  const getToothColor = (toothNumber: number): string => {
    const tooth = selectedTeeth.find(t => t.number === toothNumber);
    return tooth ? tooth.workType.color : 'bg-neutral-200 hover:bg-neutral-300';
  };

  // Add files (append mode, not replace)
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const newFiles: UploadedFile[] = Array.from(selectedFiles).map(file => ({
        file,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
    // Reset input to allow selecting same files again
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
      return <FileImage size={20} className="text-purple-600" />;
    }
    return <FileBox size={20} className="text-blue-600" />;
  };

  const handleSubmit = async () => {
    // Prevent double submit
    if (loading) {
      console.log('Submit already in progress, ignoring...');
      return;
    }

    // Wait for auth store to hydrate
    if (!_hasHydrated) {
      toast({
        title: t('newCase.wait'),
        description: t('newCase.loadingUserData'),
      });
      return;
    }

    // Validation
    if (!patientName.trim()) {
      toast({
        title: t('common.error'),
        description: t('newCase.enterPatientName'),
        variant: 'destructive',
      });
      return;
    }

    if (selectedTeeth.length === 0) {
      toast({
        title: t('common.error'),
        description: t('newCase.selectAtLeastOne'),
        variant: 'destructive',
      });
      return;
    }

    if (!requestedDate) {
      toast({
        title: t('common.error'),
        description: t('newCase.enterDeliveryDate'),
        variant: 'destructive',
      });
      return;
    }

    // Compute clientId dynamically from user object at submit time
    const clientId = user?.clientId || user?.client?.id;

    if (!clientId) {
      console.error('Submit blocked - no clientId. User:', user);
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
        patientName: patientName.trim(),
        patientNotes: patientNotes.trim() || undefined,
        priority,
        dueDate: new Date(requestedDate).toISOString(),
        teeth: selectedTeeth.map(tooth => ({
          toothNumber: tooth.number,
          workType: tooth.workType.workType,
          material: tooth.workType.material,
          unitPrice: 0,
        })),
        notesInternal: patientNotes.trim() || undefined,
      };

      console.log('Creating case with data:', caseData);
      const newCase = await caseService.createCase(caseData);
      console.log('Case created:', newCase);

      // Upload files if any
      if (files.length > 0) {
        try {
          console.log(`Uploading ${files.length} files...`);
          const fileList = files.map(f => f.file);
          await caseService.uploadFiles(
            newCase.id,
            fileList,
            (progress) => setUploadProgress(progress)
          );
          console.log('Files uploaded successfully');
        } catch (uploadError) {
          console.error('Error uploading files:', uploadError);
          toast({
            title: t('common.warning'),
            description: t('newCase.caseCreatedUploadError'),
            variant: 'destructive',
          });
        }
      }

      // Navigate to confirmation page with case data
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
      console.error('Error creating case:', error);
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
      className={`w-8 h-11 rounded-lg ${getToothColor(number)} text-xs font-medium transition-all duration-200 flex items-center justify-center ${
        selectedTeeth.find(t => t.number === number) ? 'text-white shadow-md scale-105' : 'text-neutral-600'
      }`}
    >
      {number}
    </button>
  );

  // Show error banner if no clientId AND user is not in loading state
  // Wait a bit to allow store to settle after login
  if (!_hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-card-teal mx-auto mb-4"></div>
          <p className="text-neutral-500">{t('newCase.loadingUserData')}</p>
        </div>
      </div>
    );
  }

  // Only show error if we have a real user (not fake) without clientId
  const isFakeUser = user?.id === 'client-1' || user?.id === 'dev-client-user' || user?.id === 'dev-admin';
  if (!hasClientId && !isFakeUser && user?.role === 'client') {
    return (
      <div className="space-y-6 animate-fade-in max-w-4xl mx-auto p-4">
        <div className="flex items-center gap-4">
          <Link
            to="/portal"
            className="w-10 h-10 rounded-xl bg-white shadow-soft flex items-center justify-center text-neutral-500 hover:text-neutral-800 transition-all"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-neutral-800">{t('newCase.title')}</h1>
        </div>

        <div className="card-base p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">{t('newCase.configErrorTitle')}</h2>
          <p className="text-neutral-600 mb-6">
            {t('newCase.clientNotAssociatedError')}
          </p>

          <div className="bg-slate-100 rounded-xl p-4 mb-6 text-left font-mono text-xs overflow-auto max-h-40">
            <p className="font-semibold mb-2">Debug Info:</p>
            <p>User ID: {user?.id || 'N/A'}</p>
            <p>User Name: {user?.name || 'N/A'}</p>
            <p>User Role: {user?.role || 'N/A'}</p>
            <p>Client ID: {user?.clientId || 'N/A'}</p>
            <p>Client Obj: {user?.client ? 'Presente' : 'Mancante'}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                localStorage.removeItem('auth-storage');
                window.location.reload();
              }}
              className="px-6 py-3 bg-card-teal text-white rounded-xl font-medium hover:bg-card-teal/90 transition-all"
            >
              {t('newCase.reloadSession')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in max-w-6xl mx-auto p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/portal"
          className="w-10 h-10 rounded-xl bg-white shadow-soft flex items-center justify-center text-neutral-500 hover:text-neutral-800 transition-all"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">{t('newCase.title')}</h1>
          <p className="text-sm text-neutral-500">{t('newCase.fillAllFields')}</p>
        </div>
      </div>

      {/* UNICO Riquadro Principale */}
      <div className="card-base p-6 space-y-6">

        {/* SEZIONE SUPERIORE: 3 Colonne */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Colonna 1: Dati Paziente */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-neutral-800 flex items-center gap-2 pb-2 border-b border-neutral-200">
              <User size={18} className="text-card-teal" />
              {t('newCase.patientData')}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">
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
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                  {t('newCase.referringDentist')}
                </label>
                <div className="relative">
                  <Stethoscope size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />

                  {/* No dentists */}
                  {dentists.length === 0 && (
                    <div className="input-modern w-full text-sm pl-9 bg-neutral-100 text-neutral-500">
                      {t('newCase.noDentists')}
                    </div>
                  )}

                  {/* Single dentist - auto selected, show as text */}
                  {dentists.length === 1 && (
                    <div className="input-modern w-full text-sm pl-9 bg-neutral-50 text-neutral-700">
                      {dentists[0].name}
                      {dentists[0].specialization && (
                        <span className="text-neutral-500 ml-1">({dentists[0].specialization})</span>
                      )}
                    </div>
                  )}

                  {/* Multiple dentists - show dropdown */}
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
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">
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

          {/* Colonna 2: Consegna e Priorità */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-neutral-800 flex items-center gap-2 pb-2 border-b border-neutral-200">
              <Clock size={18} className="text-card-teal" />
              Consegna e Priorità
            </h2>
            <div className="space-y-3">
              {/* Data invio (non modificabile) */}
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                  Data Invio
                </label>
                <input
                  type="date"
                  value={new Date().toISOString().split('T')[0]}
                  disabled
                  className="input-modern w-full text-sm bg-neutral-100 text-neutral-500 cursor-not-allowed"
                />
                <p className="text-[10px] text-neutral-400 mt-1">Data automatica di oggi</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                  Data Consegna Richiesta *
                </label>
                <input
                  type="date"
                  value={requestedDate}
                  onChange={(e) => setRequestedDate(e.target.value)}
                  className="input-modern w-full text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                  Priorità
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPriority('normal')}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      priority === 'normal'
                        ? 'bg-green-100 text-green-700 ring-2 ring-green-500'
                        : 'bg-surface-secondary text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <Flag size={12} />
                      Normale
                    </div>
                  </button>
                  <button
                    onClick={() => setPriority('urgent')}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      priority === 'urgent'
                        ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-500'
                        : 'bg-surface-secondary text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <AlertTriangle size={12} />
                      Urgente
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Colonna 3: File Allegati */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-neutral-800 flex items-center gap-2 pb-2 border-b border-neutral-200">
              <Box size={18} className="text-card-teal" />
              File Allegati
              {files.length > 0 && (
                <span className="ml-auto text-xs bg-card-teal text-white px-2 py-0.5 rounded-full">
                  {files.length}
                </span>
              )}
            </h2>

            {/* UPLOAD AREA (sopra la lista) */}
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
                className="border-2 border-dashed border-neutral-300 rounded-xl p-3 text-center hover:border-card-teal hover:bg-card-teal/5 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-center gap-2">
                  <Upload size={16} className="text-neutral-400" />
                  <div className="text-left">
                    <p className="text-neutral-700 text-xs font-medium">Clicca o trascina file</p>
                    <p className="text-[10px] text-neutral-400">JPG, PNG, STL, PLY - Max 20MB</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista file selezionati (sotto l'upload) */}
            <div className="bg-surface-secondary rounded-xl p-3 min-h-[100px] max-h-[160px] overflow-y-auto">
              {files.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-neutral-400 py-4">
                  <FileBox size={20} className="mb-1 opacity-50" />
                  <p className="text-[10px] text-center">Nessun file caricato</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {files.map((fileObj) => (
                    <div key={fileObj.id} className="flex items-center justify-between p-2 bg-white rounded-lg shadow-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-md bg-surface-secondary flex items-center justify-center flex-shrink-0">
                          {getFileIcon(fileObj.file.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-neutral-700 truncate max-w-[120px]">{fileObj.file.name}</p>
                          <p className="text-[10px] text-neutral-400">{formatFileSize(fileObj.file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(fileObj.id)}
                        className="text-neutral-400 hover:text-red-500 p-1 flex-shrink-0"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Progress bar upload */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-600">Caricamento...</span>
                  <span className="text-neutral-800 font-medium">{uploadProgress}%</span>
                </div>
                <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-card-teal transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Separatore */}
        <div className="border-t border-neutral-200" />

        {/* SEZIONE INFERIORE: Schema Denti FDI */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-neutral-800 flex items-center gap-2">
              Selezione Denti *
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {WORK_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => setCurrentWorkType(type)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                    currentWorkType.id === type.id
                      ? 'bg-card-teal text-white'
                      : 'bg-surface-secondary text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${type.color}`} />
                  {type.name}
                </button>
              ))}
            </div>
          </div>

          {/* Schema FDI Compattato */}
          <div className="bg-surface-secondary rounded-2xl p-4 sm:p-6">
            {/* Arcata superiore */}
            <div className="flex justify-center gap-0.5 sm:gap-1 mb-1">
              <div className="flex gap-0.5 sm:gap-1 pr-2 sm:pr-4 border-r-2 border-neutral-300">
                {UPPER_RIGHT.map(num => <ToothButton key={num} number={num} />)}
              </div>
              <div className="flex gap-0.5 sm:gap-1 pl-2 sm:pl-4">
                {UPPER_LEFT.map(num => <ToothButton key={num} number={num} />)}
              </div>
            </div>

            {/* Separatore centrale */}
            <div className="flex items-center gap-4 my-2">
              <div className="flex-1 h-0.5 bg-neutral-300" />
              <span className="text-xs text-neutral-400 font-medium">FDI</span>
              <div className="flex-1 h-0.5 bg-neutral-300" />
            </div>

            {/* Arcata inferiore */}
            <div className="flex justify-center gap-0.5 sm:gap-1 mt-1">
              <div className="flex gap-0.5 sm:gap-1 pr-2 sm:pr-4 border-r-2 border-neutral-300">
                {LOWER_RIGHT.map(num => <ToothButton key={num} number={num} />)}
              </div>
              <div className="flex gap-0.5 sm:gap-1 pl-2 sm:pl-4">
                {LOWER_LEFT.map(num => <ToothButton key={num} number={num} />)}
              </div>
            </div>
          </div>

          {/* Denti selezionati (sotto lo schema) */}
          {selectedTeeth.length > 0 && (
            <div className="bg-neutral-50 rounded-xl p-3">
              <p className="text-xs font-medium text-neutral-600 mb-2">Denti selezionati:</p>
              <div className="flex flex-wrap gap-2">
                {selectedTeeth.map(tooth => (
                  <div key={tooth.number} className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg shadow-sm border border-neutral-200">
                    <div className={`w-2 h-2 rounded-full ${tooth.workType.color}`} />
                    <span className="text-xs font-medium">#{tooth.number}</span>
                    <span className="text-[10px] text-neutral-400">{tooth.workType.name}</span>
                    <button
                      onClick={() => handleToothClick(tooth.number)}
                      className="text-neutral-400 hover:text-red-500 ml-1"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Separatore */}
        <div className="border-t border-neutral-200" />

        {/* Info selezione multipla */}
        <div className="flex items-center justify-center gap-2 text-xs text-neutral-500 bg-neutral-50 rounded-lg py-2">
          <span className="font-medium">💡 Suggerimento:</span>
          <span>Tieni premuto <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px]">CTRL</kbd> e clicca un altro dente per selezionare l'intero range</span>
        </div>

      </div>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-72 bg-white/95 backdrop-blur-sm border-t border-neutral-200 p-4 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link
            to="/portal"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 transition-all text-sm"
          >
            <ArrowLeft size={16} />
            Annulla
          </Link>

          <button
            onClick={handleSubmit}
            disabled={loading || !_hasHydrated}
            className="flex items-center gap-2 px-6 py-2.5 bg-card-teal text-white rounded-xl font-medium hover:bg-card-teal/90 transition-all shadow-soft disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <Check size={16} />
            {loading ? 'Invio in corso...' : !_hasHydrated ? 'Caricamento...' : 'Invia Caso'}
          </button>
        </div>
      </div>
    </div>
  );
}
