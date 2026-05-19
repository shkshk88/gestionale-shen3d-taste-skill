import api from './api';

export interface Case {
  id: string;
  caseNumber: string;
  clientId: string;
  dentistId?: string;
  patientName?: string;
  patientNotes?: string;
  status: 'received' | 'in_progress' | 'qc' | 'shipped' | 'delivered';
  priority: 'normal' | 'urgent' | 'rush';
  receivedDate: string;
  dueDate?: string;
  shippedDate?: string;
  totalPrice?: number;
  notesInternal?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    studioName: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
  };
  dentist?: {
    id: string;
    name: string;
    specialization?: string;
  };
  teeth?: CaseTooth[];
  files?: CaseFile[];
  messages?: CaseMessage[];
  timeline?: CaseTimeline[];
  _count?: {
    messages: number;
  };
}

export interface CaseTooth {
  id: string;
  caseId: string;
  toothNumber: number;
  workType: string;
  material: string;
  vitaColor?: string;
  unitPrice?: number;
  notes?: string;
  createdAt: string;
}

export interface CaseFile {
  id: string;
  caseId: string;
  fileName: string;
  filePath: string;
  fileType: 'image' | 'stl' | 'ply' | 'other';
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  isDeleted: boolean;
}

export interface CaseMessage {
  id: string;
  caseId: string;
  senderId: string;
  messageText: string;
  messageType: 'text' | 'file' | 'annotation';
  fileId?: string;
  annotationData?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  file?: CaseFile;
}

export interface CaseTimeline {
  id: string;
  caseId: string;
  eventType: 'created' | 'status_changed' | 'note_added' | 'message_sent' | 'file_uploaded';
  eventData: string;
  userId?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
  };
}

export interface CreateCaseDto {
  clientId: string;
  dentistId?: string;
  patientName?: string;
  patientNotes?: string;
  priority?: 'normal' | 'urgent' | 'rush';
  dueDate?: string;
  teeth: Array<{
    toothNumber: number;
    workType: string;
    material: string;
    vitaColor?: string;
    unitPrice?: number;
  }>;
  notesInternal?: string;
}

export interface UpdateCaseDto {
  clientId?: string;
  patientName?: string;
  patientNotes?: string;
  status?: 'received' | 'in_progress' | 'qc' | 'shipped' | 'delivered';
  priority?: 'normal' | 'urgent' | 'rush';
  dueDate?: string;
  totalPrice?: number;
  notesInternal?: string;
  teeth?: Array<{
    toothNumber: number;
    workType: string;
    material: string;
    vitaColor?: string;
    unitPrice?: number;
  }>;
}

export interface CaseListParams {
  skip?: number;
  take?: number;
  status?: string;
  clientId?: string;
  priority?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CaseStatistics {
  todayDeliveries: number;
  inProgress: number;
  inQC: number;
  received: number;
}

class CaseService {
  // Get all cases
  async getCases(params?: CaseListParams): Promise<Case[]> {
    const queryParams = new URLSearchParams();
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.take) queryParams.append('take', params.take.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.clientId) queryParams.append('clientId', params.clientId);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = `/cases${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<{ data: Case[]; total: number }>(url);
    return response.data;
  }

  // Get case by ID
  async getCaseById(id: string): Promise<Case> {
    return api.get<Case>(`/cases/${id}`);
  }

  // Get case by case number
  async getCaseByCaseNumber(caseNumber: string): Promise<Case> {
    return api.get<Case>(`/cases/number/${caseNumber}`);
  }

  // Create new case
  async createCase(data: CreateCaseDto): Promise<Case> {
    return api.post<Case>('/cases', data);
  }

  // Update case
  async updateCase(id: string, data: UpdateCaseDto): Promise<Case> {
    return api.patch<Case>(`/cases/${id}`, data);
  }

  // Update case status
  async updateCaseStatus(id: string, status: Case['status']): Promise<Case> {
    return api.patch<Case>(`/cases/${id}/status`, { status });
  }

  // Delete case
  async deleteCase(id: string): Promise<void> {
    return api.delete<void>(`/cases/${id}`);
  }

  // Get case statistics
  async getStatistics(): Promise<CaseStatistics> {
    return api.get<CaseStatistics>('/cases/stats/summary');
  }

  // Upload files to case
  async uploadFiles(
    caseId: string,
    files: File[],
    onProgress?: (progress: number) => void
  ): Promise<CaseFile[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    return api.post<CaseFile[]>(`/files/upload-multiple/${caseId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
  }

  // Get case files
  async getCaseFiles(caseId: string): Promise<CaseFile[]> {
    return api.get<CaseFile[]>(`/files/case/${caseId}`);
  }

  // Delete case file
  async deleteCaseFile(caseId: string, fileId: string): Promise<void> {
    return api.delete<void>(`/cases/${caseId}/files/${fileId}`);
  }

  // Send message
  async sendMessage(
    caseId: string,
    messageText: string,
    fileId?: string
  ): Promise<CaseMessage> {
    return api.post<CaseMessage>(`/cases/${caseId}/messages`, {
      messageText,
      fileId,
    });
  }

  // Get case messages
  async getCaseMessages(caseId: string): Promise<CaseMessage[]> {
    return api.get<CaseMessage[]>(`/cases/${caseId}/messages`);
  }

  // Mark messages as read
  async markMessagesAsRead(caseId: string): Promise<void> {
    return api.post<void>(`/cases/${caseId}/messages/mark-read`);
  }
}

const caseService = new CaseService();
export default caseService;
