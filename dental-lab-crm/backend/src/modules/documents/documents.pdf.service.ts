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
