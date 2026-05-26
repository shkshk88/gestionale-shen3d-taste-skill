import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import caseService from '../../../services/case.service';
import clientService from '../../../services/client.service';
import api from '../../../services/api';
import { useToast } from '../../../components/ui/use-toast';
import { ImagePreview } from '../../../components/viewer3d/ImagePreview';
import { Viewer3DModal } from '../../../components/viewer3d/Viewer3DModal';
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
  User,
  Building2,
  Plus,
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
  { id: 'zirconia', name: 'dental.workTypes.coronaZirconia', color: 'bg-blue-500', price: 180 },
  { id: 'emax', name: 'dental.workTypes.coronaEmax', color: 'bg-purple-500', price: 200 },
  { id: 'metal-ceramic', name: 'dental.workTypes.metalCeramic', color: 'bg-orange-500', price: 120 },
  { id: 'implant', name: 'dental.workTypes.impianto', color: 'bg-green-500', price: 250 },
  { id: 'bridge', name: 'dental.workTypes.ponte', color: 'bg-red-500', price: 350 },
  { id: 'veneer', name: 'dental.workTypes.faccetta', color: 'bg-pink-500', price: 220 },
  { id: 'inlay', name: 'dental.workTypes.intarsio', color: 'bg-amber-500', price: 150 },
  { id: 'temporary', name: 'dental.workTypes.provvisorio', color: 'bg-gray-400', price: 50 },
];

// Clients will be loaded from API

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
  const { id } = useParams(); // Get case ID from URL for edit mode
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

        // Pre-select client from query param (from ClientDetail "Nuovo caso" button)
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
              // Map API work type back to our WORK_TYPES
              let workType = WORK_TYPES[0]; // default

              // Try to match by material first
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

              // Then try to match by work type
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

              // Use the best match
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

  const handleToothClick = (toothNumber: number) => {
    const existingIndex = selectedTeeth.findIndex(t => t.number === toothNumber);

    if (existingIndex >= 0) {
      // Remove tooth if already selected
      setSelectedTeeth(prev => prev.filter(t => t.number !== toothNumber));
    } else {
      // Add tooth with current work type
      setSelectedTeeth(prev => [...prev, { number: toothNumber, workType: currentWorkType }]);
    }
  };

  const getToothColor = (toothNumber: number): string => {
    const tooth = selectedTeeth.find(t => t.number === toothNumber);
    if (tooth) {
      return tooth.workType.color;
    }
    return 'bg-neutral-200 hover:bg-neutral-300';
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
    // Reset input to allow selecting same files again
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
    // Validation - only client and due date are required
    if (!selectedClient) {
      toast({
        title: t('common.error'),
        description: t('cases.selectClientLabel'),
        variant: 'destructive',
      });
      return;
    }

    // dueDate is OPTIONAL — admin may save a case without a delivery date

    try {
      setLoading(true);

      // Map work types to API format
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
        // Update existing case
        savedCase = await caseService.updateCase(id, caseData);
        toast({
          title: t('common.success'),
          description: `${savedCase.caseNumber} - ${t('cases.caseUpdated')}`,
        });
      } else {
        // Create new case
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

      // Navigate back: if editing, go to case detail; if creating, go to cases list
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
      className={`aspect-[3/4] w-full min-w-0 rounded-md sm:rounded-lg ${getToothColor(number)} text-[10px] sm:text-xs font-medium transition-all duration-200 flex items-center justify-center ${
        selectedTeeth.find(t => t.number === number) ? 'text-white shadow-md scale-105' : 'text-neutral-600'
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-neutral-500">{t('common.loadingCase')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in pb-8 max-w-6xl mx-auto p-2 sm:p-4">
      {/* Top action row: only for new case mode */}
      {!isEditing && (
        <div className="flex items-center justify-end">
          <Link
            to="/admin/import-vision"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium shadow-sm hover:shadow-md hover:opacity-90 transition"
          >
            <Sparkles size={16} />
            {t('cases.importFromPhoto', 'Importa da foto')}
          </Link>
        </div>
      )}

      {/* UNICO Riquadro Principale (no title, like client NewCase) */}
      <div className="card-base p-4 sm:p-6 space-y-4">

        {/* SEZIONE SUPERIORE: 3 colonne (cliente/paziente · consegna/priorità · file) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Colonna 1: Cliente + Dentista + Paziente + Note */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-neutral-800 flex items-center gap-2 pb-2 border-b border-neutral-200">
              <Building2 size={18} className="text-card-teal" />
              {t('cases.clientAndPatient')}
            </h2>
            <div className="space-y-3">
              {/* Cliente */}
              <div className="relative">
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">{t('cases.client')} *</label>
                <button
                  type="button"
                  onClick={() => setShowClientDropdown(!showClientDropdown)}
                  className="input-modern w-full text-left flex items-center justify-between text-sm"
                >
                  <span className={selectedClient ? 'text-neutral-800' : 'text-neutral-400'}>
                    {selectedClient
                      ? clients.find(c => c.id === selectedClient)?.studioName
                      : loadingClients ? t('common.loading') : t('cases.selectClient')}
                  </span>
                  <ChevronDown size={16} className="text-neutral-400" />
                </button>
                {showClientDropdown && (
                  <div className="absolute z-20 w-full mt-1 bg-white rounded-xl shadow-card border border-neutral-100 py-2 max-h-60 overflow-y-auto">
                    {loadingClients ? (
                      <div className="px-3 py-2 text-neutral-500 text-center text-sm">{t('common.loading')}</div>
                    ) : clients.length === 0 ? (
                      <div className="px-3 py-2 text-neutral-500 text-center text-sm">{t('cases.noClientsFound')}</div>
                    ) : (
                      clients.map(client => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => { setSelectedClient(client.id); setShowClientDropdown(false); }}
                          className="w-full px-3 py-2 text-left hover:bg-surface-secondary transition-colors"
                        >
                          <p className="text-sm font-medium text-neutral-800">{client.studioName}</p>
                          <p className="text-xs text-neutral-500">{client.contactPerson}</p>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Dentista */}
              <div className="relative">
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">{t('cases.operatingDentist')}</label>
                <button
                  type="button"
                  onClick={() => selectedClient && setShowDentistDropdown(!showDentistDropdown)}
                  disabled={!selectedClient}
                  className="input-modern w-full text-left flex items-center justify-between text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className={selectedDentist ? 'text-neutral-800' : 'text-neutral-400'}>
                    {!selectedClient ? t('cases.selectClientFirst')
                      : selectedDentist ? dentists.find(d => d.id === selectedDentist)?.name
                      : loadingDentists ? t('common.loading')
                      : dentists.length === 0 ? t('cases.noDentistAvailable') : t('cases.selectDentist')}
                  </span>
                  <ChevronDown size={16} className="text-neutral-400" />
                </button>
                {showDentistDropdown && dentists.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white rounded-xl shadow-card border border-neutral-100 py-2 max-h-60 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => { setSelectedDentist(''); setShowDentistDropdown(false); }}
                      className="w-full px-3 py-2 text-left hover:bg-surface-secondary text-neutral-400 text-sm"
                    >
                      {t('cases.noDentist')}
                    </button>
                    {dentists.map(dentist => (
                      <button
                        key={dentist.id}
                        type="button"
                        onClick={() => { setSelectedDentist(dentist.id); setShowDentistDropdown(false); }}
                        className="w-full px-3 py-2 text-left hover:bg-surface-secondary transition-colors"
                      >
                        <p className="text-sm font-medium text-neutral-800">{dentist.name}</p>
                        {dentist.specialization && <p className="text-xs text-neutral-500">{dentist.specialization}</p>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Paziente */}
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">{t('newCase.patientName')}</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder={t('cases.patientNameOptional')}
                  className="input-modern w-full text-sm"
                />
              </div>

              {/* Avvisi paziente (compatto) */}
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5 flex items-center gap-1">
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

          {/* Colonna 2: Date + Priorità + Note lavorazione */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-neutral-800 flex items-center gap-2 pb-2 border-b border-neutral-200">
              <Calendar size={18} className="text-card-teal" />
              {t('newCase.deliveryAndPriority')}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">{t('cases.receivedDate')}</label>
                <input
                  type="date"
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  className="input-modern w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">{t('cases.dueDate')}</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="input-modern w-full text-sm"
                />
              </div>

              {/* Priorità inline compatta */}
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-medium text-neutral-500 shrink-0">{t('cases.priority')}</label>
                <div className="flex gap-1 flex-1">
                  {[
                    { value: 'normal', label: t('cases.priorities.normal'), activeCls: 'bg-green-100 text-green-700 ring-1 ring-green-500' },
                    { value: 'urgent', label: t('cases.priorities.urgent'), activeCls: 'bg-amber-100 text-amber-700 ring-1 ring-amber-500' },
                    { value: 'rush', label: t('cases.priorities.rush'), activeCls: 'bg-red-100 text-red-700 ring-1 ring-red-500' },
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPriority(option.value as typeof priority)}
                      className={`flex-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                        priority === option.value ? option.activeCls : 'bg-surface-secondary text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note lavorazione */}
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">Note lavorazione</label>
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

          {/* Colonna 3: File */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-neutral-800 flex items-center gap-2 pb-2 border-b border-neutral-200">
              <Upload size={18} className="text-card-teal" />
              {t('files.uploadFiles')}
              {(selectedFiles.length + uploadedFiles.length) > 0 && (
                <span className="ml-auto text-xs bg-card-teal text-white px-2 py-0.5 rounded-full">
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
              className="border-2 border-dashed border-neutral-300 rounded-xl p-3 text-center hover:border-card-teal hover:bg-card-teal/5 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-center gap-2">
                <Upload size={16} className="text-neutral-400" />
                <div className="text-left">
                  <p className="text-neutral-700 text-xs font-medium">{t('files.dragDrop')}</p>
                  <p className="text-[10px] text-neutral-400">JPG, PNG, STL, PLY</p>
                </div>
              </div>
            </div>

            {/* Lista file (selected + uploaded) in scroll compatto */}
            <div className="bg-surface-secondary rounded-xl p-2 min-h-[100px] max-h-[200px] overflow-y-auto">
              {(selectedFiles.length + uploadedFiles.length) === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-neutral-400 py-4">
                  <Upload size={18} className="mb-1 opacity-50" />
                  <p className="text-[10px]">Nessun file</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {/* Selected (to upload) */}
                  {selectedFiles.map((file, index) => {
                    const fileType = getFileTypeFromName(file.name);
                    const FileIcon = getFileIcon(fileType);
                    return (
                      <div key={`new-${index}`} className="flex items-center justify-between p-1.5 bg-white rounded-lg shadow-sm">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-6 h-6 rounded bg-surface-secondary flex items-center justify-center flex-shrink-0">
                            <FileIcon size={12} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium text-neutral-700 truncate max-w-[110px]">{file.name}</p>
                            <p className="text-[9px] text-neutral-400">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveNewFile(index)}
                          className="text-neutral-400 hover:text-red-500 p-0.5 flex-shrink-0"
                        >
                          <X size={11} />
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
                      <div key={file.id} className="flex items-center justify-between p-1.5 bg-white rounded-lg shadow-sm">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                            is3D ? 'bg-blue-100 text-blue-600' : isImage ? 'bg-green-100 text-green-600' : 'bg-neutral-100 text-neutral-600'
                          }`}>
                            <FileIcon size={12} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium text-neutral-700 truncate max-w-[100px]">{file.name}</p>
                            <p className="text-[9px] text-neutral-400">{file.size}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          {isImage && (
                            <button type="button" onClick={() => openImagePreview(file)} className="text-neutral-400 hover:text-green-600 p-0.5" title={t('cases.imagePreview')}>
                              <Eye size={11} />
                            </button>
                          )}
                          {is3D && (
                            <button type="button" onClick={() => open3DPreview(file)} className="text-neutral-400 hover:text-blue-600 p-0.5" title={t('viewer3d.viewIn3D')}>
                              <Scan size={11} />
                            </button>
                          )}
                          <button type="button" onClick={() => removeFile(file.id)} className="text-neutral-400 hover:text-red-500 p-0.5" title={t('viewer3d.deleteFile')}>
                            <Trash2 size={11} />
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

        {/* Separatore */}
        <div className="border-t border-neutral-200" />

        {/* SEZIONE INFERIORE: Schema Denti FDI */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-neutral-800 flex items-center gap-2">
              {t('dental.selectTooth')} *
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {WORK_TYPES.map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setCurrentWorkType(type)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                    currentWorkType.id === type.id
                      ? 'bg-card-teal text-white'
                      : 'bg-surface-secondary text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${type.color}`} />
                  {t(type.name)}
                  <span className={`text-[9px] ${currentWorkType.id === type.id ? 'text-white/80' : 'text-neutral-400'}`}>₪{type.price}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-surface-secondary rounded-2xl p-2 sm:p-6">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 sm:gap-2 mb-1">
              <div className="grid grid-cols-8 gap-px sm:gap-1">{UPPER_RIGHT.map(num => <ToothButton key={num} number={num} />)}</div>
              <div className="w-px h-full bg-neutral-300" />
              <div className="grid grid-cols-8 gap-px sm:gap-1">{UPPER_LEFT.map(num => <ToothButton key={num} number={num} />)}</div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 my-2">
              <div className="flex-1 h-0.5 bg-neutral-300" />
              <span className="text-[10px] sm:text-xs text-neutral-400 font-medium">FDI</span>
              <div className="flex-1 h-0.5 bg-neutral-300" />
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 sm:gap-2 mt-1">
              <div className="grid grid-cols-8 gap-px sm:gap-1">{LOWER_RIGHT.map(num => <ToothButton key={num} number={num} />)}</div>
              <div className="w-px h-full bg-neutral-300" />
              <div className="grid grid-cols-8 gap-px sm:gap-1">{LOWER_LEFT.map(num => <ToothButton key={num} number={num} />)}</div>
            </div>
          </div>

          {/* Denti selezionati chips */}
          {selectedTeeth.length > 0 && (
            <div className="bg-neutral-50 rounded-xl p-3">
              <p className="text-xs font-medium text-neutral-600 mb-2">Denti selezionati:</p>
              <div className="flex flex-wrap gap-2">
                {selectedTeeth.map(tooth => (
                  <div key={tooth.number} className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg shadow-sm border border-neutral-200">
                    <div className={`w-2 h-2 rounded-full ${tooth.workType.color}`} />
                    <span className="text-xs font-medium">#{tooth.number}</span>
                    <span className="text-[10px] text-neutral-400">{t(tooth.workType.name)}</span>
                    <button
                      type="button"
                      onClick={() => handleToothClick(tooth.number)}
                      className="text-neutral-400 hover:text-red-500 ml-1"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Separatore */}
        <div className="border-t border-neutral-200" />

        {/* Footer compatto: totale + bottoni */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-500">{t('cases.total', { defaultValue: 'Totale' })}</span>
            <span className="text-lg font-bold text-neutral-800">₪{calculateTotal()}</span>
            {selectedTeeth.length > 0 && (
              <span className="text-[10px] text-neutral-400">({selectedTeeth.length} {t('dental.tooth', { count: selectedTeeth.length })})</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/cases"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 transition-all"
            >
              <ArrowLeft size={12} />
              Annulla
            </Link>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || loadingClients}
              className="flex items-center gap-1 px-4 py-1.5 bg-card-teal text-white rounded-lg text-xs font-semibold hover:bg-card-teal/90 transition-all shadow-soft disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={12} />
              {loading ? t('cases.saving') : t('common.save')}
            </button>
          </div>
        </div>

      </div>

      {/* Delete Button - Only in edit mode */}
      {isEditing && (
        <div className="mt-8 pt-8 border-t border-neutral-200">
          <div className="card-base p-4 md:p-6 border-2 border-red-200">
            <h3 className="font-semibold text-neutral-800 mb-2">Zona Pericolosa</h3>
            <p className="text-sm text-neutral-600 mb-4">
              {t('cases.deleteCaseWarning')}
            </p>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={18} />
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
        fileId={preview3D.fileId}
        fileName={preview3D.fileName}
        fileType={preview3D.fileType}
        isOpen={preview3D.isOpen}
        onClose={close3DPreview}
      />
    </div>
  );
}
