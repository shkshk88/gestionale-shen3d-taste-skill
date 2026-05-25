/**
 * Type contracts for invoice4u SOAP API integration.
 *
 * Two implementations of Invoice4uClient:
 *  - MockInvoice4uClient  → returns fake data, no network calls
 *  - SoapInvoice4uClient  → real SOAP calls to apiqa.invoice4u.co.il (staging)
 *                            or api.invoice4u.co.il (production)
 *
 * Switch via env: INVOICE4U_MODE = mock | staging | production
 */

export type Invoice4uEnvironment = 'mock' | 'staging' | 'production';

export interface Invoice4uCustomerInput {
  studioName: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  vatNumber?: string | null;   // Ch.P. / Teudat Zehut — maps to UniqueID in invoice4u
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  payTerms?: number | null;    // days
}

export interface Invoice4uCustomerResult {
  customerId: number;
  isNew: boolean;
}

export interface Invoice4uDocumentItemInput {
  code?: string | null;
  name: string;
  qty: number;
  unitPrice: number;
  total: number;
}

/**
 * Payment matches invoice4u Payment object structure.
 * Required for DocumentType ∈ {2 Receipt, 3 CreditNote, 4 ReceiptInvoice}.
 * Sum of payments[].amount must equal document total.
 */
export type PaymentType = 1 | 2 | 3 | 4; // 1=Credit, 2=Check, 3=BankTransfer, 4=Cash

export interface Invoice4uPaymentInput {
  paymentType: PaymentType;
  amount: number;
  date: string;                // ISO yyyy-mm-dd
  // For Check / BankTransfer
  accountNumber?: string | null;
  bankName?: string | null;
  branchName?: string | null;
  paymentNumber?: string | null;   // check number or last 4 digits of credit card
  // For Credit only
  expirationDate?: string | null;  // MM/YY
  numberOfPayments?: number | null;
  payerID?: string | null;
}

export interface Invoice4uAssociatedEmailInput {
  mail: string;
  isUserMail: boolean;     // true = user's lab email, false = customer email
}

export interface Invoice4uDocumentInput {
  apiIdentifier: string;       // our UUID, sent to invoice4u for idempotency
  documentType: number;        // invoice4u numeric document type (DocumentType enum)
  customerId: number;          // returned by syncCustomer
  items: Invoice4uDocumentItemInput[];
  taxRate: number;             // percent, e.g. 18
  taxIncluded: boolean;        // true = total includes VAT, false = VAT added on top
  currency: string;            // 'ILS'
  subject?: string | null;
  notes?: string | null;
  dueDate?: Date | null;
  issueDate?: Date | null;
  payments?: Invoice4uPaymentInput[];               // required for Receipt/CreditNote/ReceiptInvoice
  associatedEmails?: Invoice4uAssociatedEmailInput[]; // who receives the document via email
}

export interface Invoice4uDocumentResult {
  documentNumber: number;      // invoice4u official fiscal number
  uniqueId: string;            // UUID for newview.invoice4u.co.il/Views/PDF.aspx?docid=
  documentType: number;
  syncedAt: Date;
  environment: Invoice4uEnvironment;
  total?: number;              // returned by invoice4u (sanity check)
  totalTaxAmount?: number;
  totalWithoutTax?: number;
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

/**
 * Implementation contract — both mock and real SOAP client must satisfy this.
 */
export interface Invoice4uClient {
  /** Quick health-check: validates token + returns user info from invoice4u. */
  verifyConnection(): Promise<Invoice4uVerifyResult>;

  /** Create or update customer on invoice4u. Returns invoice4u customer ID. */
  syncCustomer(
    input: Invoice4uCustomerInput,
    existingCustomerId?: number | null,
  ): Promise<Invoice4uCustomerResult>;

  /** Create a fiscal document on invoice4u. Returns the official fiscal number + uniqueId. */
  createDocument(input: Invoice4uDocumentInput): Promise<Invoice4uDocumentResult>;

  /** Which environment this client targets (for UI badge). */
  readonly environment: Invoice4uEnvironment;
}

/**
 * Mapping from our local DocumentType to invoice4u numeric document types.
 * VERIFIED against the official invoice4u DocumentType enum (see skill `invoice4u api`).
 */
export const TYPE_TO_INVOICE4U_TYPE: Record<string, number> = {
  price_quote: 10,       // PriceQuote (Hatza'at Mehir / הצעת מחיר)
  invoice_order: 6,      // InvoiceOrder (Hashbonit Iska / חשבונית עסקה)
  tax_invoice: 1,        // Invoice (Hashbonit Mas / חשבונית מס) — NO GeneralCustomer
  receipt: 2,            // Receipt (Kabala / קבלה) — needs Payments[]
  receipt_invoice: 4,    // ReceiptInvoice (Hashbonit Mas/Kabala / חשבונית מס/קבלה) — needs Payments[]
  credit_note: 3,        // CreditNote (Zikui / חשבונית זיכוי) — needs Payments[]
};

/** Document types that require Payments[] array (invoice4u rejects if missing). */
export const TYPES_REQUIRING_PAYMENTS = new Set(['receipt', 'receipt_invoice', 'credit_note']);

export const INVOICE4U_CLIENT_TOKEN = 'INVOICE4U_CLIENT';
