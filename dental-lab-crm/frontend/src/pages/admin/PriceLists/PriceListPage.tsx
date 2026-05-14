import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Users,
  Euro,
  Search,
  MoreHorizontal,
  Star
} from 'lucide-react';

interface PriceItem {
  id: string;
  name: string;
  material: string;
  price: number;
  category: string;
}

interface PriceList {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  clientsCount: number;
  color: string;
  items: PriceItem[];
}

export default function PriceListPage() {
  const { t } = useTranslation();
  const [selectedList, setSelectedList] = useState<string | null>('1');
  const [searchQuery, setSearchQuery] = useState('');

  const priceLists: PriceList[] = [
    {
      id: '1',
      name: 'Listino Standard',
      description: 'Listino prezzi base per tutti i clienti',
      isDefault: true,
      clientsCount: 8,
      color: 'bg-card-navy',
      items: [
        { id: '1', name: 'Corona', material: 'Zirconio', price: 180, category: 'Corone' },
        { id: '2', name: 'Corona', material: 'E.max', price: 200, category: 'Corone' },
        { id: '3', name: 'Corona', material: 'Metallo-ceramica', price: 120, category: 'Corone' },
        { id: '4', name: 'Faccetta', material: 'E.max', price: 220, category: 'Faccette' },
        { id: '5', name: 'Faccetta', material: 'Composito', price: 150, category: 'Faccette' },
        { id: '6', name: 'Intarsio', material: 'E.max', price: 150, category: 'Intarsi' },
        { id: '7', name: 'Intarsio', material: 'Composito', price: 100, category: 'Intarsi' },
        { id: '8', name: 'Ponte (per elemento)', material: 'Zirconio', price: 170, category: 'Ponti' },
        { id: '9', name: 'Ponte (per elemento)', material: 'Metallo-ceramica', price: 110, category: 'Ponti' },
        { id: '10', name: 'Impianto su corona', material: 'Zirconio', price: 250, category: 'Impianti' },
        { id: '11', name: 'Provvisorio', material: 'PMMA', price: 50, category: 'Provvisori' },
        { id: '12', name: 'Protesi totale', material: 'Resina', price: 450, category: 'Protesi' },
      ]
    },
    {
      id: '2',
      name: 'Listino Premium',
      description: 'Prezzi dedicati per clienti premium con sconto 15%',
      isDefault: false,
      clientsCount: 2,
      color: 'bg-card-yellow',
      items: [
        { id: '1', name: 'Corona', material: 'Zirconio', price: 153, category: 'Corone' },
        { id: '2', name: 'Corona', material: 'E.max', price: 170, category: 'Corone' },
      ]
    },
    {
      id: '3',
      name: 'Listino Studio Rossi',
      description: 'Listino personalizzato per Clinica Dentale Rossi',
      isDefault: false,
      clientsCount: 1,
      color: 'bg-card-teal',
      items: []
    },
  ];

  const selectedPriceList = priceLists.find(l => l.id === selectedList);

  const categories = selectedPriceList
    ? [...new Set(selectedPriceList.items.map(i => i.category))]
    : [];

  const filteredItems = selectedPriceList?.items.filter(item =>
    !searchQuery ||
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.material.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const groupedItems = categories.reduce((acc, category) => {
    acc[category] = filteredItems.filter(item => item.category === category);
    return acc;
  }, {} as Record<string, PriceItem[]>);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-neutral-800">{t('priceLists.title')}</h1>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          {t('priceLists.newPriceList')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Price Lists Column */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Listini</h2>

          {priceLists.map((list) => (
            <button
              key={list.id}
              onClick={() => setSelectedList(list.id)}
              className={`w-full text-left card-base p-4 transition-all ${
                selectedList === list.id
                  ? 'ring-2 ring-brand-primary shadow-card-hover'
                  : 'hover:shadow-card-hover'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${list.color} flex items-center justify-center text-white`}>
                  <Euro size={18} />
                </div>
                {list.isDefault && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                    <Star size={12} />
                    Default
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-neutral-800 mb-1">{list.name}</h3>
              <p className="text-sm text-neutral-500 mb-3 line-clamp-2">{list.description}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-neutral-400">
                  <Users size={14} />
                  {list.clientsCount} clienti
                </span>
                <span className="text-neutral-400">
                  {list.items.length} voci
                </span>
              </div>
            </button>
          ))}

          {/* Quick Actions */}
          <div className="card-base p-4 border-dashed border-2 border-neutral-200 bg-transparent">
            <button className="w-full flex items-center justify-center gap-2 text-neutral-500 hover:text-brand-primary transition-colors py-2">
              <Plus size={18} />
              <span className="text-sm font-medium">Nuovo listino</span>
            </button>
          </div>
        </div>

        {/* Price Items Column */}
        <div className="lg:col-span-2">
          {selectedPriceList ? (
            <div className="card-base overflow-hidden">
              {/* List Header */}
              <div className={`${selectedPriceList.color} p-6 text-white`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold mb-1">{selectedPriceList.name}</h2>
                    <p className="text-white/80 text-sm">{selectedPriceList.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                      <Copy size={16} />
                    </button>
                    <button className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                      <Edit size={16} />
                    </button>
                    {!selectedPriceList.isDefault && (
                      <button className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center hover:bg-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-6 mt-4 pt-4 border-t border-white/20">
                  <div>
                    <p className="text-2xl font-bold">{selectedPriceList.items.length}</p>
                    <p className="text-white/70 text-sm">Voci prezzo</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{selectedPriceList.clientsCount}</p>
                    <p className="text-white/70 text-sm">Clienti</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{categories.length}</p>
                    <p className="text-white/70 text-sm">Categorie</p>
                  </div>
                </div>
              </div>

              {/* Search & Add */}
              <div className="p-4 border-b border-neutral-100 flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                  <input
                    type="text"
                    placeholder="Cerca lavorazione o materiale..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-modern pl-10 w-full"
                  />
                </div>
                <button className="px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-medium hover:bg-brand-primary/90 transition-colors flex items-center gap-2">
                  <Plus size={16} />
                  Aggiungi voce
                </button>
              </div>

              {/* Price Items */}
              <div className="max-h-[500px] overflow-y-auto">
                {selectedPriceList.items.length > 0 ? (
                  Object.entries(groupedItems).map(([category, items]) => (
                    items.length > 0 && (
                      <div key={category}>
                        <div className="px-4 py-2 bg-surface-secondary sticky top-0">
                          <h3 className="text-sm font-semibold text-neutral-600">{category}</h3>
                        </div>
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 hover:bg-surface-secondary/50 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-brand-primary" />
                              <div>
                                <p className="font-medium text-neutral-800">{item.name}</p>
                                <p className="text-sm text-neutral-500">{item.material}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-lg font-bold text-neutral-800">
                                €{item.price}
                              </span>
                              <button className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 opacity-0 group-hover:opacity-100 hover:bg-neutral-100 transition-all">
                                <MoreHorizontal size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-surface-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Euro size={28} className="text-neutral-300" />
                    </div>
                    <p className="text-neutral-500 mb-4">Nessuna voce prezzo in questo listino</p>
                    <button className="px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-medium hover:bg-brand-primary/90 transition-colors">
                      Aggiungi prima voce
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card-base p-12 text-center">
              <div className="w-16 h-16 bg-surface-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Euro size={28} className="text-neutral-300" />
              </div>
              <p className="text-neutral-500">Seleziona un listino per vedere i prezzi</p>
            </div>
          )}
        </div>
      </div>

      {/* Materials Legend */}
      <div className="card-base p-6">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Materiali disponibili</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { name: 'Zirconio', color: 'bg-blue-500' },
            { name: 'E.max', color: 'bg-purple-500' },
            { name: 'Metallo-ceramica', color: 'bg-orange-500' },
            { name: 'PMMA', color: 'bg-amber-400' },
            { name: 'Composito', color: 'bg-cyan-500' },
            { name: 'Resina', color: 'bg-pink-500' },
          ].map((material) => (
            <div key={material.name} className="flex items-center gap-2 p-3 bg-surface-secondary rounded-xl">
              <div className={`w-3 h-3 rounded-full ${material.color}`} />
              <span className="text-sm font-medium text-neutral-700">{material.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
