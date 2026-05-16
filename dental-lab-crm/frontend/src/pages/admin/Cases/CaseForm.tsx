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
  Scan
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
  { id: 'zirconia', name: 'Corona Zirconia', color: 'bg-blue-500', price: 180 },
  { id: 'emax', name: 'Corona E.max', color: 'bg-purple-500', price: 200 },
  { id: 'metal-ceramic', name: 'Metallo Ceramica', color: 'bg-orange-500', price: 120 },
  { id: 'implant', name: 'Impianto', color: 'bg-green-500', price: 250 },
  { id: 'bridge', name: 'Ponte', color: 'bg-red-500', price: 350 },
  { id: 'veneer', name: 'Faccetta', color: 'bg-pink-500', price: 220 },
  { id: 'inlay', name: 'Intarsio', color: 'bg-amber-500', price: 150 },
  { id: 'temporary', name: 'Provvisorio', color: 'bg-gray-400', price: 50 },
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
          title: 'Errore',
          description: 'Impossibile caricare i clienti',
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
        const response = await fetch(`http://localhost:3000/api/dentists/client/${selectedClient}`);
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
            title: 'Caso caricato',
            description: 'Dati del caso caricati con successo',
          });
        } catch (error: any) {
          console.error('Error loading case:', error);
          toast({
            title: 'Errore',
            description: error.message || 'Impossibile caricare il caso',
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
        title: 'Errore',
        description: 'Seleziona un cliente',
        variant: 'destructive',
      });
      return;
    }

    if (!dueDate) {
      toast({
        title: 'Errore',
        description: 'Inserisci la data di consegna',
        variant: 'destructive',
      });
      return;
    }

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
        dueDate: new Date(dueDate).toISOString(),
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
          title: 'Successo',
          description: `Caso ${savedCase.caseNumber} aggiornato con successo`,
        });
      } else {
        // Create new case
        savedCase = await caseService.createCase(caseData);
        toast({
          title: 'Successo',
          description: `Caso ${savedCase.caseNumber} creato con successo`,
        });
      }

      // Upload selected files if any
      if (selectedFiles.length > 0) {
        try {
          console.log(`Uploading ${selectedFiles.length} files...`);
          await api.uploadFiles(`/files/upload-multiple/${savedCase.id}`, selectedFiles);
          toast({
            title: 'File caricati',
            description: `${selectedFiles.length} file caricati con successo`,
          });
        } catch (uploadError: any) {
          console.error('Error uploading files:', uploadError);
          toast({
            title: 'Avviso',
            description: 'Caso salvato ma errore durante il caricamento dei file',
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
        title: 'Errore',
        description: error.response?.data?.message || `Impossibile ${isEditing ? 'aggiornare' : 'creare'} il caso`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Sei sicuro di voler eliminare questo caso? Questa azione non può essere annullata.')) {
      return;
    }

    try {
      setLoading(true);
      await caseService.deleteCase(id!);
      toast({
        title: 'Successo',
        description: 'Caso eliminato con successo',
      });
      navigate('/admin/cases');
    } catch (error: any) {
      console.error('Error deleting case:', error);
      toast({
        title: 'Errore',
        description: error.response?.data?.message || 'Impossibile eliminare il caso',
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
      className={`w-9 h-12 rounded-lg ${getToothColor(number)} text-xs font-medium transition-all duration-200 flex items-center justify-center ${
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
          <p className="text-neutral-500">Caricamento caso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/cases"
            className="w-10 h-10 rounded-xl bg-white shadow-soft flex items-center justify-center text-neutral-500 hover:text-neutral-800 hover:shadow-card transition-all"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-neutral-800">
              {isEditing ? 'Modifica Caso' : t('cases.newCase')}
            </h1>
            <p className="text-sm text-neutral-500">
              {isEditing ? 'Modifica i dati del caso esistente' : 'Compila i dati per creare un nuovo caso'}
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={loading || loadingClients}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={18} />
          {loading ? 'Salvataggio...' : t('common.save')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client & Patient */}
          <div className="card-base p-6">
            <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
              <Building2 size={20} className="text-brand-primary" />
              Cliente e Paziente
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Client Dropdown */}
              <div className="relative">
                <label className="block text-sm font-medium text-neutral-600 mb-2">
                  {t('cases.client')} *
                </label>
                <button
                  type="button"
                  onClick={() => setShowClientDropdown(!showClientDropdown)}
                  className="input-modern w-full text-left flex items-center justify-between"
                >
                  <span className={selectedClient ? 'text-neutral-800' : 'text-neutral-400'}>
                    {selectedClient
                      ? clients.find(c => c.id === selectedClient)?.studioName
                      : loadingClients
                        ? 'Caricamento...'
                        : 'Seleziona cliente...'}
                  </span>
                  <ChevronDown size={18} className="text-neutral-400" />
                </button>
                {showClientDropdown && (
                  <div className="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-card border border-neutral-100 py-2 max-h-60 overflow-y-auto">
                    {loadingClients ? (
                      <div className="px-4 py-3 text-neutral-500 text-center">Caricamento...</div>
                    ) : clients.length === 0 ? (
                      <div className="px-4 py-3 text-neutral-500 text-center">Nessun cliente trovato</div>
                    ) : (
                      clients.map(client => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => {
                            setSelectedClient(client.id);
                            setShowClientDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-surface-secondary transition-colors"
                        >
                          <p className="font-medium text-neutral-800">{client.studioName}</p>
                          <p className="text-sm text-neutral-500">{client.contactPerson}</p>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Dentist Dropdown */}
              <div className="relative">
                <label className="block text-sm font-medium text-neutral-600 mb-2">
                  Dentista Operante
                </label>
                <button
                  type="button"
                  onClick={() => selectedClient && setShowDentistDropdown(!showDentistDropdown)}
                  disabled={!selectedClient}
                  className="input-modern w-full text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className={selectedDentist ? 'text-neutral-800' : 'text-neutral-400'}>
                    {!selectedClient
                      ? 'Seleziona prima un cliente'
                      : selectedDentist
                      ? dentists.find(d => d.id === selectedDentist)?.name
                      : loadingDentists
                        ? 'Caricamento...'
                        : dentists.length === 0
                          ? 'Nessun dentista disponibile'
                          : 'Seleziona dentista (opzionale)...'}
                  </span>
                  <ChevronDown size={18} className="text-neutral-400" />
                </button>
                {showDentistDropdown && dentists.length > 0 && (
                  <div className="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-card border border-neutral-100 py-2 max-h-60 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDentist('');
                        setShowDentistDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-surface-secondary transition-colors text-neutral-400"
                    >
                      Nessun dentista
                    </button>
                    {dentists.map(dentist => (
                      <button
                        key={dentist.id}
                        type="button"
                        onClick={() => {
                          setSelectedDentist(dentist.id);
                          setShowDentistDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-surface-secondary transition-colors"
                      >
                        <p className="font-medium text-neutral-800">{dentist.name}</p>
                        {dentist.specialization && (
                          <p className="text-sm text-neutral-500">{dentist.specialization}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Patient Name */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-neutral-600 mb-2">
                  <User size={14} className="inline mr-1" />
                  {t('newCase.patientName')}
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Nome paziente (opzionale)"
                  className="input-modern w-full"
                />
              </div>

              {/* Dates */}
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-2">
                  <Calendar size={14} className="inline mr-1" />
                  {t('cases.receivedDate')}
                </label>
                <input
                  type="date"
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  className="input-modern w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-2">
                  <Calendar size={14} className="inline mr-1" />
                  {t('cases.dueDate')} *
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="input-modern w-full"
                />
              </div>
            </div>
          </div>

          {/* Dental Schema */}
          <div className="card-base p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-800">
                {t('dental.selectTooth')}
              </h2>

              {/* Work Type Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowWorkTypeDropdown(!showWorkTypeDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-surface-secondary rounded-xl hover:bg-neutral-200 transition-colors"
                >
                  <div className={`w-3 h-3 rounded-full ${currentWorkType.color}`} />
                  <span className="text-sm font-medium text-neutral-700">{currentWorkType.name}</span>
                  <ChevronDown size={16} className="text-neutral-400" />
                </button>
                {showWorkTypeDropdown && (
                  <div className="absolute z-20 right-0 mt-2 w-56 bg-white rounded-xl shadow-card border border-neutral-100 py-2">
                    {WORK_TYPES.map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => {
                          setCurrentWorkType(type);
                          setShowWorkTypeDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-surface-secondary transition-colors flex items-center gap-3"
                      >
                        <div className={`w-3 h-3 rounded-full ${type.color}`} />
                        <span className="text-sm text-neutral-700">{type.name}</span>
                        <span className="text-xs text-neutral-400 ml-auto">€{type.price}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Interactive FDI Schema */}
            <div className="bg-surface-secondary rounded-2xl p-6">
              {/* Upper Teeth */}
              <div className="flex justify-center gap-1 mb-2">
                {/* Upper Right (18-11) */}
                <div className="flex gap-1 pr-4 border-r-2 border-neutral-300">
                  {UPPER_RIGHT.map(num => <ToothButton key={num} number={num} />)}
                </div>
                {/* Upper Left (21-28) */}
                <div className="flex gap-1 pl-4">
                  {UPPER_LEFT.map(num => <ToothButton key={num} number={num} />)}
                </div>
              </div>

              {/* Divider Line */}
              <div className="flex items-center gap-4 my-3">
                <div className="flex-1 h-0.5 bg-neutral-300" />
                <span className="text-xs text-neutral-400 font-medium">FDI</span>
                <div className="flex-1 h-0.5 bg-neutral-300" />
              </div>

              {/* Lower Teeth */}
              <div className="flex justify-center gap-1 mt-2">
                {/* Lower Right (48-41) */}
                <div className="flex gap-1 pr-4 border-r-2 border-neutral-300">
                  {LOWER_RIGHT.map(num => <ToothButton key={num} number={num} />)}
                </div>
                {/* Lower Left (31-38) */}
                <div className="flex gap-1 pl-4">
                  {LOWER_LEFT.map(num => <ToothButton key={num} number={num} />)}
                </div>
              </div>
            </div>

            {/* Selected Teeth Summary */}
            {selectedTeeth.length > 0 && (
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <p className="text-sm text-neutral-500 mb-3">Denti selezionati:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTeeth.map(tooth => (
                    <div
                      key={tooth.number}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-soft"
                    >
                      <div className={`w-2.5 h-2.5 rounded-full ${tooth.workType.color}`} />
                      <span className="text-sm font-medium text-neutral-700">#{tooth.number}</span>
                      <span className="text-xs text-neutral-400">{tooth.workType.name}</span>
                      <button
                        type="button"
                        onClick={() => handleToothClick(tooth.number)}
                        className="ml-1 text-neutral-400 hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-neutral-100">
              <p className="text-xs text-neutral-400 mb-2">Legenda lavorazioni:</p>
              <div className="flex flex-wrap gap-3">
                {WORK_TYPES.map(type => (
                  <div key={type.id} className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${type.color}`} />
                    <span className="text-xs text-neutral-500">{type.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="card-base p-6">
            <h2 className="text-lg font-semibold text-neutral-800 mb-4">Note</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-2">
                  Note lavorazione
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Inserisci note sulla lavorazione..."
                  className="input-modern w-full resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-2 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-500" />
                  Avvisi paziente
                </label>
                <textarea
                  value={patientWarnings}
                  onChange={(e) => setPatientWarnings(e.target.value)}
                  rows={2}
                  placeholder="Allergie, condizioni particolari..."
                  className="input-modern w-full resize-none"
                />
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="card-base p-6">
            <h2 className="text-lg font-semibold text-neutral-800 mb-4">{t('files.uploadFiles')}</h2>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.heic,.webp,.stl,.ply"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-200 rounded-2xl p-8 text-center hover:border-brand-primary hover:bg-brand-primary/5 transition-colors cursor-pointer"
            >
              <div className="w-14 h-14 bg-surface-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Upload size={24} className="text-neutral-400" />
              </div>
              <p className="text-neutral-600 mb-1">{t('files.dragDrop')}</p>
              <p className="text-sm text-neutral-400">{t('files.supportedFormats')}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-medium hover:bg-brand-primary/90 transition-colors"
              >
                <Plus size={16} className="inline mr-1" />
                Seleziona file
              </button>
            </div>

            {/* Selected Files List (not yet uploaded) */}
            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-neutral-500 mb-2">File da caricare:</p>
                {selectedFiles.map((file, index) => {
                  const fileType = getFileTypeFromName(file.name);
                  const FileIcon = getFileIcon(fileType);
                  const isImage = fileType === 'image';
                  const is3D = fileType === 'stl' || fileType === 'ply';

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-surface-secondary rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          is3D ? 'bg-blue-100 text-blue-600' :
                          isImage ? 'bg-green-100 text-green-600' :
                          'bg-neutral-100 text-neutral-600'
                        }`}>
                          <FileIcon size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-700">{file.name}</p>
                          <p className="text-xs text-neutral-400">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {/* Preview button for images - creates local preview */}
                        {isImage && (
                          <button
                            type="button"
                            onClick={() => {
                              const url = URL.createObjectURL(file);
                              window.open(url, '_blank');
                            }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-brand-primary hover:bg-brand-primary/10 transition-all"
                            title="Anteprima immagine"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveNewFile(index)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          title={t('viewer3d.removeFile')}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Already Uploaded Files List (edit mode) */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-neutral-500 mb-2">File già caricati:</p>
                {uploadedFiles.map(file => {
                  const FileIcon = getFileIcon(file.type);
                  const isImage = file.type === 'image';
                  const is3D = file.type === 'stl' || file.type === 'ply';

                  return (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-surface-secondary rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          is3D ? 'bg-blue-100 text-blue-600' :
                          isImage ? 'bg-green-100 text-green-600' :
                          'bg-neutral-100 text-neutral-600'
                        }`}>
                          <FileIcon size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-700">{file.name}</p>
                          <p className="text-xs text-neutral-400">{file.size}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {/* Preview button for images */}
                        {isImage && (
                          <button
                            type="button"
                            onClick={() => openImagePreview(file)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-green-600 hover:bg-green-50 transition-all"
                            title="Anteprima immagine"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        {/* Preview button for 3D files */}
                        {is3D && (
                          <button
                            type="button"
                            onClick={() => open3DPreview(file)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            title={t('viewer3d.viewIn3D')}
                          >
                            <Scan size={16} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          title={t('viewer3d.deleteFile')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Priority */}
          <div className="card-base p-6">
            <h2 className="text-lg font-semibold text-neutral-800 mb-4">{t('cases.priority')}</h2>
            <div className="space-y-2">
              {[
                { value: 'normal', label: t('cases.priorities.normal'), color: 'bg-priority-normal' },
                { value: 'urgent', label: t('cases.priorities.urgent'), color: 'bg-priority-urgent' },
                { value: 'rush', label: t('cases.priorities.rush'), color: 'bg-priority-rush' },
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPriority(option.value as typeof priority)}
                  className={`w-full px-4 py-3 rounded-xl text-left flex items-center gap-3 transition-all ${
                    priority === option.value
                      ? 'bg-surface-secondary ring-2 ring-brand-primary'
                      : 'bg-surface-secondary/50 hover:bg-surface-secondary'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${option.color}`} />
                  <span className="text-sm font-medium text-neutral-700">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Summary */}
          <div className="card-yellow p-6">
            <h2 className="text-lg font-semibold mb-4">Riepilogo Prezzo</h2>

            {selectedTeeth.length > 0 ? (
              <>
                <div className="space-y-2 mb-4">
                  {selectedTeeth.map(tooth => (
                    <div key={tooth.number} className="flex items-center justify-between text-sm">
                      <span className="text-neutral-700">
                        #{tooth.number} - {tooth.workType.name}
                      </span>
                      <span className="font-medium">€{tooth.workType.price}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-neutral-800/10 flex items-center justify-between">
                  <span className="font-semibold">Totale</span>
                  <span className="text-2xl font-bold">€{calculateTotal()}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-neutral-600">
                Seleziona i denti per calcolare il prezzo
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card-base p-6">
            <h2 className="text-lg font-semibold text-neutral-800 mb-4">Azioni rapide</h2>
            <div className="space-y-2">
              <button
                type="button"
                className="w-full px-4 py-3 bg-surface-secondary rounded-xl text-left text-sm font-medium text-neutral-700 hover:bg-neutral-200 transition-colors"
              >
                Duplica caso precedente
              </button>
              <button
                type="button"
                className="w-full px-4 py-3 bg-surface-secondary rounded-xl text-left text-sm font-medium text-neutral-700 hover:bg-neutral-200 transition-colors"
              >
                Usa template lavorazione
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Button - Only in edit mode */}
      {isEditing && (
        <div className="mt-8 pt-8 border-t border-neutral-200">
          <div className="card-base p-6 border-2 border-red-200">
            <h3 className="font-semibold text-neutral-800 mb-2">Zona Pericolosa</h3>
            <p className="text-sm text-neutral-600 mb-4">
              L&apos;eliminazione del caso è permanente e non può essere annullata. Tutti i file associati verranno eliminati.
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
