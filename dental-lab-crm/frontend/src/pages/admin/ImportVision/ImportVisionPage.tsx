import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Sparkles,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Camera,
  Save,
  ArrowLeft,
} from 'lucide-react';
import visionService, { VisionResult } from '@/services/vision.service';
import caseService from '@/services/case.service';
import clientService, { Client } from '@/services/client.service';
import { useToast } from '@/components/ui/use-toast';

interface SelectedImage {
  file: File;
  previewUrl: string;
  id: string;
}

const ACCEPT = '.jpg,.jpeg,.png,.webp,.heic,image/*';
const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024;

export default function ImportVisionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<SelectedImage[]>([]);
  const [analysing, setAnalysing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<VisionResult | null>(null);
  const [meta, setMeta] = useState<{ provider: string; model: string; latencyMs: number } | null>(null);

  // Editable fields (pre-filled by AI, operator confirms)
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [patientName, setPatientName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent' | 'rush'>('normal');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    clientService.getClients()
      .then((data) => setClients(data))
      .catch((err) => console.error('Error loading clients:', err));
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
    e.target.value = ''; // allow re-selecting same file
  };

  const addFiles = (files: File[]) => {
    const room = MAX_FILES - images.length;
    const accepted = files.slice(0, room).filter((f) => {
      if (f.size > MAX_SIZE) {
        toast({ title: t('common.error'), description: `${f.name}: max 10MB`, variant: 'destructive' });
        return false;
      }
      if (!f.type.startsWith('image/')) {
        toast({ title: t('common.error'), description: `${f.name}: not an image`, variant: 'destructive' });
        return false;
      }
      return true;
    });

    const newImages = accepted.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      id: `${Date.now()}-${Math.random()}`,
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const img = prev.find((x) => x.id === id);
      if (img) URL.revokeObjectURL(img.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
  };

  const handleAnalyse = async () => {
    if (images.length === 0) return;
    setAnalysing(true);
    setProgress(0);
    try {
      const output = await visionService.analyseImages(
        images.map((i) => i.file),
        (p) => setProgress(p),
      );
      setResult(output.result);
      setMeta({ provider: output.meta.provider, model: output.meta.model, latencyMs: output.meta.latencyMs });

      // Pre-fill editable fields
      setPatientName(output.result.patientName || '');
      setDueDate(output.result.dueDate || '');
      setPriority(output.result.priority);

      toast({
        title: t('visionImport.analysisDone', { defaultValue: 'Analisi completata' }),
        description: t('visionImport.analysisDoneDesc', {
          defaultValue: 'Confidence: {{percent}}%',
          percent: Math.round(output.result.confidence * 100),
        }),
      });
    } catch (err: any) {
      console.error('Vision analysis error:', err);
      toast({
        title: t('common.error'),
        description: err?.response?.data?.message || err?.message || 'Errore analisi AI',
        variant: 'destructive',
      });
    } finally {
      setAnalysing(false);
      setProgress(0);
    }
  };

  const handleCreateCase = async () => {
    if (!result) return;
    if (!selectedClientId) {
      toast({
        title: t('common.error'),
        description: t('visionImport.selectClientFirst', { defaultValue: 'Seleziona un cliente' }),
        variant: 'destructive',
      });
      return;
    }
    setCreating(true);
    try {
      const newCase = await caseService.createCase({
        clientId: selectedClientId,
        patientName: patientName.trim() || undefined,
        patientNotes: result.notes || undefined,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        teeth: result.teeth.map((t) => ({
          toothNumber: t.toothNumber,
          workType: t.workType,
          material: t.material,
          vitaColor: t.vitaColor || undefined,
          unitPrice: 0,
        })),
      });
      toast({
        title: t('common.success'),
        description: t('visionImport.caseCreated', {
          defaultValue: 'Caso {{n}} creato',
          n: newCase.caseNumber,
        }),
      });
      navigate(`/admin/cases/${newCase.id}`);
    } catch (err: any) {
      console.error('Error creating case from vision:', err);
      toast({
        title: t('common.error'),
        description: err?.response?.data?.message || err?.message || 'Errore creazione caso',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const confidencePct = result ? Math.round(result.confidence * 100) : 0;
  const lowConfidence = result && result.confidence < 0.7;

  return (
    <div className="space-y-3 animate-fade-in pb-8 max-w-6xl mx-auto p-2 sm:p-4">
      <div className="card-base p-4 sm:p-6 space-y-4">

        {/* Step 1: Upload */}
        {!result && (
          <>
            <div className="flex items-center gap-2 pb-2 border-b border-neutral-200">
              <Sparkles size={18} className="text-card-teal" />
              <h2 className="text-base font-semibold text-neutral-800">
                {t('visionImport.title', { defaultValue: 'Importa caso da foto' })}
              </h2>
              <span className="ml-auto text-xs text-neutral-400">
                {t('visionImport.subtitle', { defaultValue: 'Carica prescrizioni / ricette del dentista' })}
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPT}
              onChange={handleFileSelect}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-300 rounded-2xl p-6 text-center hover:border-card-teal hover:bg-card-teal/5 transition-colors cursor-pointer"
            >
              <div className="w-12 h-12 bg-surface-secondary rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Upload size={20} className="text-neutral-400" />
              </div>
              <p className="text-sm text-neutral-700 font-medium">
                {t('visionImport.dropZone', { defaultValue: 'Trascina fino a 5 foto di prescrizioni mediche' })}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                {t('visionImport.dropZoneHint', { defaultValue: 'Solo prescrizioni scritte. Non caricare RX panoramiche o foto intraorali.' })}
              </p>
              <p className="text-[10px] text-neutral-400 mt-0.5">JPG, PNG, WEBP, HEIC · max 10MB</p>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {images.map((img) => (
                  <div key={img.id} className="relative rounded-xl overflow-hidden bg-neutral-100 aspect-square group">
                    <img src={img.previewUrl} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-neutral-200">
              <p className="text-[10px] text-neutral-400 flex-1">
                <Camera size={11} className="inline mr-1" />
                {t('visionImport.tip', { defaultValue: 'Tip: prescrizione ben fotografata, testo leggibile = miglior estrazione' })}
              </p>
              <button
                onClick={handleAnalyse}
                disabled={images.length === 0 || analysing}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-card-teal text-white rounded-lg text-sm font-semibold hover:bg-card-teal/90 transition-all shadow-soft disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analysing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    {progress > 0 && progress < 100 ? `Upload ${progress}%` : t('visionImport.analysing', { defaultValue: 'Analisi in corso…' })}
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    {t('visionImport.analyse', { defaultValue: 'Analizza con AI' })}
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* Step 2: Review + Create */}
        {result && (
          <>
            <div className="flex items-center gap-2 pb-2 border-b border-neutral-200">
              <button
                onClick={() => setResult(null)}
                className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center hover:bg-neutral-200 transition"
                title={t('common.back', { defaultValue: 'Indietro' })}
              >
                <ArrowLeft size={14} />
              </button>
              <CheckCircle2 size={18} className="text-emerald-500" />
              <h2 className="text-base font-semibold text-neutral-800">
                {t('visionImport.reviewTitle', { defaultValue: 'Verifica e crea caso' })}
              </h2>
              <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded ${
                lowConfidence ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                AI {confidencePct}%
              </span>
            </div>

            {lowConfidence && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800">
                  {t('visionImport.lowConfidenceWarning', {
                    defaultValue: 'Confidence bassa: verifica manualmente ogni campo prima di salvare.',
                  })}
                </p>
              </div>
            )}

            {meta && (
              <p className="text-[10px] text-neutral-400">
                {meta.provider} · {meta.model} · {meta.latencyMs}ms
              </p>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Colonna sinistra: campi paziente/data */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                    {t('cases.client')} *
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="input-modern w-full text-sm"
                  >
                    <option value="">{t('cases.selectClient', { defaultValue: 'Seleziona…' })}</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.studioName}</option>
                    ))}
                  </select>
                  {result.studioName && (
                    <p className="text-[10px] text-neutral-400 mt-1">
                      AI ha letto: <span className="italic">{result.studioName}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                    {t('newCase.patientName')}
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="N/A"
                    className="input-modern w-full text-sm"
                  />
                </div>

                {result.dentistName && (
                  <div className="p-2 bg-neutral-50 rounded-lg">
                    <p className="text-[10px] text-neutral-500">Dentista letto da AI</p>
                    <p className="text-sm font-medium text-neutral-700">{result.dentistName}</p>
                    <p className="text-[10px] text-neutral-400 italic">Assegnalo manualmente nel caso se serve</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                      {t('cases.dueDate')}
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="input-modern w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                      {t('cases.priority')}
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="input-modern w-full text-sm"
                    >
                      <option value="normal">{t('cases.priorities.normal')}</option>
                      <option value="urgent">{t('cases.priorities.urgent')}</option>
                      <option value="rush">{t('cases.priorities.rush')}</option>
                    </select>
                  </div>
                </div>

                {result.notes && (
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                      Note AI
                    </label>
                    <p className="text-xs text-neutral-700 p-2 bg-neutral-50 rounded-lg italic">{result.notes}</p>
                  </div>
                )}
              </div>

              {/* Colonna destra: denti */}
              <div className="space-y-3">
                <label className="block text-xs font-medium text-neutral-600">
                  Denti rilevati ({result.teeth.length})
                </label>
                {result.teeth.length === 0 ? (
                  <p className="text-xs text-neutral-400 p-4 text-center bg-neutral-50 rounded-lg">
                    Nessun dente rilevato. Aggiungi manualmente dopo la creazione del caso.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {result.teeth.map((tooth, idx) => (
                      <div key={`${tooth.toothNumber}-${idx}`} className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg">
                        <span className="font-mono text-sm font-semibold text-neutral-800 w-8 text-center">
                          #{tooth.toothNumber}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-neutral-700">
                            {t(`dental.workTypes.${tooth.workType}`, { defaultValue: tooth.workType })}
                            <span className="text-neutral-400"> · {t(`dental.materials.${tooth.material}`, { defaultValue: tooth.material })}</span>
                          </p>
                          {tooth.vitaColor && (
                            <p className="text-[10px] text-neutral-500">Colore: {tooth.vitaColor}</p>
                          )}
                          {tooth.notes && (
                            <p className="text-[10px] text-neutral-400 italic">{tooth.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-neutral-200">
              <p className="text-[10px] text-neutral-400">
                Cliccando Crea, il caso verrà generato. Potrai aggiungere file/note dal dettaglio.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setResult(null)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-all"
                >
                  Ricarica foto
                </button>
                <button
                  onClick={handleCreateCase}
                  disabled={creating || !selectedClientId}
                  className="flex items-center gap-1 px-4 py-1.5 bg-card-teal text-white rounded-lg text-xs font-semibold hover:bg-card-teal/90 transition-all shadow-soft disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  {creating ? 'Creazione…' : 'Crea Caso'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
