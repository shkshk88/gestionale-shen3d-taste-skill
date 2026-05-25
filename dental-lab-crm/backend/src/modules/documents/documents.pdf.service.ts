import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import PDFDocument = require('pdfkit');
import { PrismaService } from '../../prisma/prisma.service';

const TYPE_LABEL: Record<string, { en: string; he: string }> = {
  price_quote: { en: 'Price Quote', he: 'הצעת מחיר' },
  invoice_order: { en: 'Invoice Order', he: 'חשבונית עסקה' },
  tax_invoice: { en: 'Tax Invoice', he: 'חשבונית מס' },
  receipt: { en: 'Receipt', he: 'קבלה' },
  receipt_invoice: { en: 'Tax Invoice + Receipt', he: 'חשבונית מס/קבלה' },
  credit_note: { en: 'Credit Note', he: 'חשבונית זיכוי' },
};

@Injectable()
export class DocumentsPdfService {
  private readonly logger = new Logger(DocumentsPdfService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a PDF buffer for a local document (Fase B).
   * Marked "NON FISCALE — promemoria interno" because the real fiscal PDF
   * comes from invoice4u in Fase C.
   */
  async generate(documentId: string): Promise<Buffer> {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { client: true },
    });
    if (!doc) throw new NotFoundException('Documento non trovato');

    const labName = await this.getSetting('lab_name', 'Shen3D Lab');
    const labAddress = await this.getSetting('lab_address', '');
    const labEmail = await this.getSetting('lab_email', '');
    const labPhone = await this.getSetting('lab_phone', '');
    const labVat = await this.getSetting('lab_vat_number', '');

    return new Promise<Buffer>((resolve, reject) => {
      try {
        const pdf = new PDFDocument({ size: 'A4', margin: 40 });
        const chunks: Buffer[] = [];
        pdf.on('data', (c) => chunks.push(c));
        pdf.on('end', () => resolve(Buffer.concat(chunks)));
        pdf.on('error', reject);

        const typeLabel = TYPE_LABEL[doc.type] || { en: doc.type, he: '' };
        const isDraft = doc.status === 'draft';
        const isFiscal = !!doc.invoice4uDocumentNumber;

        // Header watermark for non-fiscal
        if (!isFiscal) {
          pdf
            .save()
            .fontSize(8)
            .fillColor('#dc2626')
            .text(
              'PROMEMORIA INTERNO — NON DOCUMENTO FISCALE (fattura ufficiale su invoice4u)',
              40,
              20,
              { width: 515, align: 'center' },
            )
            .restore();
        }

        // Lab header
        pdf
          .fontSize(18)
          .fillColor('#0f172a')
          .text(labName, 40, 45, { continued: false });
        pdf.fontSize(9).fillColor('#64748b');
        if (labAddress) pdf.text(labAddress, 40);
        const contactLine = [labEmail, labPhone].filter(Boolean).join('  ·  ');
        if (contactLine) pdf.text(contactLine, 40);
        if (labVat) pdf.text(`Ch.P. / Teudat Zehut: ${labVat}`, 40);

        // Document title block (right side)
        const titleX = 350;
        pdf
          .fontSize(20)
          .fillColor('#0f172a')
          .text(typeLabel.en.toUpperCase(), titleX, 45, { width: 215, align: 'right' });
        if (typeLabel.he) {
          pdf
            .fontSize(11)
            .fillColor('#64748b')
            .text(typeLabel.he, titleX, 70, { width: 215, align: 'right' });
        }
        pdf
          .fontSize(11)
          .fillColor('#0f172a')
          .text(
            isDraft ? 'BOZZA / DRAFT' : doc.documentNumber || '—',
            titleX,
            90,
            { width: 215, align: 'right' },
          );
        pdf
          .fontSize(9)
          .fillColor('#64748b')
          .text(
            doc.issueDate
              ? `Emesso: ${new Date(doc.issueDate).toLocaleDateString('it-IT')}`
              : `Creato: ${new Date(doc.createdAt).toLocaleDateString('it-IT')}`,
            titleX,
            108,
            { width: 215, align: 'right' },
          );

        // Divider
        pdf
          .moveTo(40, 145)
          .lineTo(555, 145)
          .strokeColor('#e2e8f0')
          .lineWidth(1)
          .stroke();

        // Client block
        pdf
          .fontSize(9)
          .fillColor('#64748b')
          .text('FATTURATO A / BILLED TO', 40, 160);
        pdf
          .fontSize(12)
          .fillColor('#0f172a')
          .text(doc.client.studioName, 40, 175);
        pdf.fontSize(9).fillColor('#64748b');
        if (doc.client.contactPerson) pdf.text(doc.client.contactPerson, 40);
        if (doc.client.address) {
          const addr = [doc.client.address, doc.client.city, doc.client.postalCode]
            .filter(Boolean)
            .join(', ');
          if (addr) pdf.text(addr, 40);
        }
        if (doc.client.email) pdf.text(doc.client.email, 40);
        if (doc.client.phone) pdf.text(doc.client.phone, 40);
        if (doc.client.vatNumber) {
          pdf.text(`Ch.P.: ${doc.client.vatNumber}`, 40);
        }

        // Subject
        if (doc.subject) {
          pdf
            .moveDown(1)
            .fontSize(10)
            .fillColor('#0f172a')
            .text(`Oggetto: ${doc.subject}`, 40);
        }

        // Items table
        const tableTop = 280;
        pdf
          .fontSize(9)
          .fillColor('#64748b')
          .text('DESCRIZIONE', 40, tableTop)
          .text('QTÀ', 360, tableTop, { width: 40, align: 'right' })
          .text('PREZZO', 410, tableTop, { width: 70, align: 'right' })
          .text('TOTALE', 485, tableTop, { width: 70, align: 'right' });
        pdf
          .moveTo(40, tableTop + 15)
          .lineTo(555, tableTop + 15)
          .strokeColor('#e2e8f0')
          .stroke();

        let y = tableTop + 25;
        const items = Array.isArray(doc.items) ? (doc.items as any[]) : [];
        pdf.fontSize(9).fillColor('#0f172a');
        for (const it of items) {
          if (y > 700) {
            pdf.addPage();
            y = 50;
          }
          const nameLines = pdf.heightOfString(it.name || '', { width: 310 });
          pdf.text(it.name || '', 40, y, { width: 310 });
          pdf.text(String(it.qty ?? 1), 360, y, { width: 40, align: 'right' });
          pdf.text(this.formatMoney(it.unitPrice), 410, y, { width: 70, align: 'right' });
          pdf.text(this.formatMoney(it.total), 485, y, { width: 70, align: 'right' });
          y += Math.max(18, nameLines + 6);
        }

        // Totals
        y = Math.max(y + 20, 600);
        const subtotalNoTax = +(Number(doc.total) / (1 + Number(doc.taxRate) / 100)).toFixed(2);
        pdf
          .strokeColor('#e2e8f0')
          .moveTo(360, y)
          .lineTo(555, y)
          .stroke();
        y += 8;
        pdf.fontSize(9).fillColor('#64748b');
        pdf.text('Imponibile / Subtotal:', 360, y, { width: 120, align: 'right' });
        pdf.fillColor('#0f172a').text(this.formatMoney(subtotalNoTax), 485, y, { width: 70, align: 'right' });
        y += 14;
        pdf
          .fillColor('#64748b')
          .text(`IVA / Tax ${doc.taxRate}%:`, 360, y, { width: 120, align: 'right' });
        pdf
          .fillColor('#0f172a')
          .text(this.formatMoney(Number(doc.taxAmount)), 485, y, { width: 70, align: 'right' });
        y += 16;
        pdf
          .fontSize(11)
          .fillColor('#0f172a')
          .text('TOTALE / TOTAL:', 360, y, { width: 120, align: 'right' });
        pdf
          .fontSize(13)
          .fillColor('#0f172a')
          .text(
            `${doc.currency === 'ILS' ? '₪' : doc.currency} ${this.formatMoney(Number(doc.total))}`,
            475,
            y - 2,
            { width: 80, align: 'right' },
          );

        // Notes
        if (doc.notes) {
          y += 40;
          pdf.fontSize(8).fillColor('#64748b').text('NOTE:', 40, y);
          y += 12;
          pdf.fontSize(9).fillColor('#334155').text(doc.notes, 40, y, { width: 515 });
        }

        // Footer
        pdf
          .fontSize(7)
          .fillColor('#94a3b8')
          .text(
            isFiscal
              ? `Documento fiscale invoice4u #${doc.invoice4uDocumentNumber}`
              : 'Documento generato dal CRM Shen3D — non sostituisce la fattura fiscale invoice4u',
            40,
            780,
            { width: 515, align: 'center' },
          );

        pdf.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  // ─── Report preview "Da approvare" (non fiscale, per invio al cliente) ─────
  async generateUnbilledReport(
    clientId: string,
    caseIds: string[],
  ): Promise<Buffer> {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });
    if (!client) throw new NotFoundException('Cliente non trovato');

    const cases = await this.prisma.case.findMany({
      where: { id: { in: caseIds }, clientId },
      include: { teeth: true },
      orderBy: [{ shippedDate: 'asc' }, { receivedDate: 'asc' }],
    });
    if (cases.length === 0) {
      throw new NotFoundException('Nessun caso valido per questo cliente');
    }

    const labName = await this.getSetting('lab_name', 'Shen3D Lab');
    const labAddress = await this.getSetting('lab_address', '');
    const labEmail = await this.getSetting('lab_email', '');
    const labPhone = await this.getSetting('lab_phone', '');
    const labVat = await this.getSetting('lab_vat_number', '');
    const defaultTaxRate = parseFloat(
      (await this.getSetting('default_tax_rate', '')) ||
        process.env.INVOICE4U_DEFAULT_TAX_RATE ||
        '18',
    );

    // Build rows by case grouping teeth by (workType, material, unitPrice)
    interface Row {
      date: Date;
      caseNumber: string;
      patientName: string;
      description: string;
      teethRange: string;
      qty: number;
      unitPrice: number;
      total: number;
    }
    const rows: Row[] = [];
    for (const c of cases) {
      const groups = new Map<
        string,
        { teeth: number[]; unitPrice: number; workType: string; material: string }
      >();
      for (const t of c.teeth) {
        const price = Number(t.unitPrice ?? 0);
        const key = `${t.workType}|${t.material}|${price}`;
        if (!groups.has(key)) {
          groups.set(key, {
            teeth: [],
            unitPrice: price,
            workType: t.workType,
            material: t.material,
          });
        }
        groups.get(key)!.teeth.push(t.toothNumber);
      }
      for (const g of groups.values()) {
        rows.push({
          date: c.shippedDate || c.receivedDate,
          caseNumber: c.caseNumber,
          patientName: c.patientName || '—',
          description: this.describeWork(g.workType, g.material),
          teethRange: this.formatTeethRange(g.teeth),
          qty: g.teeth.length,
          unitPrice: g.unitPrice,
          total: g.unitPrice * g.teeth.length,
        });
      }
    }

    // Group rows by year-month
    const monthGroups = new Map<string, Row[]>();
    for (const r of rows) {
      const d = r.date;
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthGroups.has(k)) monthGroups.set(k, []);
      monthGroups.get(k)!.push(r);
    }
    const sortedMonthKeys = Array.from(monthGroups.keys()).sort();

    const grandSubtotal = rows.reduce((s, r) => s + r.total, 0);
    const grandTax = +((grandSubtotal * defaultTaxRate) / 100).toFixed(2);
    const grandTotal = +(grandSubtotal + grandTax).toFixed(2);

    return new Promise<Buffer>((resolve, reject) => {
      try {
        const pdf = new PDFDocument({ size: 'A4', margin: 40 });
        const chunks: Buffer[] = [];
        pdf.on('data', (c) => chunks.push(c));
        pdf.on('end', () => resolve(Buffer.concat(chunks)));
        pdf.on('error', reject);

        // Banner verde watermark top
        pdf
          .save()
          .fontSize(8)
          .fillColor('#16a34a')
          .text(
            'REPORT DI VERIFICA — DA APPROVARE · Non costituisce documento fiscale',
            40,
            20,
            { width: 515, align: 'center' },
          )
          .restore();

        // Lab header (left)
        pdf
          .fontSize(18)
          .fillColor('#0f172a')
          .text(labName, 40, 45);
        pdf.fontSize(9).fillColor('#64748b');
        if (labAddress) pdf.text(labAddress, 40);
        const contactLine = [labEmail, labPhone].filter(Boolean).join('  ·  ');
        if (contactLine) pdf.text(contactLine, 40);
        if (labVat) pdf.text(`Ch.P.: ${labVat}`, 40);

        // Title block (right)
        const titleX = 350;
        pdf
          .fontSize(18)
          .fillColor('#16a34a')
          .text('REPORT', titleX, 45, { width: 215, align: 'right' });
        pdf
          .fontSize(10)
          .fillColor('#16a34a')
          .text('DA APPROVARE', titleX, 65, { width: 215, align: 'right' });
        pdf
          .fontSize(9)
          .fillColor('#64748b')
          .text(
            `Data: ${new Date().toLocaleDateString('it-IT')}`,
            titleX,
            90,
            { width: 215, align: 'right' },
          );

        // Divider
        pdf
          .moveTo(40, 135)
          .lineTo(555, 135)
          .strokeColor('#e2e8f0')
          .lineWidth(1)
          .stroke();

        // Client block
        pdf.fontSize(9).fillColor('#64748b').text('CLIENTE', 40, 148);
        pdf
          .fontSize(13)
          .fillColor('#0f172a')
          .text(client.studioName, 40, 162);
        pdf.fontSize(9).fillColor('#64748b');
        if (client.contactPerson) pdf.text(client.contactPerson, 40);
        if (client.email) pdf.text(client.email, 40);
        if (client.phone) pdf.text(client.phone, 40);

        // Summary chip (right)
        pdf
          .fontSize(9)
          .fillColor('#64748b')
          .text('CASI INCLUSI', 350, 148, { width: 215, align: 'right' });
        pdf
          .fontSize(20)
          .fillColor('#16a34a')
          .text(String(cases.length), 350, 160, { width: 215, align: 'right' });

        // Table top
        let y = 235;
        const COL = {
          patient: 40,
          date: 175,
          desc: 230,
          teeth: 335,
          qty: 410,
          price: 445,
          total: 500,
        };
        const drawTableHeader = (yy: number) => {
          pdf
            .fontSize(8)
            .fillColor('#64748b')
            .text('PAZIENTE', COL.patient, yy)
            .text('DATA', COL.date, yy)
            .text('DESCRIZIONE', COL.desc, yy)
            .text('DENTI', COL.teeth, yy, { width: 70 })
            .text('Q.', COL.qty, yy, { width: 30, align: 'right' })
            .text('PREZZO', COL.price, yy, { width: 50, align: 'right' })
            .text('TOTALE', COL.total, yy, { width: 55, align: 'right' });
          pdf
            .moveTo(40, yy + 13)
            .lineTo(555, yy + 13)
            .strokeColor('#cbd5e1')
            .lineWidth(0.6)
            .stroke();
        };
        drawTableHeader(y);
        y += 22;

        const monthLabels = [
          'Gennaio',
          'Febbraio',
          'Marzo',
          'Aprile',
          'Maggio',
          'Giugno',
          'Luglio',
          'Agosto',
          'Settembre',
          'Ottobre',
          'Novembre',
          'Dicembre',
        ];

        for (const monthKey of sortedMonthKeys) {
          const [year, monthStr] = monthKey.split('-');
          const monthIdx = parseInt(monthStr, 10) - 1;
          const monthRows = monthGroups.get(monthKey)!;
          const monthSubtotal = monthRows.reduce((s, r) => s + r.total, 0);

          // Month header
          if (y > 720) {
            pdf.addPage();
            y = 50;
            drawTableHeader(y);
            y += 22;
          }
          pdf
            .rect(40, y - 2, 515, 16)
            .fillColor('#dcfce7')
            .fill();
          pdf
            .fontSize(9)
            .fillColor('#15803d')
            .text(
              `${monthLabels[monthIdx]} ${year}`,
              45,
              y + 2,
              { width: 200 },
            );
          pdf
            .fontSize(9)
            .fillColor('#15803d')
            .text(
              `${monthRows.length} righe · ₪${this.formatMoney(monthSubtotal)}`,
              345,
              y + 2,
              { width: 205, align: 'right' },
            );
          y += 20;

          // Rows
          for (const r of monthRows) {
            if (y > 750) {
              pdf.addPage();
              y = 50;
              drawTableHeader(y);
              y += 22;
            }
            pdf.fontSize(9).fillColor('#0f172a');
            pdf.text(r.patientName, COL.patient, y, { width: 130 });
            pdf
              .fontSize(8)
              .fillColor('#64748b')
              .text(r.date.toLocaleDateString('it-IT', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
              }), COL.date, y + 1);
            pdf.fontSize(9).fillColor('#0f172a');
            pdf.text(r.description, COL.desc, y, { width: 100 });
            pdf
              .fontSize(8)
              .fillColor('#475569')
              .text(r.teethRange, COL.teeth, y + 1, { width: 70 });
            pdf
              .fontSize(9)
              .fillColor('#0f172a')
              .text(String(r.qty), COL.qty, y, { width: 30, align: 'right' });
            pdf.text(this.formatMoney(r.unitPrice), COL.price, y, {
              width: 50,
              align: 'right',
            });
            pdf
              .fontSize(9)
              .fillColor('#0f172a')
              .text(this.formatMoney(r.total), COL.total, y, {
                width: 55,
                align: 'right',
              });
            y += 16;
          }
        }

        // Totals box
        if (y > 700) {
          pdf.addPage();
          y = 50;
        }
        y += 10;
        pdf
          .moveTo(330, y)
          .lineTo(555, y)
          .strokeColor('#cbd5e1')
          .stroke();
        y += 8;
        pdf.fontSize(9).fillColor('#64748b');
        pdf.text('Imponibile:', 330, y, { width: 160, align: 'right' });
        pdf
          .fillColor('#0f172a')
          .text(`₪ ${this.formatMoney(grandSubtotal)}`, 495, y, {
            width: 60,
            align: 'right',
          });
        y += 14;
        pdf
          .fillColor('#64748b')
          .text(`IVA ${defaultTaxRate}%:`, 330, y, { width: 160, align: 'right' });
        pdf
          .fillColor('#0f172a')
          .text(`₪ ${this.formatMoney(grandTax)}`, 495, y, {
            width: 60,
            align: 'right',
          });
        y += 18;
        pdf
          .rect(330, y - 4, 225, 24)
          .fillColor('#16a34a')
          .fill();
        pdf
          .fontSize(11)
          .fillColor('#ffffff')
          .text('TOTALE CON IVA:', 335, y + 2, { width: 140 });
        pdf
          .fontSize(13)
          .fillColor('#ffffff')
          .text(`₪ ${this.formatMoney(grandTotal)}`, 470, y + 1, {
            width: 80,
            align: 'right',
          });

        // Footer disclaimer
        pdf
          .fontSize(8)
          .fillColor('#94a3b8')
          .text(
            'Documento di verifica generato da CRM Shen3D. Non rappresenta un documento fiscale.\n' +
              'In attesa di approvazione del cliente per emissione della fattura ufficiale.',
            40,
            790,
            { width: 515, align: 'center' },
          );

        pdf.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  private describeWork(workType: string, material: string): string {
    const wtLabels: Record<string, string> = {
      corona: '',
      protesi: '',
      impianto: 'Impianto',
      bite: 'Bite',
      maryland: 'Maryland',
      intarsio: 'Intarsio',
      faccetta: 'Faccetta',
      altro: '',
    };
    const matLabels: Record<string, string> = {
      ZR: 'Zirconia',
      EMAX: 'E-Max',
      PMMA: 'PMMA',
      RES: 'Resina',
      CR_CO: 'Cr-Co',
      CERAM: 'Ceramica',
      COMP: 'Composito',
      ALT: '',
    };
    const wt = wtLabels[workType] ?? workType;
    const mt = matLabels[material] ?? material;
    return [wt, mt].filter(Boolean).join(' ');
  }

  private formatTeethRange(teeth: number[]): string {
    if (teeth.length === 0) return '';
    const sorted = Array.from(new Set(teeth)).sort((a, b) => a - b);
    const groups: string[] = [];
    let start = sorted[0];
    let end = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === end + 1) {
        end = sorted[i];
      } else {
        groups.push(start === end ? String(start) : `${start}-${end}`);
        start = end = sorted[i];
      }
    }
    groups.push(start === end ? String(start) : `${start}-${end}`);
    return groups.join(' + ');
  }

  private formatMoney(n: number | string): string {
    const v = typeof n === 'string' ? parseFloat(n) : n;
    return (v || 0).toLocaleString('it-IT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  private async getSetting(key: string, fallback: string): Promise<string> {
    const s = await this.prisma.systemSettings.findUnique({
      where: { settingKey: key },
    });
    return s?.settingValue || fallback;
  }
}
