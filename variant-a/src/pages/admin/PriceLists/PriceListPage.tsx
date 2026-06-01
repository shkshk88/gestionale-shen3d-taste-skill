import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Trash2,
  Users,
  Search,
  Star,
  Loader2,
  Check,
  X,
  Pencil,
  AlertCircle,
} from 'lucide-react';
import priceListService, {
  PriceList,
  PriceListItem,
  WorkType,
  Material,
  WORK_TYPES,
  MATERIALS,
} from '@/services/priceList.service';
import { useToast } from '@/components/ui/use-toast';

type CellState = 'idle' | 'editing' | 'saving';

interface EditingCell {
  workType: WorkType;
  material: Material;
  value: string;
  state: CellState;
}

export default function PriceListPage() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [lists, setLists] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<EditingCell | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createDefault, setCreateDefault] = useState(false);
  const [creating, setCreating] = useState(false);

  const [editingHeader, setEditingHeader] = useState(false);
  const [headerName, setHeaderName] = useState('');
  const [headerDesc, setHeaderDesc] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  const loadLists = async () => {
    setLoading(true);
    try {
      const data = await priceListService.list();
      setLists(data);
      if (data.length > 0 && !selectedListId) {
        const def = data.find((l) => l.isDefault) || data[0];
        setSelectedListId(def.id);
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Errore caricamento',
        description: err?.response?.data?.message || err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedList = lists.find((l) => l.id === selectedListId) || null;

  // Sync header editing fields when selection changes
  useEffect(() => {
    if (selectedList) {
      setHeaderName(selectedList.listName);
      setHeaderDesc(selectedList.description || '');
      setEditingHeader(false);
      setEditing(null);
    }
  }, [selectedListId, selectedList?.updatedAt]);

  // Build matrix lookup: { workType -> { material -> item } }
  const matrix = useMemo(() => {
    if (!selectedList) return {} as Record<string, Record<string, PriceListItem>>;
    const map: Record<string, Record<string, PriceListItem>> = {};
    for (const wt of WORK_TYPES) {
      map[wt.code] = {};
    }
    for (const item of selectedList.items) {
      if (!map[item.workType]) map[item.workType] = {};
      map[item.workType][item.material] = item;
    }
    return map;
  }, [selectedList]);

  const filteredWorkTypes = useMemo(() => {
    if (!search.trim()) return WORK_TYPES;
    const q = search.toLowerCase();
    return WORK_TYPES.filter(
      (wt) =>
        wt.label.toLowerCase().includes(q) || wt.code.toLowerCase().includes(q),
    );
  }, [search]);

  const filteredMaterials = useMemo(() => {
    if (!search.trim()) return MATERIALS;
    const q = search.toLowerCase();
    const matchMat = MATERIALS.filter(
      (m) => m.label.toLowerCase().includes(q) || m.code.toLowerCase().includes(q),
    );
    // If search matches a material, show only that material column; otherwise all
    return matchMat.length > 0 && matchMat.length < MATERIALS.length ? matchMat : MATERIALS;
  }, [search]);

  // ------- Cell editing -------
  const startEdit = (workType: WorkType, material: Material) => {
    if (!selectedList) return;
    const existing = matrix[workType]?.[material];
    setEditing({
      workType,
      material,
      value: existing ? String(existing.unitPrice) : '',
      state: 'editing',
    });
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const cancelEdit = () => setEditing(null);

  const saveEdit = async () => {
    if (!editing || !selectedList) return;
    const num = parseFloat(editing.value.replace(',', '.'));
    if (Number.isNaN(num) || num < 0) {
      toast({
        variant: 'destructive',
        title: 'Prezzo non valido',
        description: 'Inserisci un numero positivo',
      });
      return;
    }
    setEditing({ ...editing, state: 'saving' });
    try {
      await priceListService.upsertItems(selectedList.id, [
        { workType: editing.workType, material: editing.material, unitPrice: num },
      ]);
      await loadLists();
      setEditing(null);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Errore salvataggio',
        description: err?.response?.data?.message || err.message,
      });
      setEditing({ ...editing, state: 'editing' });
    }
  };

  const deleteCell = async (item: PriceListItem) => {
    if (!selectedList) return;
    if (!window.confirm(`Rimuovere il prezzo ${item.workType}/${item.material}?`)) return;
    try {
      await priceListService.removeItem(selectedList.id, item.id);
      await loadLists();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Errore rimozione',
        description: err?.response?.data?.message || err.message,
      });
    }
  };

  // ------- List CRUD -------
  const handleCreate = async () => {
    if (!createName.trim()) {
      toast({ variant: 'destructive', title: 'Nome richiesto' });
      return;
    }
    setCreating(true);
    try {
      const created = await priceListService.create({
        listName: createName.trim(),
        description: createDesc.trim() || undefined,
        isDefault: createDefault,
      });
      setShowCreate(false);
      setCreateName('');
      setCreateDesc('');
      setCreateDefault(false);
      await loadLists();
      setSelectedListId(created.id);
      toast({ title: 'Listino creato' });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Errore creazione',
        description: err?.response?.data?.message || err.message,
      });
    } finally {
      setCreating(false);
    }
  };

  const handleSaveHeader = async () => {
    if (!selectedList) return;
    if (!headerName.trim()) {
      toast({ variant: 'destructive', title: 'Nome richiesto' });
      return;
    }
    try {
      await priceListService.update(selectedList.id, {
        listName: headerName.trim(),
        description: headerDesc.trim() || null,
      });
      await loadLists();
      setEditingHeader(false);
      toast({ title: 'Listino aggiornato' });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Errore aggiornamento',
        description: err?.response?.data?.message || err.message,
      });
    }
  };

  const handleSetDefault = async (list: PriceList) => {
    if (list.isDefault) return;
    try {
      await priceListService.update(list.id, { isDefault: true });
      await loadLists();
      toast({ title: `${list.listName} è ora il listino di default` });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: err?.response?.data?.message || err.message,
      });
    }
  };

  const handleDeleteList = async (list: PriceList) => {
    if (list._count && list._count.clients > 0) {
      toast({
        variant: 'destructive',
        title: 'Impossibile eliminare',
        description: `${list._count.clients} clienti usano ancora questo listino. Riassegnali prima.`,
      });
      return;
    }
    if (!window.confirm(`Eliminare definitivamente "${list.listName}"?`)) return;
    try {
      await priceListService.remove(list.id);
      if (selectedListId === list.id) setSelectedListId(null);
      await loadLists();
      toast({ title: 'Listino eliminato' });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Errore eliminazione',
        description: err?.response?.data?.message || err.message,
      });
    }
  };

  // ------- Render -------
  if (loading && lists.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in pb-8 max-w-7xl mx-auto p-2 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t('priceLists.title')}</h1>
          <p className="text-xs text-slate-500">
            {t('priceLists.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-semibold shadow-soft hover:bg-sky-700 transition-colors"
        >
          <Plus size={16} />
          {t('priceLists.newList')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr] gap-4">
        {/* Lists sidebar */}
        <div className="space-y-2">
          <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-1">
            {t('priceLists.lists')} {lists.length}
          </h2>
          {lists.map((list) => (
            <button
              key={list.id}
              onClick={() => setSelectedListId(list.id)}
              className={`w-full text-left card-base p-3 transition-all relative ${
                selectedListId === list.id
                  ? 'ring-2 ring-sky-600 shadow-soft-lg'
                  : 'hover:shadow-soft'
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-semibold text-sm text-slate-800 truncate pr-2">
                  {list.listName}
                </h3>
                {list.isDefault && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-teal-50 text-teal-700 rounded-full text-[10px] font-semibold shrink-0">
                    <Star size={9} fill="currentColor" />
                    default
                  </span>
                )}
              </div>
              {list.description && (
                <p className="text-[11px] text-slate-500 line-clamp-1 mb-2">
                  {list.description}
                </p>
              )}
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Users size={11} />
                  {list._count?.clients ?? 0}
                </span>
                <span>{list.items.length} voci</span>
              </div>
            </button>
          ))}
          {lists.length === 0 && (
            <div className="card-base p-4 text-center text-sm text-slate-500">
              <AlertCircle size={20} className="mx-auto mb-2 text-slate-300" />
              Nessun listino. Creane uno per iniziare.
            </div>
          )}
        </div>

        {/* Selected list detail */}
        {selectedList ? (
          <div className="card-base overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100">
              {editingHeader ? (
                <div className="space-y-2">
                  <input
                    value={headerName}
                    onChange={(e) => setHeaderName(e.target.value)}
                    className="input-modern w-full font-semibold"
                    placeholder="Nome listino"
                  />
                  <input
                    value={headerDesc}
                    onChange={(e) => setHeaderDesc(e.target.value)}
                    className="input-modern w-full text-sm"
                    placeholder="Descrizione (opzionale)"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveHeader}
                      className="px-3 py-1.5 text-xs rounded-lg bg-sky-600 text-white font-medium hover:bg-sky-700 transition-colors"
                    >
                      Salva
                    </button>
                    <button
                      onClick={() => {
                        setEditingHeader(false);
                        setHeaderName(selectedList.listName);
                        setHeaderDesc(selectedList.description || '');
                      }}
                      className="px-3 py-1.5 text-xs rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
                    >
                      Annulla
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h2 className="text-lg font-bold text-slate-800 truncate">
                        {selectedList.listName}
                      </h2>
                      {selectedList.isDefault && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full text-[10px] font-semibold">
                          <Star size={10} fill="currentColor" />
                          default
                        </span>
                      )}
                    </div>
                    {selectedList.description && (
                      <p className="text-xs text-slate-500">{selectedList.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => setEditingHeader(true)}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                      title="Modifica nome/descrizione"
                    >
                      <Pencil size={14} />
                    </button>
                    {!selectedList.isDefault && (
                      <button
                        onClick={() => handleSetDefault(selectedList)}
                        className="w-8 h-8 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 flex items-center justify-center transition-colors"
                        title="Imposta come default"
                      >
                        <Star size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteList(selectedList)}
                      className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 flex items-center justify-center transition-colors"
                      title="Elimina listino"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="flex gap-4 mt-3 text-xs">
                <span className="text-slate-500">
                  <strong className="text-slate-800">{selectedList.items.length}</strong> voci
                </span>
                <span className="text-slate-500">
                  <strong className="text-slate-800">{selectedList._count?.clients ?? 0}</strong>{' '}
                  clienti
                </span>
              </div>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search
                  className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={14}
                />
                <input
                  type="text"
                  placeholder={t('priceLists.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-modern ps-9 w-full text-sm h-9"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 px-1">
                {t('priceLists.matrixHint', { defaultValue: 'Clicca una cella per modificare il prezzo.' })}
              </p>
            </div>

            {/* Matrix */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr>
                    <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-2 sticky start-0 bg-slate-50 z-20 min-w-[120px]">
                      Lavorazione
                    </th>
                    {filteredMaterials.map((mat) => (
                      <th
                        key={mat.code}
                        className="text-center text-[11px] font-semibold text-slate-600 px-2 py-2 min-w-[80px]"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`w-2 h-2 rounded-full ${mat.color}`}
                            title={mat.code}
                          />
                          {mat.label}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkTypes.map((wt) => (
                    <tr
                      key={wt.code}
                      className="border-t border-slate-100 group hover:bg-slate-50/40"
                    >
                      <td className="px-3 py-2 font-medium text-slate-800 sticky start-0 bg-white group-hover:bg-slate-50/40 z-10 whitespace-nowrap">
                        {wt.label}
                      </td>
                      {filteredMaterials.map((mat) => {
                        const item = matrix[wt.code]?.[mat.code];
                        const isEditing =
                          editing?.workType === wt.code &&
                          editing.material === mat.code;
                        return (
                          <td
                            key={mat.code}
                            className="px-2 py-1 text-center border-l border-slate-50"
                          >
                            {isEditing ? (
                              <div className="flex items-center gap-0.5 justify-center">
                                <input
                                  ref={inputRef}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={editing.value}
                                  onChange={(e) =>
                                    setEditing({ ...editing, value: e.target.value })
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEdit();
                                    if (e.key === 'Escape') cancelEdit();
                                  }}
                                  disabled={editing.state === 'saving'}
                                  className="w-16 px-1 py-0.5 text-sm border border-sky-600 rounded text-center"
                                  placeholder="0"
                                />
                                <button
                                  onClick={saveEdit}
                                  disabled={editing.state === 'saving'}
                                  className="w-5 h-5 flex items-center justify-center text-teal-600 hover:bg-teal-50 rounded transition-colors"
                                >
                                  {editing.state === 'saving' ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <Check size={12} />
                                  )}
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  disabled={editing.state === 'saving'}
                                  className="w-5 h-5 flex items-center justify-center text-red-600 hover:bg-red-50 rounded transition-colors"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : item ? (
                              <div className="relative inline-flex items-center gap-1">
                                <button
                                  onClick={() => startEdit(wt.code, mat.code)}
                                  className="px-2 py-1 rounded font-semibold text-slate-800 hover:bg-sky-50 hover:text-sky-600 transition-colors"
                                  title="Clicca per modificare"
                                >
                                  ₪{Number(item.unitPrice).toLocaleString('it-IT')}
                                </button>
                                <button
                                  onClick={() => deleteCell(item)}
                                  className="w-4 h-4 flex items-center justify-center text-slate-300 opacity-0 group-hover:opacity-100 hover:text-red-600 transition"
                                  title="Rimuovi"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEdit(wt.code, mat.code)}
                                className="w-full py-1 text-slate-300 hover:text-sky-600 hover:bg-sky-50/50 rounded font-medium transition-colors"
                                title="Aggiungi prezzo"
                              >
                                +
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card-base p-12 text-center">
            <AlertCircle size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Seleziona un listino o creane uno nuovo</p>
          </div>
        )}
      </div>

      {/* Materials legend */}
      <div className="card-base p-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Legenda materiali
        </h3>
        <div className="flex flex-wrap gap-2">
          {MATERIALS.map((m) => (
            <div
              key={m.code}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full text-xs"
            >
              <div className={`w-2 h-2 rounded-full ${m.color}`} />
              <span className="font-mono text-slate-500">{m.code}</span>
              <span className="text-slate-700 font-medium">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-200/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-elevated w-full max-w-md overflow-hidden">
            <div className="bg-slate-800 p-4 flex items-center justify-between">
              <h3 className="text-white font-semibold">{t('priceLists.newList')}</h3>
              <button
                onClick={() => setShowCreate(false)}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nome *
                </label>
                <input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="input-modern w-full"
                  placeholder="es. Standard, Premium, Cliente X…"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Descrizione
                </label>
                <textarea
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  className="input-modern w-full"
                  rows={2}
                  placeholder="Note interne (opzionale)"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createDefault}
                  onChange={(e) => setCreateDefault(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-slate-700">
                  Imposta come listino di default
                </span>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 disabled:opacity-60 flex items-center gap-2 transition-colors"
                >
                  {creating && <Loader2 size={14} className="animate-spin" />}
                  Crea
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
