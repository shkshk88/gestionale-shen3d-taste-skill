import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import clientService from '../../../services/client.service';
import { useToast } from '../../../components/ui/use-toast';
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  FileText,
  Euro,
  Save,
  X,
  UserPlus,
  Trash2,
  User
} from 'lucide-react';

interface ClientFormData {
  studioName: string;
  contactPerson: string;
  email: string;
  phone: string;
  mobile: string;
  website: string;
  address: string;
  city: string;
  postalCode: string;
  province: string;
  vatNumber: string;
  fiscalCode: string;
  pec: string;
  sdi: string;
  priceListId: string;
  notes: string;
  paymentTerms: string;
}

export default function ClientForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const [formData, setFormData] = useState<ClientFormData>({
    studioName: '',
    contactPerson: '',
    email: '',
    phone: '',
    mobile: '',
    website: '',
    address: '',
    city: '',
    postalCode: '',
    province: '',
    vatNumber: '',
    fiscalCode: '',
    pec: '',
    sdi: '',
    priceListId: '1',
    notes: '',
    paymentTerms: '30',
  });

  // Dentists management
  interface Dentist {
    id?: string;
    name: string;
    email: string;
    phone: string;
    specialization: string;
  }

  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [newDentist, setNewDentist] = useState<Dentist>({
    name: '',
    email: '',
    phone: '',
    specialization: '',
  });

  const priceLists = [
    { id: '1', name: 'Listino Standard' },
    { id: '2', name: 'Listino Premium (-15%)' },
    { id: '3', name: 'Listino Personalizzato' },
  ];

  const paymentOptions = [
    { value: '0', label: 'Pagamento immediato' },
    { value: '30', label: '30 giorni' },
    { value: '60', label: '60 giorni' },
    { value: '90', label: '90 giorni' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Load client data if editing
  useEffect(() => {
    if (id) {
      const loadClient = async () => {
        try {
          setLoadingData(true);
          const client = await clientService.getClientById(id);
          setFormData({
            studioName: client.studioName || '',
            contactPerson: client.contactPerson || '',
            email: client.email || '',
            phone: client.phone || '',
            mobile: client.whatsapp || '',
            website: '',
            address: client.address || '',
            city: client.city || '',
            postalCode: client.postalCode || '',
            province: '',
            vatNumber: client.vatNumber || '',
            fiscalCode: client.taxCode || '',
            pec: '',
            sdi: '',
            priceListId: client.priceListId || '1',
            notes: client.notes || '',
            paymentTerms: '30',
          });

          // Load dentists for this client
          try {
            const response = await fetch(`http://localhost:3000/api/dentists/client/${id}`);
            const dentistsData = await response.json();
            setDentists(dentistsData.map((d: any) => ({
              id: d.id,
              name: d.name,
              email: d.email || '',
              phone: d.phone || '',
              specialization: d.specialization || '',
            })));
          } catch (error) {
            console.error('Error loading dentists:', error);
          }
        } catch (error) {
          console.error('Error loading client:', error);
          toast({
            title: 'Errore',
            description: 'Impossibile caricare il cliente',
            variant: 'destructive',
          });
        } finally {
          setLoadingData(false);
        }
      };

      loadClient();
    }
  }, [id, toast]);

  const handleAddDentist = () => {
    if (!newDentist.name.trim()) {
      toast({
        title: 'Errore',
        description: 'Inserisci il nome del dentista',
        variant: 'destructive',
      });
      return;
    }

    setDentists([...dentists, { ...newDentist }]);
    setNewDentist({ name: '', email: '', phone: '', specialization: '' });
  };

  const handleRemoveDentist = async (index: number) => {
    const dentist = dentists[index];

    // If dentist has an ID (exists in DB), delete it
    if (dentist.id && isEditing) {
      try {
        await fetch(`http://localhost:3000/api/dentists/${dentist.id}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Error deleting dentist:', error);
      }
    }

    setDentists(dentists.filter((_, i) => i !== index));
  };

  const handleDelete = async () => {
    if (!window.confirm('Sei sicuro di voler eliminare questo cliente? Questa azione non può essere annullata.')) {
      return;
    }

    try {
      setLoading(true);
      await clientService.deleteClient(id!);
      toast({
        title: 'Successo',
        description: 'Cliente eliminato con successo',
      });
      navigate('/admin/clients');
    } catch (error: any) {
      console.error('Error deleting client:', error);
      toast({
        title: 'Errore',
        description: error.response?.data?.message || 'Impossibile eliminare il cliente',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation - ONLY studioName is required
    if (!formData.studioName.trim()) {
      toast({
        title: 'Errore',
        description: 'Inserisci il nome dello studio',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const clientData = {
        studioName: formData.studioName.trim(),
        contactPerson: formData.contactPerson.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        whatsapp: formData.mobile.trim() || undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        postalCode: formData.postalCode.trim() || undefined,
        country: 'Italia',
        vatNumber: formData.vatNumber.trim() || undefined,
        taxCode: formData.fiscalCode.trim() || undefined,
        // Don't send priceListId if it's '1' (fake data) or empty
        priceListId: (formData.priceListId && formData.priceListId !== '1') ? formData.priceListId : undefined,
        notes: formData.notes.trim() || undefined,
      };

      let savedClientId = id;

      if (isEditing) {
        await clientService.updateClient(id!, clientData);
      } else {
        const newClient = await clientService.createClient(clientData);
        savedClientId = newClient.id;
      }

      // Save new dentists (only those without ID)
      const newDentists = dentists.filter(d => !d.id);
      if (newDentists.length > 0 && savedClientId) {
        for (const dentist of newDentists) {
          try {
            const dentistData = {
              clientId: savedClientId,
              name: dentist.name,
              email: dentist.email || undefined,
              phone: dentist.phone || undefined,
              specialization: dentist.specialization || undefined,
              active: true,
            };
            await fetch('http://localhost:3000/api/dentists', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(dentistData),
            });
          } catch (error) {
            console.error('Error saving dentist:', error);
          }
        }
      }

      // Update existing dentists (those with ID)
      const existingDentists = dentists.filter(d => d.id);
      for (const dentist of existingDentists) {
        try {
          const dentistData = {
            name: dentist.name,
            email: dentist.email || undefined,
            phone: dentist.phone || undefined,
            specialization: dentist.specialization || undefined,
          };
          await fetch(`http://localhost:3000/api/dentists/${dentist.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dentistData),
          });
        } catch (error) {
          console.error('Error updating dentist:', error);
        }
      }

      toast({
        title: 'Successo',
        description: isEditing ? 'Cliente aggiornato con successo' : 'Cliente creato con successo',
      });

      navigate('/admin/clients');
    } catch (error: any) {
      console.error('Error saving client:', error);
      toast({
        title: 'Errore',
        description: error.response?.data?.message || 'Impossibile salvare il cliente',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/clients')}
            className="w-10 h-10 rounded-xl bg-surface-secondary flex items-center justify-center text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-800">
              {isEditing ? 'Modifica Cliente' : t('clients.newClient')}
            </h1>
            <p className="text-sm text-neutral-500">
              {isEditing ? 'Modifica i dati del cliente' : 'Inserisci i dati del nuovo studio dentistico'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/admin/clients')}
            className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-all flex items-center gap-2"
          >
            <X size={18} />
            Annulla
          </button>
          <button
            type="submit"
            form="client-form"
            disabled={loading || loadingData}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            {loading
              ? 'Salvataggio...'
              : isEditing
              ? 'Salva modifiche'
              : 'Crea cliente'}
          </button>
        </div>
      </div>

      <form id="client-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Studio Info */}
          <div className="card-base p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-card-navy/10 flex items-center justify-center text-card-navy">
                <Building2 size={20} />
              </div>
              <h2 className="text-lg font-semibold text-neutral-800">Informazioni Studio</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Nome Studio *
                </label>
                <input
                  type="text"
                  name="studioName"
                  value={formData.studioName}
                  onChange={handleChange}
                  placeholder="Es. Clinica Dentale Rossi"
                  className="input-modern w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Referente / Titolare
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  placeholder="Es. Dr. Mario Rossi (opzionale)"
                  className="input-modern w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Sito Web
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="www.esempio.it"
                    className="input-modern w-full pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dentists Management */}
          <div className="card-base p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-card-teal/10 flex items-center justify-center text-card-teal">
                <User size={20} />
              </div>
              <h2 className="text-lg font-semibold text-neutral-800">Dentisti Operanti</h2>
            </div>

            {/* Lista dentisti esistenti */}
            {dentists.length > 0 && (
              <div className="mb-4 space-y-2">
                {dentists.map((dentist, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-surface-secondary rounded-xl"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-neutral-800">{dentist.name}</p>
                      <div className="flex gap-4 text-sm text-neutral-500 mt-1">
                        {dentist.email && <span>{dentist.email}</span>}
                        {dentist.phone && <span>{dentist.phone}</span>}
                        {dentist.specialization && <span className="text-brand-primary">
                          {dentist.specialization}
                        </span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDentist(index)}
                      className="ml-4 p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Form aggiungi nuovo dentista */}
            <div className="bg-surface-secondary rounded-xl p-4">
              <p className="text-sm font-medium text-neutral-700 mb-3">Aggiungi Dentista</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    value={newDentist.name}
                    onChange={(e) => setNewDentist({ ...newDentist, name: e.target.value })}
                    placeholder="Nome completo *"
                    className="input-modern w-full text-sm"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    value={newDentist.email}
                    onChange={(e) => setNewDentist({ ...newDentist, email: e.target.value })}
                    placeholder="Email"
                    className="input-modern w-full text-sm"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    value={newDentist.phone}
                    onChange={(e) => setNewDentist({ ...newDentist, phone: e.target.value })}
                    placeholder="Telefono"
                    className="input-modern w-full text-sm"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={newDentist.specialization}
                    onChange={(e) => setNewDentist({ ...newDentist, specialization: e.target.value })}
                    placeholder="Specializzazione (es. Ortodonzia)"
                    className="input-modern w-full text-sm"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddDentist}
                className="mt-3 w-full px-4 py-2 bg-brand-primary text-white rounded-lg font-medium hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-2"
              >
                <UserPlus size={18} />
                Aggiungi Dentista
              </button>
            </div>
          </div>

          {/* Contact Info */}
          <div className="card-base p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-card-teal/10 flex items-center justify-center text-card-teal">
                <Phone size={20} />
              </div>
              <h2 className="text-lg font-semibold text-neutral-800">Contatti</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="info@studio.it (opzionale)"
                    className="input-modern w-full pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Telefono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+39 02 1234567"
                    className="input-modern w-full pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Cellulare
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="+39 333 1234567"
                    className="input-modern w-full pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="card-base p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-card-olive/10 flex items-center justify-center text-card-olive">
                <MapPin size={20} />
              </div>
              <h2 className="text-lg font-semibold text-neutral-800">Indirizzo</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Via e numero civico
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Via Roma, 123"
                  className="input-modern w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Città
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Milano"
                  className="input-modern w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    CAP
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder="20100"
                    className="input-modern w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Provincia
                  </label>
                  <input
                    type="text"
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    placeholder="MI"
                    className="input-modern w-full"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Billing Info */}
          <div className="card-base p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-card-yellow/20 flex items-center justify-center text-card-yellow-dark">
                <FileText size={20} />
              </div>
              <h2 className="text-lg font-semibold text-neutral-800">Dati Fatturazione</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Partita IVA
                </label>
                <input
                  type="text"
                  name="vatNumber"
                  value={formData.vatNumber}
                  onChange={handleChange}
                  placeholder="IT12345678901"
                  className="input-modern w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Codice Fiscale
                </label>
                <input
                  type="text"
                  name="fiscalCode"
                  value={formData.fiscalCode}
                  onChange={handleChange}
                  placeholder="RSSMRA80A01H501X"
                  className="input-modern w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  PEC
                </label>
                <input
                  type="email"
                  name="pec"
                  value={formData.pec}
                  onChange={handleChange}
                  placeholder="studio@pec.it"
                  className="input-modern w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Codice SDI
                </label>
                <input
                  type="text"
                  name="sdi"
                  value={formData.sdi}
                  onChange={handleChange}
                  placeholder="XXXXXXX"
                  className="input-modern w-full"
                  maxLength={7}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price List Selection */}
          <div className="card-base p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                <Euro size={20} />
              </div>
              <h2 className="text-lg font-semibold text-neutral-800">Listino Prezzi</h2>
            </div>

            <div className="space-y-3">
              {priceLists.map((list) => (
                <label
                  key={list.id}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.priceListId === list.id
                      ? 'border-brand-primary bg-brand-primary/5'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="priceListId"
                    value={list.id}
                    checked={formData.priceListId === list.id}
                    onChange={handleChange}
                    className="w-4 h-4 text-brand-primary"
                  />
                  <span className="font-medium text-neutral-800">{list.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Payment Terms */}
          <div className="card-base p-6">
            <h3 className="font-semibold text-neutral-800 mb-4">Termini di Pagamento</h3>
            <select
              name="paymentTerms"
              value={formData.paymentTerms}
              onChange={handleChange}
              className="input-modern w-full"
            >
              {paymentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="card-base p-6">
            <h3 className="font-semibold text-neutral-800 mb-4">Note</h3>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              placeholder={t('clients.additionalNotesPlaceholder')}
              className="input-modern w-full resize-none"
            />
          </div>

          {/* Quick Tips */}
          <div className="bg-card-navy/5 border border-card-navy/10 rounded-2xl p-5">
            <h3 className="font-semibold text-card-navy mb-3">Suggerimenti</h3>
            <ul className="text-sm text-neutral-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-card-navy">•</span>
                Solo il nome dello studio è obbligatorio
              </li>
              <li className="flex items-start gap-2">
                <span className="text-card-navy">•</span>
                Puoi aggiungere i dentisti operanti nello studio
              </li>
              <li className="flex items-start gap-2">
                <span className="text-card-navy">•</span>
                Il listino prezzi può essere modificato in seguito
              </li>
              <li className="flex items-start gap-2">
                <span className="text-card-navy">•</span>
                PEC e SDI sono necessari per la fatturazione elettronica
              </li>
            </ul>
          </div>
        </div>
      </form>

      {/* Delete Button - Only in edit mode */}
      {isEditing && (
        <div className="mt-8 pt-8 border-t border-neutral-200">
          <div className="card-base p-6 border-2 border-red-200">
            <h3 className="font-semibold text-neutral-800 mb-2">Zona Pericolosa</h3>
            <p className="text-sm text-neutral-600 mb-4">
              L'eliminazione del cliente è permanente e non può essere annullata. Tutti i casi associati verranno mantenuti.
            </p>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={18} />
              Elimina Cliente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
