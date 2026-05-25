import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  Invoice4uClient,
  Invoice4uCustomerInput,
  Invoice4uCustomerResult,
  Invoice4uDocumentInput,
  Invoice4uDocumentResult,
  Invoice4uVerifyResult,
} from './invoice4u.types';

/**
 * Mock implementation of invoice4u client.
 *
 * - Generates plausible fake data: sequential document numbers from 1000+,
 *   random customer IDs, real UUIDs for uniqueId.
 * - Simulates small network latency (~200-300ms) so the UX feels realistic.
 * - Logs every operation with 🧪 prefix.
 *
 * Used when INVOICE4U_MODE=mock. Switch to SoapInvoice4uClient by setting
 * INVOICE4U_MODE=staging|production + INVOICE4U_TOKEN.
 */
@Injectable()
export class MockInvoice4uClient implements Invoice4uClient {
  readonly environment = 'mock' as const;
  private readonly logger = new Logger('MockInvoice4u');
  private static nextDocumentNumber = 1000;
  private static knownCustomers = new Map<string, number>();

  async verifyConnection(): Promise<Invoice4uVerifyResult> {
    await this.delay(150);
    this.logger.log('🧪 verifyConnection: mock OK');
    return {
      valid: true,
      environment: 'mock',
      user: {
        email: 'mock@invoice4u.local',
        firstName: 'Mock',
        lastName: 'User',
        organizationId: 99999,
        organizationCurrency: 'ILS',
        taxRate: 18,
        apiActive: true,
      },
    };
  }

  async syncCustomer(
    input: Invoice4uCustomerInput,
    existingCustomerId?: number | null,
  ): Promise<Invoice4uCustomerResult> {
    await this.delay(180);

    if (existingCustomerId) {
      this.logger.log(
        `🧪 syncCustomer: re-using existing customer #${existingCustomerId} for "${input.studioName}"`,
      );
      return { customerId: existingCustomerId, isNew: false };
    }

    const cached = MockInvoice4uClient.knownCustomers.get(input.studioName);
    if (cached) {
      this.logger.log(
        `🧪 syncCustomer: found cached fake customer #${cached} for "${input.studioName}"`,
      );
      return { customerId: cached, isNew: false };
    }

    const customerId = 10000 + Math.floor(Math.random() * 89999);
    MockInvoice4uClient.knownCustomers.set(input.studioName, customerId);
    this.logger.log(
      `🧪 syncCustomer: created fake customer #${customerId} for "${input.studioName}" (email=${input.email || '-'}, vat=${input.vatNumber || '-'})`,
    );
    return { customerId, isNew: true };
  }

  async createDocument(input: Invoice4uDocumentInput): Promise<Invoice4uDocumentResult> {
    await this.delay(280);

    const documentNumber = MockInvoice4uClient.nextDocumentNumber++;
    const uniqueId = randomUUID();
    const itemsTotal = input.items.reduce((s, i) => s + i.total, 0);
    const paymentsTotal = (input.payments || []).reduce((s, p) => s + p.amount, 0);

    this.logger.log(
      `🧪 createDocument: #${documentNumber} type=${input.documentType} customer=${input.customerId} items=${input.items.length} total=${itemsTotal.toFixed(2)} ${input.currency}`,
    );
    if (input.payments && input.payments.length > 0) {
      this.logger.log(
        `🧪   payments: ${input.payments.length} entries summing to ${paymentsTotal.toFixed(2)} ${input.currency}`,
      );
      for (const p of input.payments) {
        const typeName = (
          { 1: 'Credit', 2: 'Check', 3: 'BankTransfer', 4: 'Cash' } as Record<number, string>
        )[p.paymentType];
        this.logger.log(`🧪     - ${typeName}: ${p.amount.toFixed(2)} on ${p.date}`);
      }
    }
    if (input.associatedEmails && input.associatedEmails.length > 0) {
      this.logger.log(
        `🧪   emails: ${input.associatedEmails.map((e) => `${e.mail}${e.isUserMail ? '(user)' : '(client)'}`).join(', ')}`,
      );
    }
    this.logger.debug(`🧪 uniqueId=${uniqueId} apiId=${input.apiIdentifier}`);

    const taxAmount = input.taxIncluded
      ? +(itemsTotal - itemsTotal / (1 + input.taxRate / 100)).toFixed(2)
      : +((itemsTotal * input.taxRate) / 100).toFixed(2);

    return {
      documentNumber,
      uniqueId,
      documentType: input.documentType,
      syncedAt: new Date(),
      environment: 'mock',
      total: itemsTotal,
      totalTaxAmount: taxAmount,
      totalWithoutTax: +(itemsTotal - taxAmount).toFixed(2),
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
