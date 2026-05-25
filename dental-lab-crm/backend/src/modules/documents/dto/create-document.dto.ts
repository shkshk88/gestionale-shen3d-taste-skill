export type DocumentType =
  | 'price_quote'
  | 'invoice_order'
  | 'tax_invoice'
  | 'receipt'
  | 'receipt_invoice'
  | 'credit_note';

export const DOCUMENT_TYPES: DocumentType[] = [
  'price_quote',
  'invoice_order',
  'tax_invoice',
  'receipt',
  'receipt_invoice',
  'credit_note',
];

export interface DocumentItem {
  code?: string | null;
  name: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface CreateFromCasesDto {
  clientId: string;
  caseIds: string[];
  type: DocumentType;
  /** override del taxRate da SystemSettings (es. 17 o 18) */
  taxRate?: number;
  /** sostituisce il subject auto-generato */
  subject?: string;
  notes?: string;
  dueDate?: string; // ISO yyyy-mm-dd
}

export interface UpdateDocumentDto {
  subject?: string;
  notes?: string;
  dueDate?: string | null;
  taxRate?: number;
  items?: DocumentItem[];
}

export interface PaymentItem {
  paymentType: 1 | 2 | 3 | 4; // 1=Credit, 2=Check, 3=BankTransfer, 4=Cash
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

export interface IssueDocumentDto {
  /** Required for tipo ∈ {receipt, receipt_invoice, credit_note}. Sum must equal doc.total. */
  payments?: PaymentItem[];
}

export interface ListDocumentsQuery {
  type?: DocumentType;
  clientId?: string;
  status?: 'draft' | 'issued' | 'paid' | 'cancelled' | 'error';
  from?: string; // ISO
  to?: string;
  skip?: number;
  take?: number;
}
