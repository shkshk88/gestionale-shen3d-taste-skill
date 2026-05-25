import api from './api';

export type DocumentType =
  | 'price_quote'
  | 'invoice_order'
  | 'tax_invoice'
  | 'receipt'
  | 'receipt_invoice'
  | 'credit_note';

export type DocumentStatus = 'draft' | 'issued' | 'paid' | 'cancelled' | 'error';

export interface DocumentItem {
  code?: string | null;
  name: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface BillingDocument {
  id: string;
  type: DocumentType;
  status: DocumentStatus;
  documentNumber: string | null;
  subject: string | null;
  notes: string | null;
  issueDate: string | null;
  dueDate: string | null;
  subtotal: string;
  taxAmount: string;
  taxRate: number;
  total: string;
  currency: string;
  caseIds: string[];
  items: DocumentItem[];
  clientId: string;
  client: {
    id: string;
    studioName: string;
    logoUrl: string | null;
    contactPerson: string | null;
  };
  invoice4uUniqueId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFromCasesInput {
  clientId: string;
  caseIds: string[];
  type: DocumentType;
  taxRate?: number;
  subject?: string;
  notes?: string;
  dueDate?: string;
}

export interface UpdateDocumentInput {
  subject?: string;
  notes?: string;
  dueDate?: string | null;
  taxRate?: number;
  items?: DocumentItem[];
}

export interface ListDocumentsQuery {
  type?: DocumentType;
  clientId?: string;
  status?: DocumentStatus;
  from?: string;
  to?: string;
  skip?: number;
  take?: number;
}

const PDF_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000/api';

class DocumentsService {
  list(query?: ListDocumentsQuery): Promise<BillingDocument[]> {
    return api.get<BillingDocument[]>('/documents', { params: query });
  }

  findOne(id: string): Promise<BillingDocument> {
    return api.get<BillingDocument>(`/documents/${id}`);
  }

  createFromCases(input: CreateFromCasesInput): Promise<BillingDocument> {
    return api.post<BillingDocument>('/documents/from-cases', input);
  }

  update(id: string, input: UpdateDocumentInput): Promise<BillingDocument> {
    return api.patch<BillingDocument>(`/documents/${id}`, input);
  }

  issue(id: string): Promise<BillingDocument> {
    return api.post<BillingDocument>(`/documents/${id}/issue`, {});
  }

  cancel(id: string): Promise<BillingDocument> {
    return api.post<BillingDocument>(`/documents/${id}/cancel`, {});
  }

  remove(id: string): Promise<void> {
    return api.delete<void>(`/documents/${id}`);
  }

  getPdfUrl(id: string): string {
    return `${PDF_BASE}/documents/${id}/pdf`;
  }
}

export default new DocumentsService();
