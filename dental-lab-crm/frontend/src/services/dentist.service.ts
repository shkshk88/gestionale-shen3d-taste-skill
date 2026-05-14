import api from './api';

export interface Dentist {
  id: string;
  clientId: string;
  name: string;
  email?: string;
  phone?: string;
  specialization?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDentistDto {
  clientId: string;
  name: string;
  email?: string;
  phone?: string;
  specialization?: string;
  notes?: string;
}

export interface UpdateDentistDto {
  name?: string;
  email?: string;
  phone?: string;
  specialization?: string;
  notes?: string;
  active?: boolean;
}

class DentistService {
  // Get all dentists
  async getDentists(params?: { clientId?: string; search?: string; skip?: number; take?: number }): Promise<Dentist[]> {
    const queryParams = new URLSearchParams();
    if (params?.clientId) queryParams.append('clientId', params.clientId);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.take !== undefined) queryParams.append('take', params.take.toString());

    const url = `/dentists${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<{ data: Dentist[]; total: number }>(url);
    return response.data || [];
  }

  // Get dentist by ID
  async getDentistById(id: string): Promise<Dentist> {
    return api.get<Dentist>(`/dentists/${id}`);
  }

  // Get dentists by client
  async getDentistsByClient(clientId: string): Promise<Dentist[]> {
    return this.getDentists({ clientId });
  }

  // Create new dentist
  async createDentist(data: CreateDentistDto): Promise<Dentist> {
    return api.post<Dentist>('/dentists', data);
  }

  // Update dentist
  async updateDentist(id: string, data: UpdateDentistDto): Promise<Dentist> {
    return api.put<Dentist>(`/dentists/${id}`, data);
  }

  // Delete dentist
  async deleteDentist(id: string): Promise<void> {
    return api.delete<void>(`/dentists/${id}`);
  }
}

const dentistService = new DentistService();
export default dentistService;
