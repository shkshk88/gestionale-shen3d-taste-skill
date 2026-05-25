import { Injectable, Logger } from '@nestjs/common';
// @ts-ignore — `soap` ships its own types in d.ts, but they're inconsistent across versions
import * as soap from 'soap';
import {
  Invoice4uClient,
  Invoice4uCustomerInput,
  Invoice4uCustomerResult,
  Invoice4uDocumentInput,
  Invoice4uDocumentResult,
  Invoice4uEnvironment,
  Invoice4uVerifyResult,
} from './invoice4u.types';

/**
 * Real SOAP implementation of Invoice4uClient.
 *
 * Talks to:
 *   - Staging:    https://apiqa.invoice4u.co.il/Services/ApiService.svc?singleWsdl
 *   - Production: https://api.invoice4u.co.il/Services/ApiService.svc?singleWsdl
 *
 * Auth: GUID token passed in every call (no session). One token per account.
 *
 * Key invoice4u quirks handled:
 *  - Errors are inside the response body (`result.Errors[]`) even on HTTP 200
 *  - All requests use PascalCase field names (not camelCase)
 *  - Hebrew characters: UTF-8 (soap lib handles automatically)
 *  - OrganizationID needed for Customer — fetched lazily via IsAuthenticated
 *  - DRY_RUN=true → builds request but doesn't send (logs only)
 *
 * Lazy initialization: createClientAsync(WSDL) on first call, then cached.
 */
@Injectable()
export class SoapInvoice4uClient implements Invoice4uClient {
  private readonly logger: Logger;
  private clientPromise: Promise<any> | null = null;
  private cachedUser: {
    email: string;
    firstName?: string;
    lastName?: string;
    organizationId: number;
    organizationCurrency?: string;
    taxRate?: number;
    apiActive?: boolean;
  } | null = null;

  constructor(
    private readonly wsdlUrl: string,
    private readonly token: string,
    readonly environment: Invoice4uEnvironment,
    private readonly dryRun: boolean = false,
  ) {
    this.logger = new Logger(`SoapInvoice4u[${environment}${dryRun ? '/dry-run' : ''}]`);
    if (!token) {
      this.logger.warn(
        'INVOICE4U_TOKEN is empty — every call will fail until you set it in .env.production',
      );
    }
  }

  // ============== Lazy WSDL client init ==============
  private async getClient(): Promise<any> {
    if (!this.clientPromise) {
      this.logger.log(`Initializing SOAP client from WSDL: ${this.wsdlUrl}`);
      this.clientPromise = soap
        .createClientAsync(this.wsdlUrl, { wsdl_options: { timeout: 15000 } })
        .then((client: any) => {
          this.logger.log(`SOAP client ready (${Object.keys(client.describe() || {}).length} services)`);
          return client;
        })
        .catch((err: any) => {
          this.clientPromise = null;
          this.logger.error(`SOAP client init failed: ${err.message}`);
          throw err;
        });
    }
    return this.clientPromise;
  }

  // ============== verifyConnection ==============
  async verifyConnection(): Promise<Invoice4uVerifyResult> {
    try {
      const client = await this.getClient();
      const [result] = await client.IsAuthenticatedAsync({ token: this.token });
      const user = result?.IsAuthenticatedResult;
      if (!user || !user.Email) {
        return {
          valid: false,
          environment: this.environment,
          error: 'Token rifiutato da invoice4u (IsAuthenticated ha ritornato user vuoto)',
        };
      }

      this.cachedUser = {
        email: user.Email,
        firstName: user.FirstName,
        lastName: user.LastName,
        organizationId: parseInt(user.OrganizationID, 10),
        organizationCurrency: user.OrganizationCurrency,
        taxRate: user.TaxRate ? parseFloat(user.TaxRate) : undefined,
        apiActive: user.ApiActive === 'true' || user.ApiActive === true,
      };

      this.logger.log(
        `verifyConnection OK: ${user.Email} (orgId=${this.cachedUser.organizationId})`,
      );
      return { valid: true, environment: this.environment, user: this.cachedUser };
    } catch (err: any) {
      const msg = err?.message || String(err);
      this.logger.error(`verifyConnection failed: ${msg}`);
      return { valid: false, environment: this.environment, error: msg };
    }
  }

  // ============== syncCustomer ==============
  async syncCustomer(
    input: Invoice4uCustomerInput,
    existingCustomerId?: number | null,
  ): Promise<Invoice4uCustomerResult> {
    const orgId = await this.getOrgId();

    // Build Customer SOAP object (PascalCase!)
    const cu: any = {
      Name: input.studioName,
      Email: input.email || '',
      Phone: input.phone || '',
      Address: input.address || '',
      City: input.city || '',
      Zip: input.postalCode || '',
      UniqueID: input.vatNumber || '',
      OrgID: orgId,
      PayTerms: input.payTerms ?? 30,
      Cell: input.phone || '',
      Active: true,
    };

    if (existingCustomerId) {
      cu.ID = existingCustomerId;
      this.logger.log(`syncCustomer: updating existing #${existingCustomerId}`);
    }

    if (this.dryRun) {
      this.logger.warn(`[DRY-RUN] would call CreateCustomer with: ${JSON.stringify(cu)}`);
      return { customerId: existingCustomerId || -1, isNew: !existingCustomerId };
    }

    const client = await this.getClient();
    const [result] = await client.CreateCustomerAsync({ cu, token: this.token });
    const customer = result?.CreateCustomerResult;
    this.assertNoErrors(customer, 'CreateCustomer');

    const customerId = parseInt(customer.ID, 10);
    if (!customerId) {
      throw new Error(`CreateCustomer returned invalid ID: ${customer.ID}`);
    }
    this.logger.log(
      `syncCustomer: ${existingCustomerId ? 'updated' : 'created'} customer #${customerId} for "${input.studioName}"`,
    );
    return { customerId, isNew: !existingCustomerId };
  }

  // ============== createDocument ==============
  async createDocument(input: Invoice4uDocumentInput): Promise<Invoice4uDocumentResult> {
    // Build Items array
    const items = input.items.map((it) => ({
      Code: it.code || '',
      Name: it.name,
      Price: it.unitPrice,
      Quantity: it.qty,
    }));

    // Build Payments array (if provided)
    const payments = (input.payments || []).map((p) => {
      const base: any = {
        Amount: p.amount,
        PaymentType: p.paymentType,
        Date: p.date,
      };
      if (p.accountNumber) base.AccountNumber = p.accountNumber;
      if (p.bankName) base.BankName = p.bankName;
      if (p.branchName) base.BranchName = p.branchName;
      if (p.paymentNumber) base.PaymentNumber = p.paymentNumber;
      if (p.expirationDate) base.ExpirationDate = p.expirationDate;
      if (p.numberOfPayments) base.NumberOfPayments = p.numberOfPayments;
      if (p.payerID) base.PayerID = p.payerID;
      return base;
    });

    // Build AssociatedEmails array (controls who invoice4u emails the PDF to)
    const associatedEmails = (input.associatedEmails || []).map((e) => ({
      Mail: e.mail,
      IsUserMail: e.isUserMail,
    }));

    // Build Document SOAP object
    const doc: any = {
      ClientID: input.customerId,
      DocumentType: input.documentType,
      Subject: input.subject || '',
      Currency: input.currency,
      RoundAmount: 0,
      TaxPercentage: input.taxRate,
      TaxIncluded: input.taxIncluded,
      ApiIdentifier: input.apiIdentifier,
      Items: items,
    };
    if (payments.length > 0) doc.Payments = payments;
    if (associatedEmails.length > 0) doc.AssociatedEmails = associatedEmails;

    if (this.dryRun) {
      this.logger.warn(`[DRY-RUN] would call CreateDocument with: ${JSON.stringify(doc, null, 2)}`);
      return {
        documentNumber: -1,
        uniqueId: 'dry-run',
        documentType: input.documentType,
        syncedAt: new Date(),
        environment: this.environment,
      };
    }

    this.logger.log(
      `createDocument: type=${input.documentType} customer=${input.customerId} items=${items.length} payments=${payments.length}`,
    );

    const client = await this.getClient();
    const [result] = await client.CreateDocumentAsync({ doc, token: this.token });
    const document = result?.CreateDocumentResult;
    this.assertNoErrors(document, 'CreateDocument');

    const docNum = parseInt(document.DocumentNumber, 10);
    const uniqueId = document.UniqueID || document.UniqueId; // invoice4u inconsistency
    if (!docNum || !uniqueId) {
      throw new Error(
        `CreateDocument returned invalid response: number=${document.DocumentNumber} uniqueId=${uniqueId}`,
      );
    }
    this.logger.log(
      `createDocument OK: #${docNum} (${uniqueId}) type=${input.documentType}`,
    );

    return {
      documentNumber: docNum,
      uniqueId,
      documentType: input.documentType,
      syncedAt: new Date(),
      environment: this.environment,
      total: document.Total ? parseFloat(document.Total) : undefined,
      totalTaxAmount: document.TotalTaxAmount
        ? parseFloat(document.TotalTaxAmount)
        : undefined,
      totalWithoutTax: document.TotalWithOutTax
        ? parseFloat(document.TotalWithOutTax)
        : undefined,
    };
  }

  // ============== Helpers ==============

  /** invoice4u puts business errors INSIDE the response body even on HTTP 200. */
  private assertNoErrors(response: any, operation: string): void {
    if (!response) {
      throw new Error(`${operation}: empty response from invoice4u`);
    }
    const errors = response.Errors;
    if (errors && Array.isArray(errors) && errors.length > 0) {
      const messages = errors
        .map((e: any) => e?.Description || e?.Message || JSON.stringify(e))
        .join('; ');
      throw new Error(`${operation} rejected by invoice4u: ${messages}`);
    }
    // Some responses wrap errors in Errors.Error[] instead of direct array
    if (errors?.Error && Array.isArray(errors.Error) && errors.Error.length > 0) {
      const messages = errors.Error
        .map((e: any) => e?.Description || e?.Message || JSON.stringify(e))
        .join('; ');
      throw new Error(`${operation} rejected by invoice4u: ${messages}`);
    }
  }

  private async getOrgId(): Promise<number> {
    if (this.cachedUser?.organizationId) return this.cachedUser.organizationId;
    const verify = await this.verifyConnection();
    if (!verify.valid || !verify.user) {
      throw new Error(
        `Cannot proceed: invoice4u token invalid (${verify.error || 'unknown'})`,
      );
    }
    return verify.user.organizationId;
  }
}
