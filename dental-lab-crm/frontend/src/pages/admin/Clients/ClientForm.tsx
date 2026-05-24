import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import clientService from '../../../services/client.service';
import priceListService, { PriceList } from '../../../services/priceList.service';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
import { useToast } from '../../../components/ui/use-toast';
import {
  ArrowLeft,
  Building2,
  Phone,
  MapPin,
  FileText,
  Euro,
  Save,
  UserPlus,
  Trash2,
  User,
  Edit3,
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
  vatNumber: string;
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
    vatNumber: '',
    priceListId: '',
    notes: '',
    paymentTerms: '30',
  });

  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [loadingPriceLists, setLoadingPriceLists] = useState(true);
  const [editingDentistIndex, setEditingDentistIndex] = useState<number | null>(null);

  const handleUpdateDentistField = (index: number, field: keyof Dentist, value: string) => {
    setDentists((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  };

  useEffect(() => {
    priceListService
      .list()
      .then((data) => setPriceLists(data))
      .catch((e) => console.error('Failed to load price lists', e))
      .finally(() => setLoadingPriceLists(false));
  }, []);

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

  const paymentOptions = [
    { value: '0', label: t('clients.paymentImmediateFull') },
    { value: '30', label: t('clients.payment30') },
    { value: '60', label: t('clients.payment60') },
    { value: '90', label: t('clients.payment90') },
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
            vatNumber: client.vatNumber || '',
            priceListId: client.priceListId || '',
            notes: client.notes || '',
            paymentTerms: '30',
          });

          // Load dentists for this client
          try {
            const response = await fetch(`${API_URL}/dentists/client/${id}`);
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
            title: t('common.error'),
            description: t('clients.errorLoadingClient'),
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
        title: t('common.error'),
        description: t('clients.enterDentistName'),
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
        await fetch(`${API_URL}/dentists/${dentist.id}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Error deleting dentist:', error);
      }
    }

    setDentists(dentists.filter((_, i) => i !== index));
  };

  const handleDelete = async () => {
    if (!window.confirm(t('clients.deleteClientConfirm'))) {
      return;
    }

    try {
      setLoading(true);
      await clientService.deleteClient(id!);
      toast({
        title: t('common.success'),
        description: t('clients.clientDeleted'),
      });
      navigate('/admin/clients');
    } catch (error: any) {
      console.error('Error deleting client:', error);
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || t('clients.errorDeletingClient'),
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
        title: t('common.error'),
        description: t('clients.enterStudioName'),
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
        country: t('clients.defaultCountry'),
        vatNumber: formData.vatNumber.trim() || undefined,
        priceListId: formData.priceListId || undefined,
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
            await fetch(`${API_URL}/dentists`, {
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
          await fetch(`${API_URL}/dentists/${dentist.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dentistData),
          });
        } catch (error) {
          console.error('Error updating dentist:', error);
        }
      }

      toast({
        title: t('common.success'),
        description: isEditing ? t('clients.clientUpdated') : t('clients.clientCreated'),
      });

      navigate('/admin/clients');
    } catch (error: any) {
      console.error('Error saving client:', error);
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || t('clients.errorSavingClient'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 animate-fade-in pb-8 max-w-5xl mx-auto p-2 sm:p-4">
      {/* Top compact bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/admin/clients')}
            className="w-9 h-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600"
            title={t('common.back', { defaultValue: 'Indietro' })}
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-base sm:text-lg font-bold text-neutral-800 truncate">
            {isEditing ? t('clients.editClientTitle') : t('clients.newClient')}
          </h1>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/admin/clients')}
            className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-medium"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            form="client-form"
            disabled={loading || loadingData}
            className="px-4 py-1.5 rounded-lg bg-brand-primary text-white text-sm font-semibold shadow-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
          >
            <Save size={14} />
            {loading ? t('common.saving') : t('common.save', { defaultValue: 'Salva' })}
          </button>
        </div>
      </div>

      <form id="client-form" onSubmit={handleSubmit} className="space-y-3">
        {/* ============ Card 1: All studio info merged ============ */}
        <div className="card-base p-4 sm:p-5 space-y-4">
          {/* Section: Studio identification */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-neutral-100">
              <Building2 size={16} className="text-card-navy" />
              <h2 className="text-sm font-semibold text-neutral-800">{t('clients.studioInfo')}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">{t('clients.studioName')} *</label>
                <input
                  type="text"
                  name="studioName"
                  value={formData.studioName}
                  onChange={handleChange}
                  placeholder={t('clients.studioNamePlaceholder')}
                  className="input-modern w-full text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">{t('clients.contactPersonLabel')}</label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  placeholder={t('clients.contactPersonPlaceholder')}
                  className="input-modern w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">{t('clients.website')}</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder={t('clients.websitePlaceholder')}
                  className="input-modern w-full text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section: Contacts */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-neutral-100">
              <Phone size={16} className="text-card-teal" />
              <h2 className="text-sm font-semibold text-neutral-800">{t('clients.contacts')}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">{t('clients.email')}</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('clients.emailPlaceholder')}
                  className="input-modern w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">{t('clients.phone')}</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={t('clients.phonePlaceholder')}
                  className="input-modern w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">WhatsApp</label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder={t('clients.mobilePlaceholder')}
                  className="input-modern w-full text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section: Address + Tax + Price List */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-neutral-100">
              <MapPin size={16} className="text-card-olive" />
              <h2 className="text-sm font-semibold text-neutral-800">Indirizzo & Fiscale</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">{t('clients.streetAddress')}</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder={t('clients.addressPlaceholder')}
                  className="input-modern w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">{t('clients.city')}</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder={t('clients.cityPlaceholder')}
                  className="input-modern w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">{t('clients.postalCode')}</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder={t('clients.postalCodePlaceholder')}
                  className="input-modern w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1" title="Teudat Zehut / Ch.P.">Teudat Zehut / Ch.P.</label>
                <input
                  type="text"
                  name="vatNumber"
                  value={formData.vatNumber}
                  onChange={handleChange}
                  placeholder="N. identificativo"
                  className="input-modern w-full text-sm"
                  maxLength={20}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1 flex items-center gap-1">
                  <Euro size={11} /> {t('clients.priceList')}
                </label>
                <select
                  name="priceListId"
                  value={formData.priceListId}
                  onChange={handleChange}
                  className="input-modern w-full text-sm"
                  disabled={loadingPriceLists}
                >
                  <option value="">— Nessun listino —</option>
                  {priceLists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.listName}
                      {list.isDefault ? ' (default)' : ''}
                      {` · ${list.items.length} voci`}
                    </option>
                  ))}
                </select>
                {priceLists.length === 0 && !loadingPriceLists && (
                  <p className="text-[10px] text-neutral-400 mt-1">
                    <a href="/admin/price-lists" className="text-brand-primary hover:underline">
                      Crea un listino
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Payment + Notes */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-neutral-100">
              <FileText size={16} className="text-card-yellow-dark" />
              <h2 className="text-sm font-semibold text-neutral-800">Pagamento & Note</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">{t('clients.paymentTerms')}</label>
                <select
                  name="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={handleChange}
                  className="input-modern w-full text-sm"
                >
                  {paymentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">{t('clients.notes')}</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={2}
                  placeholder={t('clients.additionalNotesPlaceholder')}
                  className="input-modern w-full resize-none text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ============ Card 2: Dentists (editable) ============ */}
        <div className="card-base p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <User size={16} className="text-card-teal" />
              <h2 className="text-sm font-semibold text-neutral-800">{t('clients.operatingDentists')}</h2>
              {dentists.length > 0 && (
                <span className="text-[11px] text-neutral-500">({dentists.length})</span>
              )}
            </div>
          </div>

          {/* Existing dentists rows */}
          {dentists.length > 0 && (
            <div className="space-y-2 mb-3">
              {dentists.map((dentist, index) => (
                <div
                  key={index}
                  className="border border-neutral-100 rounded-xl p-2.5 bg-neutral-50/40"
                >
                  {editingDentistIndex === index ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      <input
                        type="text"
                        value={dentist.name}
                        onChange={(e) => handleUpdateDentistField(index, 'name', e.target.value)}
                        placeholder="Nome *"
                        className="input-modern w-full text-sm h-8"
                      />
                      <input
                        type="email"
                        value={dentist.email}
                        onChange={(e) => handleUpdateDentistField(index, 'email', e.target.value)}
                        placeholder="Email"
                        className="input-modern w-full text-sm h-8"
                      />
                      <input
                        type="tel"
                        value={dentist.phone}
                        onChange={(e) => handleUpdateDentistField(index, 'phone', e.target.value)}
                        placeholder="Telefono"
                        className="input-modern w-full text-sm h-8"
                      />
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={dentist.specialization}
                          onChange={(e) => handleUpdateDentistField(index, 'specialization', e.target.value)}
                          placeholder="Specializzazione"
                          className="input-modern flex-1 text-sm h-8"
                        />
                        <button
                          type="button"
                          onClick={() => setEditingDentistIndex(null)}
                          className="w-8 h-8 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 flex items-center justify-center shrink-0"
                          title="Conferma"
                        >
                          <Save size={13} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm text-neutral-800">{dentist.name}</p>
                          {dentist.specialization && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-brand-primary/10 text-brand-primary rounded-full font-medium">
                              {dentist.specialization}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-3 text-[11px] text-neutral-500 mt-0.5">
                          {dentist.email && <span className="truncate">{dentist.email}</span>}
                          {dentist.phone && <span>{dentist.phone}</span>}
                          {!dentist.email && !dentist.phone && (
                            <span className="text-neutral-300">no contatti</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingDentistIndex(index)}
                          className="w-7 h-7 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center"
                          title="Modifica"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveDentist(index)}
                          className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center"
                          title="Elimina"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add new dentist inline */}
          <div className="border border-dashed border-neutral-200 rounded-xl p-3 bg-neutral-50/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-2">
              <input
                type="text"
                value={newDentist.name}
                onChange={(e) => setNewDentist({ ...newDentist, name: e.target.value })}
                placeholder={`${t('clients.dentistFullName')} *`}
                className="input-modern w-full text-sm h-8"
              />
              <input
                type="email"
                value={newDentist.email}
                onChange={(e) => setNewDentist({ ...newDentist, email: e.target.value })}
                placeholder={t('clients.email')}
                className="input-modern w-full text-sm h-8"
              />
              <input
                type="tel"
                value={newDentist.phone}
                onChange={(e) => setNewDentist({ ...newDentist, phone: e.target.value })}
                placeholder={t('clients.phone')}
                className="input-modern w-full text-sm h-8"
              />
              <input
                type="text"
                value={newDentist.specialization}
                onChange={(e) => setNewDentist({ ...newDentist, specialization: e.target.value })}
                placeholder={t('clients.specializationPlaceholder')}
                className="input-modern w-full text-sm h-8"
              />
            </div>
            <button
              type="button"
              onClick={handleAddDentist}
              className="w-full px-3 py-1.5 bg-brand-primary text-white rounded-lg text-sm font-medium hover:opacity-90 flex items-center justify-center gap-1.5"
            >
              <UserPlus size={14} />
              {t('clients.addDentist')}
            </button>
          </div>
        </div>
      </form>


      {/* Delete Button - Only in edit mode */}
      {isEditing && (
        <div className="mt-8 pt-8 border-t border-neutral-200">
          <div className="card-base p-6 border-2 border-red-200">
            <h3 className="font-semibold text-neutral-800 mb-2">{t('clients.dangerZone')}</h3>
            <p className="text-sm text-neutral-600 mb-4">
              {t('clients.deleteClientWarning')}
            </p>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={18} />
              {t('clients.deleteClient')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
