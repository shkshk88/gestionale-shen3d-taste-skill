import api from './api';

export interface Client {
  id: string;
  studioName: string;
  contactPerson?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  vatNumber?: string;
  taxCode?: string;
  priceListId?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  priceList?: {
    id: string;
    listName: string;
  };
  _count?: {
    cases: number;
    users: number;
  };
}

export interface CreateClientDto {
  studioName: string;
  contactPerson?: string;
  email?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  whatsapp?: string;
  vatNumber?: string;
  taxCode?: string;
  priceListId?: string;
  notes?: string;
}

export interface UpdateClientDto {
  studioName?: string;
  contactPerson?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  vatNumber?: string;
  taxCode?: string;
  priceListId?: string;
  notes?: string;
  active?: boolean;
}

export interface ClientListParams {
  skip?: number;
  take?: number;
  search?: string;
  active?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class ClientService {
  // Get all clients
  async getClients(params?: ClientListParams): Promise<Client[]> {
    const queryParams = new URLSearchParams();
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.take) queryParams.append('take', params.take.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.active !== undefined) queryParams.append('active', params.active.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = `/clients${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<{ data: Client[]; total: number }>(url);
    return response.data;
  }

  // Get client by ID
  async getClientById(id: string): Promise<Client> {
    return api.get<Client>(`/clients/${id}`);
  }

  // Create new client
  async createClient(data: CreateClientDto): Promise<Client> {
    return api.post<Client>('/clients', data);
  }

  // Update client
  async updateClient(id: string, data: UpdateClientDto): Promise<Client> {
    return api.put<Client>(`/clients/${id}`, data);
  }

  // Delete client (soft delete)
  async deleteClient(id: string): Promise<void> {
    return api.delete<void>(`/clients/${id}`);
  }

  // Get client cases
  async getClientCases(clientId: string): Promise<any[]> {
    return api.get<any[]>(`/clients/${clientId}/cases`);
  }

  // Get client statistics
  async getClientStatistics(clientId: string): Promise<any> {
    return api.get<any>(`/clients/${clientId}/statistics`);
  }
}

const clientService = new ClientService();
export default clientService;
