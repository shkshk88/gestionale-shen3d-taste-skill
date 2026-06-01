import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import caseService from '../../../services/case.service';
import clientService from '../../../services/client.service';
import api from '../../../services/api';
import { useToast } from '../../../components/ui/use-toast';
import { ImagePreview } from '../../../components/viewer3d/ImagePreview';
import { Viewer3DModal } from '../../../components/viewer3d/Viewer3DModal';
import { summarizeToothRanges } from '@/utils/teeth';
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Box,
  ChevronDown,
  AlertTriangle,
  Calendar,
  Building2,
  Trash2,
  Eye,
  Scan,
  Sparkles
} from 'lucide-react';

// FDI Dental Schema - tooth numbers
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];

// Utility functions
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// Work types with colors
const WORK_TYPES = [
  { id: 'zirconia', name: 'dental.workTypes.coronaZirconia', color: 'bg-sky-500', price: 180 },
  { id: 'emax', name: 'dental.workTypes.coronaEmax', color: 'bg-violet-500', price: 200 },
  { id: 'metal-ceramic', name: 'dental.workTypes.metalCeramic', color: 'bg-orange-500', price: 120 },
  { id: 'implant', name: 'dental.workTypes.impianto', color: 'bg-teal-500', price: 250 },
  { id: 'bridge', name: 'dental.workTypes.ponte', color: 'bg-slate-600', price: 350 },
  { id: 'veneer', name: 'dental.workTypes.faccetta', color: 'bg-pink-500', price: 220 },
  { id: 'inlay', name: 'dental.workTypes.intarsio', color: 'bg-amber-500', price: 150 },
  { id: 'temporary', name: 'dental.workTypes.provvisorio', color: 'bg-slate-400', price: 50 },
];

interface SelectedTooth {
  number: number;
  workType: typeof WORK_TYPES[0];
}

interface UploadedFile {
  id: string;
  name: string;
  type: 'stl' | 'ply' | 'image' | 'document';
  size: string;
}

export default function CaseForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();
  const isEditing = !!id;

  // States
  const [clients, setClients] = useState<any[]>([]);
  const [dentists, setDentists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingDentists, setLoadingDentists] = useState(false);
  const [loadingCase, setLoadingCase] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedDentist, setSelectedDentist] = useState<string>('');
  const [patientName, setPatientName] = useState('');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent' | 'rush'>('normal');
  const [selectedTeeth, setSelectedTeeth] = useState<SelectedTooth[]>([]);
  const [currentWorkType, setCurrentWorkType] = useState(WORK_TYPES[0]);
  const [ctrlPressed, setCtrlPressed] = useState(false);
  const [lastClickedTooth, setLastClickedTooth] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [patientWarnings, setPatientWarnings] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showDentistDropdown, setShowDentistDropdown] = useState(false);
  const [showWorkTypeDropdown, setShowWorkTypeDropdown] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview modal states
  const [previewImage, setPreviewImage] = useState<{ isOpen: boolean; fileId: string; fileName: string }>({
    isOpen: false,
    fileId: '',
    fileName: ''
  });
  const [preview3D, setPreview3D] = useState<{ isOpen: boolean; fileId: string; fileName: string; fileType: 'stl' | 'ply' }>({
    isOpen: false,
    fileId: '',
    fileName: '',
    fileType: 'stl'
  });

  // Load clients on mount and pre-select from query param
  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoadingClients(true);
        const data = await clientService.getClients({ active: true });
        setClients(data);

        // Pre-select client from query param
        const urlParams = new URLSearchParams(window.location.search);
        const clientIdFromQuery = urlParams.get('clientId');
        if (clientIdFromQuery) {
          setSelectedClient(clientIdFromQuery);
        }
      } catch (error) {
        console.error('Error loading clients:', error);
        toast({
          title: t('common.error'),
          description: t('cases.errorLoadingClients'),
          variant: 'destructive',
        });
      } finally {
        setLoadingClients(false);
      }
    };

    loadClients();
  }, []);

  // Load dentists when client is selected
  useEffect(() => {
    if (!selectedClient) {
      setDentists([]);
      setSelectedDentist('');
      return;
    }

    const loadDentists = async () => {
      try {
        setLoadingDentists(true);
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const response = await fetch(`${apiUrl}/dentists/client/${selectedClient}`);
        const data = await response.json();
        setDentists(data);
      } catch (error) {
        console.error('Error loading dentists:', error);
        setDentists([]);
      } finally {
        setLoadingDentists(false);
      }
    };

    loadDentists();
  }, [selectedClient]);

  // Load case data for edit mode
  useEffect(() => {
    if (isEditing && id) {
      const loadCase = async () => {
        try {
          setLoadingCase(true);
          console.log('Loading case for edit, ID:', id);
          const caseData = await caseService.getCaseById(id);
          console.log('Case data loaded:', caseData);

          // Populate form fields
          setSelectedClient(caseData.clientId);
          setSelectedDentist(caseData.dentistId || '');
          setPatientName(caseData.patientName || '');
          setReceivedDate(caseData.receivedDate?.split('T')[0] || new Date().toISOString().split('T')[0]);
          setDueDate(caseData.dueDate?.split('T')[0] || '');
          setPriority(caseData.priority || 'normal');
          setNotes(caseData.notesInternal || '');
          setPatientWarnings(caseData.patientNotes || '');

          // Load existing files if any
          if (caseData.files && caseData.files.length > 0) {
            const mappedFiles: UploadedFile[] = caseData.files.map((f: any) => ({
              id: f.id,
              name: f.fileName,
              type: f.fileType,
              size: formatFileSize(f.fileSize),
            }));
            setUploadedFiles(mappedFiles);
          }

          // Map teeth data to selectedTeeth format
          if (caseData.teeth && caseData.teeth.length > 0) {
            const teethMapped: SelectedTooth[] = caseData.teeth.map((tooth: any) => {
              let workType = WORK_TYPES[0];

              const materialMatch = WORK_TYPES.find(wt => {
                const materialMap: Record<string, string> = {
                  'zirconia': 'ZR',
                  'emax': 'EMAX',
                  'metal-ceramic': 'CR_CO',
                  'implant': 'ZR',
                  'bridge': 'ZR',
                  'veneer': 'EMAX',
                  'inlay': 'EMAX',
                  'temporary': 'PMMA',
                };
                return materialMap[wt.id] === tooth.material;
              });

              const workTypeMatch = WORK_TYPES.find(wt => {
                const workTypeMap: Record<string, string> = {
                  'zirconia': 'corona',
                  'emax': 'corona',
                  'metal-ceramic': 'corona',
                  'implant': 'impianto',
                  'bridge': 'protesi',
                  'veneer': 'faccetta',
                  'inlay': 'intarsio',
                  'temporary': 'altro',
                };
                return workTypeMap[wt.id] === tooth.workType;
              });

              if (materialMatch) {
                workType = materialMatch;
              } else if (workTypeMatch) {
                workType = workTypeMatch;
              }

              return {
                number: tooth.toothNumber,
                workType: workType
              };
            });

            setSelectedTeeth(teethMapped);
          }

          toast({
            title: t('cases.caseLoaded'),
            description: t('cases.caseLoadedDesc'),
          });
        } catch (error: any) {
          console.error('Error loading case:', error);
          toast({
            title: t('common.error'),
            description: error.message || t('cases.errorLoadingCase'),
            variant: 'destructive',
          });
          navigate('/admin/cases');
        } finally {
          setLoadingCase(false);
        }
      };

      loadCase();
    }
  }, [id, isEditing, navigate, toast]);

  // Track CTRL/CMD for range multi-selection
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') setCtrlPressed(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') setCtrlPressed(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const isUpperTooth = (n: number) => n >= 11 && n <= 28;

  const getTeethInRange = (start: number, end: number): number[] => {
    const startUpper = isUpperTooth(start);
    if (startUpper !== isUpperTooth(end)) return [end];
    const arch = startUpper ? [...UPPER_RIGHT, ...UPPER_LEFT] : [...LOWER_RIGHT, ...LOWER_LEFT];
    const si = arch.indexOf(start);
    const ei = arch.indexOf(end);
    if (si === -1 || ei === -1) return [end];
    return arch.slice(Math.min(si, ei), Math.max(si, ei) + 1);
  };

  const handleToothClick = (toothNumber: number) => {
    if (ctrlPressed && lastClickedTooth !== null && lastClickedTooth !== toothNumber) {
      const range = getTeethInRange(lastClickedTooth, toothNumber);
      setSelectedTeeth(prev => {
        const next = [...prev];
        range.forEach(num => {
          const idx = next.findIndex(t => t.number === num);
          if (idx >= 0) next[idx] = { number: num, workType: currentWorkType };
          else next.push({ number: num, workType: currentWorkType });
        });
        return next;
      });
      setLastClickedTooth(toothNumber);
      return;
    }

    const existingIndex = selectedTeeth.findIndex(t => t.number === toothNumber);
    if (existingIndex >= 0) {
      setSelectedTeeth(prev => prev.filter(t => t.number !== toothNumber));
    } else {
      setSelectedTeeth(prev => [...prev, { number: toothNumber, workType: currentWorkType }]);
    }
    setLastClickedTooth(toothNumber);
  };

  const getToothColor = (toothNumber: number): string => {
    const tooth = selectedTeeth.find(t => t.number === toothNumber);
    if (tooth) {
      return tooth.workType.color;
    }
    return 'bg-slate-200 hover:bg-slate-300';
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const openImagePreview = (file: UploadedFile) => {
    setPreviewImage({
      isOpen: true,
      fileId: file.id,
      fileName: file.name
    });
  };

  const open3DPreview = (file: UploadedFile) => {
    if (file.type === 'stl' || file.type === 'ply') {
      setPreview3D({
        isOpen: true,
        fileId: file.id,
        fileName: file.name,
        fileType: file.type
      });
    }
  };

  const closeImagePreview = () => {
    setPreviewImage(prev => ({ ...prev, isOpen: false }));
  };

  const close3DPreview = () => {
    setPreview3D(prev => ({ ...prev, isOpen: false }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(files)]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveNewFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileTypeFromName = (filename: string): UploadedFile['type'] => {
    const ext = filename.toLowerCase();
    if (ext.endsWith('.stl')) return 'stl';
    if (ext.endsWith('.ply')) return 'ply';
    if (['.jpg', '.jpeg', '.png', '.heic', '.webp', '.gif', '.bmp'].some(e => ext.endsWith(e))) return 'image';
    return 'document';
  };

  const getFileIcon = (type: UploadedFile['type']) => {
    switch (type) {
      case 'stl':
      case 'ply':
        return Box;
      case 'image':
        return ImageIcon;
      default:
        return FileText;
    }
  };

  const calculateTotal = () => {
    return selectedTeeth.reduce((acc, tooth) => acc + tooth.workType.price, 0);
  };

  const handleSave = async () => {
    if (!selectedClient) {
      toast({
        title: t('common.error'),
        description: t('cases.selectClientLabel'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const workTypeMap: Record<string, string> = {
        'zirconia': 'corona',
        'emax': 'corona',
        'metal-ceramic': 'corona',
        'implant': 'impianto',
        'bridge': 'protesi',
        'veneer': 'faccetta',
        'inlay': 'intarsio',
        'temporary': 'altro',
      };

      const materialMap: Record<string, string> = {
        'zirconia': 'ZR',
        'emax': 'EMAX',
        'metal-ceramic': 'CR_CO',
        'implant': 'ZR',
        'bridge': 'ZR',
        'veneer': 'EMAX',
        'inlay': 'EMAX',
        'temporary': 'PMMA',
      };

      const caseData = {
        clientId: selectedClient,
        dentistId: selectedDentist || undefined,
        patientName: patientName.trim() || undefined,
        patientNotes: patientWarnings.trim() || undefined,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        teeth: selectedTeeth.map(tooth => ({
          toothNumber: tooth.number,
          workType: workTypeMap[tooth.workType.id] || 'altro',
          material: materialMap[tooth.workType.id] || 'ALT',
          unitPrice: tooth.workType.price,
        })),
        notesInternal: notes.trim() || undefined,
      };

      let savedCase;
      if (isEditing && id) {
        savedCase = await caseService.updateCase(id, caseData);
        toast({
          title: t('common.success'),
          description: `${savedCase.caseNumber} - ${t('cases.caseUpdated')}`,
        });
      } else {
        savedCase = await caseService.createCase(caseData);
        toast({
          title: t('common.success'),
          description: `${savedCase.caseNumber} - ${t('cases.caseCreated')}`,
        });
      }

      // Upload selected files if any
      if (selectedFiles.length > 0) {
        try {
          console.log(`Uploading ${selectedFiles.length} files...`);
          await api.uploadFiles(`/files/upload-multiple/${savedCase.id}`, selectedFiles);
          toast({
            title: t('cases.filesUploadedTitle'),
            description: t('cases.filesUploadedCount', { count: selectedFiles.length }),
          });
        } catch (uploadError: any) {
          console.error('Error uploading files:', uploadError);
          toast({
            title: t('common.warning'),
            description: t('cases.errorUploadingFiles'),
            variant: 'destructive',
          });
        }
      }

      if (isEditing && id) {
        navigate(`/admin/cases/${id}`);
      } else {
        navigate('/admin/cases');
      }
    } catch (error: any) {
      console.error('Error saving case:', error);
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || t(isEditing ? 'cases.errorUpdatingCase' : 'cases.errorCreatingCase'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('cases.deleteConfirm'))) {
      return;
    }

    try {
      setLoading(true);
      await caseService.deleteCase(id!);
      toast({
        title: t('common.success'),
        description: t('cases.caseDeleted'),
      });
      navigate('/admin/cases');
    } catch (error: any) {
      console.error('Error deleting case:', error);
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || t('cases.errorDeletingCase'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Render a single tooth button
  const ToothButton = ({ number }: { number: number }) => (
    <button
      type="button"
      onClick={() => handleToothClick(number)}
      className={`aspect-[3/4] w-full min-w-0 rounded-lg sm:rounded-xl ${getToothColor(number)} text-[10px] sm:text-xs font-medium transition-all duration-200 flex items-center justify-center ${
        selectedTeeth.find(t => t.number === number) ? 'text-white shadow-md scale-105' : 'text-slate-600'
      }`}
    >
      {number}
    </button>
  );

  // Show loading state while loading case data
  if (loadingCase) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-sky-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-500">{t('common.loadingCase')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in pb-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-800 hover:bg-slate-200 transition-colors shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 font-display">
              {isEditing ? t('cases.editCase') : t('cases.newCase')}
            </h1>
            <p className="text-sm text-slate-500">
              {isEditing ? t('cases.editCaseDesc') : t('cases.newCaseDesc')}
            </p>
          </div>
        </div>
        {!isEditing && (
          <Link
            to="/admin/import-vision"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 text-white text-sm font-medium shadow-sm hover:shadow-md hover:opacity-90 transition font-display"
          >
            <Sparkles size={16} />
            {t('cases.importFromPhoto', 'Importa da foto')}
          </Link>
        )}
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5 sm:p-6 space-y-6">

        {/* Top Section: 3 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Column 1: Client + Dentist + Patient + Notes */}
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100 font-display">
              <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <Building2 size={16} />
              </span>
              {t('cases.clientAndPatient')}
            </h2>
            <div className="space-y-4">
              {/* Cliente */}
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">{t('cases.client')} *</label>
                <button
                  type="button"
                  onClick={() => setShowClientDropdown(!showClientDropdown)}
                  className="input-modern w-full text-left flex items-center justify-between text-sm"
                >
                  <span className={selectedClient ? 'text-slate-800' : 'text-slate-400'}>
                    {selectedClient
                      ? clients.find(c => c.id === selectedClient)?.studioName
                      : loadingClients ? t('common.loading') : t('cases.selectClient')}
                  </span>
                  <ChevronDown size={16} className="text-slate-400" />
                </button>
                {showClientDropdown && (
                  <div className="absolute z-20 w-full mt-1 bg-white rounded-xl shadow-soft-lg border border-slate-100 py-2 max-h-60 overflow-y-auto">
                    {loadingClients ? (
                      <div className="px-3 py-2 text-slate-500 text-center text-sm">{t('common.loading')}</div>
                    ) : clients.length === 0 ? (
                      <div className="px-3 py-2 text-slate-500 text-center text-sm">{t('cases.noClientsFound')}</div>
                    ) : (
                      clients.map(client => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => { setSelectedClient(client.id); setShowClientDropdown(false); }}
                          className="w-full px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
                        >
                          <p className="text-sm font-medium text-slate-800">{client.studioName}</p>
                          <p className="text-xs text-slate-500">{client.contactPerson}</p>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Dentista */}
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">{t('cases.operatingDentist')}</label>
                <button
                  type="button"
                  onClick={() => selectedClient && setShowDentistDropdown(!showDentistDropdown)}
                  disabled={!selectedClient}
                  className="input-modern w-full text-left flex items-center justify-between text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className={selectedDentist ? 'text-slate-800' : 'text-slate-400'}>
                    {!selectedClient ? t('cases.selectClientFirst')
                      : selectedDentist ? dentists.find(d => d.id === selectedDentist)?.name
                      : loadingDentists ? t('common.loading')
                      : dentists.length === 0 ? t('cases.noDentistAvailable') : t('cases.selectDentist')}
                  </span>
                  <ChevronDown size={16} className="text-slate-400" />
                </button>
                {showDentistDropdown && dentists.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white rounded-xl shadow-soft-lg border border-slate-100 py-2 max-h-60 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => { setSelectedDentist(''); setShowDentistDropdown(false); }}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 text-slate-400 text-sm"
                    >
                      {t('cases.noDentist')}
                    </button>
                    {dentists.map(dentist => (
                      <button
                        key={dentist.id}
                        type="button"
                        onClick={() => { setSelectedDentist(dentist.id); setShowDentistDropdown(false); }}
                        className="w-full px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
                      >
                        <p className="text-sm font-medium text-slate-800">{dentist.name}</p>
                        {dentist.specialization && <p className="text-xs text-slate-500">{dentist.specialization}</p>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Paziente */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">{t('newCase.patientName')}</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder={t('cases.patientNameOptional')}
                  className="input-modern w-full text-sm"
                />
              </div>

              {/* Avvisi paziente */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                  <AlertTriangle size={12} className="text-amber-500" />
                  Avvisi paziente
                </label>
                <textarea
                  value={patientWarnings}
                  onChange={(e) => setPatientWarnings(e.target.value)}
                  rows={2}
                  placeholder={t('newCase.patientNotesPlaceholder')}
                  className="input-modern w-full resize-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Column 2: Date + Priority + Notes */}
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100 font-display">
              <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <Calendar size={16} />
              </span>
              {t('newCase.deliveryAndPriority')}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">{t('cases.receivedDate')}</label>
                <input
                  type="date"
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  className="input-modern w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">{t('cases.dueDate')}</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="input-modern w-full text-sm"
                />
              </div>

              {/* Priorità inline compatta */}
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-semibold text-slate-500 shrink-0 uppercase tracking-wider">{t('cases.priority')}</label>
                <div className="flex gap-1 flex-1">
                  {[
                    { value: 'normal', label: t('cases.priorities.normal'), activeCls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500' },
                    { value: 'urgent', label: t('cases.priorities.urgent'), activeCls: 'bg-amber-100 text-amber-700 ring-1 ring-amber-500' },
                    { value: 'rush', label: t('cases.priorities.rush'), activeCls: 'bg-red-100 text-red-700 ring-1 ring-red-500' },
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPriority(option.value as typeof priority)}
                      className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                        priority === option.value ? option.activeCls : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note lavorazione */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Note lavorazione</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder={t('cases.workNotesPlaceholder')}
                  className="input-modern w-full resize-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Column 3: Files */}
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100 font-display">
              <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <Upload size={16} />
              </span>
              {t('files.uploadFiles')}
              {(selectedFiles.length + uploadedFiles.length) > 0 && (
                <span className="ml-auto text-xs bg-teal-500 text-white px-2 py-0.5 rounded-full font-semibold">
                  {selectedFiles.length + uploadedFiles.length}
                </span>
              )}
            </h2>

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
              className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-teal-500 hover:bg-teal-500/5 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-center gap-2">
                <Upload size={18} className="text-slate-400" />
                <div className="text-left">
                  <p className="text-slate-700 text-xs font-medium">{t('files.dragDrop')}</p>
                  <p className="text-[10px] text-slate-400">JPG, PNG, STL, PLY</p>
                </div>
              </div>
            </div>

            {/* Lista file */}
            <div className="bg-slate-50 rounded-xl p-2 min-h-[100px] max-h-[200px] overflow-y-auto border border-slate-100">
              {(selectedFiles.length + uploadedFiles.length) === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 py-4">
                  <Upload size={20} className="mb-1 opacity-50" />
                  <p className="text-[10px]">Nessun file</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {/* Selected (to upload) */}
                  {selectedFiles.map((file, index) => {
                    const fileType = getFileTypeFromName(file.name);
                    const FileIcon = getFileIcon(fileType);
                    return (
                      <div key={`new-${index}`} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                            <FileIcon size={12} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium text-slate-700 truncate max-w-[110px]">{file.name}</p>
                            <p className="text-[9px] text-slate-400">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveNewFile(index)}
                          className="text-slate-400 hover:text-red-500 p-0.5 flex-shrink-0 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                  {/* Uploaded (edit mode) */}
                  {uploadedFiles.map(file => {
                    const FileIcon = getFileIcon(file.type);
                    const isImage = file.type === 'image';
                    const is3D = file.type === 'stl' || file.type === 'ply';
                    return (
                      <div key={file.id} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            is3D ? 'bg-sky-50 text-sky-600' : isImage ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <FileIcon size={12} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium text-slate-700 truncate max-w-[100px]">{file.name}</p>
                            <p className="text-[9px] text-slate-400">{file.size}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          {isImage && (
                            <button type="button" onClick={() => openImagePreview(file)} className="text-slate-400 hover:text-teal-600 p-0.5 transition-colors" title={t('cases.imagePreview')}>
                              <Eye size={12} />
                            </button>
                          )}
                          {is3D && (
                            <button type="button" onClick={() => open3DPreview(file)} className="text-slate-400 hover:text-sky-600 p-0.5 transition-colors" title={t('viewer3d.viewIn3D')}>
                              <Scan size={12} />
                            </button>
                          )}
                          <button type="button" onClick={() => removeFile(file.id)} className="text-slate-400 hover:text-red-500 p-0.5 transition-colors" title={t('viewer3d.deleteFile')}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-slate-100" />

        {/* Bottom Section: FDI Tooth Schema */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 font-display">
              {t('dental.selectTooth')} *
              <span className="text-[10px] font-normal text-slate-400 hidden sm:inline">
                · <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded-lg text-[9px] font-mono">CTRL</kbd> + click = range
              </span>
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {WORK_TYPES.map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setCurrentWorkType(type)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                    currentWorkType.id === type.id
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${type.color}`} />
                  {t(type.name)}
                  <span className={`text-[9px] ${currentWorkType.id === type.id ? 'text-white/70' : 'text-slate-400'}`}>₪{type.price}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3 sm:p-6 border border-slate-100">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 sm:gap-2 mb-1">
              <div className="grid grid-cols-8 gap-px sm:gap-1">{UPPER_RIGHT.map(num => <ToothButton key={num} number={num} />)}</div>
              <div className="w-px h-full bg-slate-300" />
              <div className="grid grid-cols-8 gap-px sm:gap-1">{UPPER_LEFT.map(num => <ToothButton key={num} number={num} />)}</div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 my-2">
              <div className="flex-1 h-px bg-slate-300" />
              <span className="text-[10px] sm:text-xs text-slate-400 font-semibold uppercase tracking-wider">FDI</span>
              <div className="flex-1 h-px bg-slate-300" />
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 sm:gap-2 mt-1">
              <div className="grid grid-cols-8 gap-px sm:gap-1">{LOWER_RIGHT.map(num => <ToothButton key={num} number={num} />)}</div>
              <div className="w-px h-full bg-slate-300" />
              <div className="grid grid-cols-8 gap-px sm:gap-1">{LOWER_LEFT.map(num => <ToothButton key={num} number={num} />)}</div>
            </div>
          </div>

          {/* Selected teeth — grouped by work type with range */}
          {selectedTeeth.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
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
                    className="flex items-center justify-between gap-2 bg-white rounded-xl border border-slate-100 px-3 py-2 shadow-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${group.workType.color}`} />
                      <span className="text-xs font-medium text-slate-700 truncate">{t(group.workType.name)}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono text-slate-500">{summarizeToothRanges(group.numbers)}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedTeeth(prev => prev.filter(tt => !group.numbers.includes(tt.number)))}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        title={t('common.delete', { defaultValue: 'Rimuovi' })}
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

        {/* Separator */}
        <div className="border-t border-slate-100" />

        {/* Footer: total + buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{t('cases.total', { defaultValue: 'Totale' })}</span>
            <span className="text-xl font-bold text-slate-800 font-display">₪{calculateTotal()}</span>
            {selectedTeeth.length > 0 && (
              <span className="text-[10px] text-slate-400">({selectedTeeth.length} {t('dental.tooth', { count: selectedTeeth.length })})</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/cases"
              className="inline-flex items-center gap-1 px-4 py-2.5 text-slate-600 rounded-2xl font-medium text-xs hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft size={12} />
              Annulla
            </Link>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || loadingClients}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-sky-600 text-white rounded-2xl font-medium text-xs hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Save size={14} />
              {loading ? t('cases.saving') : t('common.save')}
            </button>
          </div>
        </div>

      </div>

      {/* Delete Button - Only in edit mode */}
      {isEditing && (
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="bg-white rounded-2xl p-5 md:p-6 border-2 border-red-100 shadow-soft">
            <h3 className="font-semibold text-slate-800 mb-2 font-display flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              Zona Pericolosa
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              {t('cases.deleteCaseWarning')}
            </p>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
            >
              <Trash2 size={16} />
              Elimina Caso
            </button>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      <ImagePreview
        fileId={previewImage.fileId}
        fileName={previewImage.fileName}
        isOpen={previewImage.isOpen}
        onClose={closeImagePreview}
      />

      {/* 3D Viewer Modal */}
      <Viewer3DModal
        isOpen={preview3D.isOpen}
        onClose={close3DPreview}
        title={preview3D.fileName}
        files={[{
          id: preview3D.fileId,
          url: `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/files/${preview3D.fileId}/preview`,
          name: preview3D.fileName,
        }]}
      />
    </div>
  );
}
