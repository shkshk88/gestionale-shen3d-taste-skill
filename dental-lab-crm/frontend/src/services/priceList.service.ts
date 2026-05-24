import api from './api';

export type WorkType =
  | 'corona'
  | 'protesi'
  | 'impianto'
  | 'bite'
  | 'maryland'
  | 'intarsio'
  | 'faccetta'
  | 'altro';

export type Material =
  | 'ZR'
  | 'EMAX'
  | 'PMMA'
  | 'RES'
  | 'CR_CO'
  | 'CERAM'
  | 'COMP'
  | 'ALT';

export interface PriceListItem {
  id: string;
  priceListId: string;
  workType: WorkType;
  material: Material;
  unitPrice: number;
  updatedAt: string;
}

export interface PriceList {
  id: string;
  listName: string;
  description: string | null;
  isDefault: boolean;
  validFrom: string | null;
  validTo: string | null;
  createdAt: string;
  updatedAt: string;
  items: PriceListItem[];
  _count?: { clients: number };
}

export interface CreatePriceListPayload {
  listName: string;
  description?: string;
  isDefault?: boolean;
}

export interface UpdatePriceListPayload {
  listName?: string;
  description?: string | null;
  isDefault?: boolean;
}

class PriceListService {
  list(): Promise<PriceList[]> {
    return api.get<PriceList[]>('/price-lists');
  }

  get(id: string): Promise<PriceList> {
    return api.get<PriceList>(`/price-lists/${id}`);
  }

  create(payload: CreatePriceListPayload): Promise<PriceList> {
    return api.post<PriceList>('/price-lists', payload);
  }

  update(id: string, payload: UpdatePriceListPayload): Promise<PriceList> {
    return api.put<PriceList>(`/price-lists/${id}`, payload);
  }

  remove(id: string): Promise<PriceList> {
    return api.delete<PriceList>(`/price-lists/${id}`);
  }

  // Upserts a batch of items. Use for both add and edit.
  upsertItems(
    listId: string,
    items: { workType: WorkType; material: Material; unitPrice: number }[],
  ): Promise<PriceListItem[]> {
    return api.put<PriceListItem[]>(`/price-lists/${listId}/items`, items);
  }

  removeItem(listId: string, itemId: string): Promise<PriceListItem> {
    return api.delete<PriceListItem>(`/price-lists/${listId}/items/${itemId}`);
  }
}

export const WORK_TYPES: { code: WorkType; label: string }[] = [
  { code: 'corona', label: 'Corona' },
  { code: 'faccetta', label: 'Faccetta' },
  { code: 'intarsio', label: 'Intarsio' },
  { code: 'maryland', label: 'Maryland' },
  { code: 'protesi', label: 'Protesi' },
  { code: 'impianto', label: 'Impianto' },
  { code: 'bite', label: 'Bite' },
  { code: 'altro', label: 'Altro' },
];

export const MATERIALS: { code: Material; label: string; color: string }[] = [
  { code: 'ZR', label: 'Zirconio', color: 'bg-blue-500' },
  { code: 'EMAX', label: 'E.max', color: 'bg-purple-500' },
  { code: 'CERAM', label: 'Ceramica', color: 'bg-orange-500' },
  { code: 'CR_CO', label: 'CrCo', color: 'bg-slate-500' },
  { code: 'COMP', label: 'Composito', color: 'bg-cyan-500' },
  { code: 'PMMA', label: 'PMMA', color: 'bg-amber-400' },
  { code: 'RES', label: 'Resina', color: 'bg-pink-500' },
  { code: 'ALT', label: 'Altro', color: 'bg-neutral-400' },
];

export default new PriceListService();
