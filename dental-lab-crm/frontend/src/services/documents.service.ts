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

export type PaymentMethod = 1 | 2 | 3 | 4; // 1=Credit, 2=Check, 3=BankTransfer, 4=Cash
export type Invoice4uEnvironment = 'mock' | 'staging' | 'production';

export interface PaymentItem {
  paymentType: PaymentMethod;
  amount: number;
  date: string; // ISO yyyy-mm-dd
  accountNumber?: string;
  bankName?: string;
  branchName?: string;
  paymentNumber?: string;
  expirationDate?: string;
  numberOfPayments?: number;
  payerID?: string;
}

export const TYPES_REQUIRING_PAYMENTS: DocumentType[] = [
  'receipt',
  'receipt_invoice',
  'credit_note',
];

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
  payments: PaymentItem[] | null;
  clientId: string;
  client: {
    id: string;
    studioName: string;
    logoUrl: string | null;
    contactPerson: string | null;
  };
  invoice4uDocumentNumber: number | null;
  invoice4uUniqueId: string | null;
  invoice4uEnvironment: Invoice4uEnvironment | null;
  invoice4uSyncedAt: string | null;
  invoice4uError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice4uStatus {
  mode: string;
  autoSync: boolean;
  dryRun: boolean;
  environment: Invoice4uEnvironment;
  tokenConfigured: boolean;
}

export interface Invoice4uVerifyResult {
  valid: boolean;
  environment: Invoice4uEnvironment;
  user?: {
    email: string;
    firstName?: string;
    lastName?: string;
    organizationId: number;
    organizationCurrency?: string;
    taxRate?: number;
    apiActive?: boolean;
  };
  error?: string;
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

  issue(id: string, body?: { payments?: PaymentItem[] }): Promise<BillingDocument> {
    return api.post<BillingDocument>(`/documents/${id}/issue`, body || {});
  }

  // ============ invoice4u diagnostics ============
  getInvoice4uStatus(): Promise<Invoice4uStatus> {
    return api.get<Invoice4uStatus>('/documents/invoice4u/status');
  }

  verifyInvoice4u(): Promise<Invoice4uVerifyResult> {
    return api.get<Invoice4uVerifyResult>('/documents/invoice4u/verify');
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

  /**
   * Generates a "Report da approvare" PDF for the given cases of a client.
   * Returns a Blob URL that can be opened with window.open() in a new tab.
   * Caller is responsible for URL.revokeObjectURL() after use.
   */
  async generatePreviewReport(input: {
    clientId: string;
    caseIds: string[];
  }): Promise<string> {
    const response = await api
      .getAxiosInstance()
      .post('/documents/preview-report', input, {
        responseType: 'blob',
      });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  }
}

export default new DocumentsService();
