import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateFromCasesDto,
  DocumentItem,
  DocumentType,
  ListDocumentsQuery,
  UpdateDocumentDto,
} from './dto/create-document.dto';

const TYPE_TO_PREFIX: Record<DocumentType, string> = {
  price_quote: 'PRV',
  invoice_order: 'ISK',
  tax_invoice: 'MAS',
  receipt: 'KAB',
  receipt_invoice: 'MK',
  credit_note: 'ZKU',
};

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============ Create from cases ============
  async createFromCases(input: CreateFromCasesDto, userId: string) {
    if (!input.caseIds?.length) {
      throw new BadRequestException('caseIds richiesto');
    }

    const cases = await this.prisma.case.findMany({
      where: {
        id: { in: input.caseIds },
        clientId: input.clientId,
      },
      include: { teeth: true },
    });

    if (cases.length === 0) {
      throw new BadRequestException(
        'Nessun caso trovato (verifica clientId e caseIds)',
      );
    }

    // Build items from CaseTooth
    const items: DocumentItem[] = [];
    let subtotal = 0;

    for (const c of cases) {
      for (const t of c.teeth) {
        const price = t.unitPrice ?? 0;
        const itemTotal = price * 1;
        subtotal += itemTotal;
        items.push({
          code: `${c.caseNumber}-${t.toothNumber}`,
          name: `Caso ${c.caseNumber} — Dente ${t.toothNumber} (${t.workType}/${t.material}${
            t.vitaColor ? ` ${t.vitaColor}` : ''
          })`,
          qty: 1,
          unitPrice: price,
          total: itemTotal,
        });
      }
    }

    const taxRate = input.taxRate ?? (await this.getDefaultTaxRate());
    // TaxIncluded = true: subtotal IS the final total, tax derived backwards
    const total = subtotal;
    const taxAmount = +(total - total / (1 + taxRate / 100)).toFixed(2);

    const subject =
      input.subject ??
      this.autoSubject(cases.map((c) => c.caseNumber), cases[0]?.patientName);

    const doc = await this.prisma.document.create({
      data: {
        type: input.type,
        status: 'draft',
        clientId: input.clientId,
        caseIds: input.caseIds,
        subject,
        notes: input.notes,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        subtotal: subtotal.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        taxRate,
        taxIncluded: true,
        total: total.toFixed(2),
        currency: 'ILS',
        items: items as any,
        createdBy: userId,
      },
      include: { client: true },
    });

    return doc;
  }

  // ============ Update draft ============
  async update(id: string, input: UpdateDocumentDto) {
    const existing = await this.prisma.document.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Documento non trovato');
    if (existing.status !== 'draft') {
      throw new BadRequestException('Solo i documenti in bozza sono modificabili');
    }

    const data: any = {};
    if (input.subject !== undefined) data.subject = input.subject;
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.dueDate !== undefined) {
      data.dueDate = input.dueDate ? new Date(input.dueDate) : null;
    }

    // Recalc on items change
    if (input.items) {
      const subtotal = input.items.reduce((s, i) => s + i.total, 0);
      const taxRate = input.taxRate ?? existing.taxRate;
      const total = subtotal;
      const taxAmount = +(total - total / (1 + taxRate / 100)).toFixed(2);
      data.items = input.items as any;
      data.subtotal = subtotal.toFixed(2);
      data.taxAmount = taxAmount.toFixed(2);
      data.total = total.toFixed(2);
      data.taxRate = taxRate;
    } else if (input.taxRate !== undefined) {
      const total = Number(existing.total);
      const taxAmount = +(total - total / (1 + input.taxRate / 100)).toFixed(2);
      data.taxRate = input.taxRate;
      data.taxAmount = taxAmount.toFixed(2);
    }

    return this.prisma.document.update({
      where: { id },
      data,
      include: { client: true },
    });
  }

  // ============ Issue (status draft → issued, generate local number, mark cases billed) ============
  async issue(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Documento non trovato');
    if (doc.status !== 'draft') {
      throw new BadRequestException('Solo i documenti in bozza si possono emettere');
    }

    const documentNumber = await this.generateLocalNumber(doc.type as DocumentType);

    // Mark Cases as billed only if this is a billable type (not preventivo)
    const billable: DocumentType[] = [
      'invoice_order',
      'tax_invoice',
      'receipt_invoice',
    ];
    const shouldBill = billable.includes(doc.type as DocumentType);

    const caseIds = Array.isArray(doc.caseIds) ? (doc.caseIds as string[]) : [];

    const [updatedDoc] = await this.prisma.$transaction([
      this.prisma.document.update({
        where: { id },
        data: {
          status: 'issued',
          documentNumber,
          issueDate: new Date(),
        },
        include: { client: true },
      }),
      ...(shouldBill && caseIds.length > 0
        ? [
            this.prisma.case.updateMany({
              where: { id: { in: caseIds } },
              data: { billedAt: new Date() },
            }),
          ]
        : []),
    ]);

    this.logger.log(
      `Documento ${documentNumber} (${doc.type}) emesso${
        shouldBill ? ` — ${caseIds.length} casi segnati come fatturati` : ''
      }`,
    );

    return updatedDoc;
  }

  // ============ Delete (drafts only) ============
  async remove(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Documento non trovato');
    if (doc.status !== 'draft') {
      throw new BadRequestException(
        'Solo i documenti in bozza si possono eliminare. Usa "cancella" per quelli emessi.',
      );
    }
    return this.prisma.document.delete({ where: { id } });
  }

  // ============ Cancel issued document ============
  async cancel(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Documento non trovato');
    if (doc.status === 'draft') {
      throw new BadRequestException(
        'Non puoi cancellare una bozza, usa elimina',
      );
    }
    if (doc.status === 'cancelled') {
      throw new BadRequestException('Già cancellato');
    }

    const caseIds = Array.isArray(doc.caseIds) ? (doc.caseIds as string[]) : [];

    const [updated] = await this.prisma.$transaction([
      this.prisma.document.update({
        where: { id },
        data: { status: 'cancelled' },
        include: { client: true },
      }),
      // Liberare i casi così tornano in "Da fatturare"
      ...(caseIds.length > 0
        ? [
            this.prisma.case.updateMany({
              where: { id: { in: caseIds } },
              data: { billedAt: null },
            }),
          ]
        : []),
    ]);

    return updated;
  }

  // ============ List with filters ============
  async list(query: ListDocumentsQuery) {
    const where: any = {};
    if (query.type) where.type = query.type;
    if (query.clientId) where.clientId = query.clientId;
    if (query.status) where.status = query.status;
    if (query.from || query.to) {
      where.issueDate = {};
      if (query.from) where.issueDate.gte = new Date(query.from);
      if (query.to) where.issueDate.lte = new Date(query.to);
    }

    return this.prisma.document.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            studioName: true,
            logoUrl: true,
            contactPerson: true,
          },
        },
      },
      orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
      skip: query.skip,
      take: query.take ?? 100,
    });
  }

  async findOne(id: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: { client: true, creator: { select: { id: true, name: true } } },
    });
    if (!doc) throw new NotFoundException('Documento non trovato');
    return doc;
  }

  // ============ Aggregates for Report tab ============
  async aggregateByDate(query: ListDocumentsQuery) {
    const docs = await this.list({ ...query, take: 10000 });
    const totals = {
      count: docs.length,
      sumTotal: 0,
      sumTax: 0,
      byClient: new Map<
        string,
        { clientId: string; studioName: string; count: number; total: number }
      >(),
      byType: new Map<string, { type: string; count: number; total: number }>(),
    };
    for (const d of docs) {
      totals.sumTotal += Number(d.total);
      totals.sumTax += Number(d.taxAmount);
      const k = d.clientId;
      if (!totals.byClient.has(k)) {
        totals.byClient.set(k, {
          clientId: k,
          studioName: d.client.studioName,
          count: 0,
          total: 0,
        });
      }
      const cb = totals.byClient.get(k)!;
      cb.count += 1;
      cb.total += Number(d.total);

      if (!totals.byType.has(d.type)) {
        totals.byType.set(d.type, { type: d.type, count: 0, total: 0 });
      }
      const tb = totals.byType.get(d.type)!;
      tb.count += 1;
      tb.total += Number(d.total);
    }
    return {
      count: totals.count,
      sumTotal: +totals.sumTotal.toFixed(2),
      sumTax: +totals.sumTax.toFixed(2),
      byClient: Array.from(totals.byClient.values()).sort(
        (a, b) => b.total - a.total,
      ),
      byType: Array.from(totals.byType.values()),
    };
  }

  // ============ Helpers ============
  private async getDefaultTaxRate(): Promise<number> {
    const setting = await this.prisma.systemSettings.findUnique({
      where: { settingKey: 'default_tax_rate' },
    });
    const fromDb = setting ? parseFloat(setting.settingValue) : NaN;
    if (!isNaN(fromDb) && fromDb >= 0 && fromDb <= 100) return fromDb;
    return parseFloat(process.env.INVOICE4U_DEFAULT_TAX_RATE || '18');
  }

  private autoSubject(caseNumbers: string[], patient?: string | null): string {
    const cases =
      caseNumbers.length === 1
        ? caseNumbers[0]
        : `${caseNumbers.length} casi (${caseNumbers.slice(0, 3).join(', ')}${
            caseNumbers.length > 3 ? '…' : ''
          })`;
    return patient ? `${cases} — paziente ${patient}` : cases;
  }

  private async generateLocalNumber(type: DocumentType): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `${TYPE_TO_PREFIX[type]}-${year}-`;
    const last = await this.prisma.document.findFirst({
      where: { documentNumber: { startsWith: prefix } },
      orderBy: { documentNumber: 'desc' },
      select: { documentNumber: true },
    });
    let next = 1;
    if (last?.documentNumber) {
      const parts = last.documentNumber.split('-');
      const n = parseInt(parts[2] || '0', 10);
      if (!isNaN(n)) next = n + 1;
    }
    return `${prefix}${String(next).padStart(4, '0')}`;
  }
}
