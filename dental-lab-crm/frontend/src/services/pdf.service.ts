import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import type { Case } from './case.service';

// Logo del laboratorio (placeholder - può essere sostituito con un vero base64)
// const LAB_LOGO_BASE64 = ''; // Inserire qui il logo in base64 se disponibile

class PDFService {
  /**
   * Metodo privato che genera il contenuto del PDF
   */
  private async buildPDFContent(doc: jsPDF, caseData: Case): Promise<void> {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    let currentY = margin;

    // ==================== HEADER ====================
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, pageWidth, 25, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SHEN 3D LAB', margin, 10);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Laboratorio Odontotecnico', margin, 15);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(caseData.caseNumber, pageWidth - margin, 12, { align: 'right' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('N. Caso', pageWidth - margin, 17, { align: 'right' });

    currentY = 32;

    // INFO PAZIENTE
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PAZIENTE', margin, currentY);
    currentY += 5;
    doc.setFontSize(12);
    doc.text(caseData.patientName || 'N/A', margin, currentY);
    currentY += 8;

    // INFO STUDIO
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('STUDIO DENTISTICO', margin, currentY);
    currentY += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(caseData.client?.studioName || 'N/A', margin, currentY);
    if (caseData.client?.contactPerson) {
      currentY += 4;
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Ref: ${caseData.client.contactPerson}`, margin, currentY);
    }
    currentY += 8;

    // BADGE PRIORITA' E STATO
    const badgeY = currentY;
    const priorityColors: Record<string, { bg: [number, number, number]; text: string }> = {
      normal: { bg: [34, 197, 94], text: 'Normale' },
      urgent: { bg: [245, 158, 11], text: 'Urgente' },
      rush: { bg: [239, 68, 68], text: 'Rush' },
    };
    const statusColors: Record<string, { bg: [number, number, number]; text: string }> = {
      received: { bg: [59, 130, 246], text: 'Ricevuto' },
      in_progress: { bg: [245, 158, 11], text: 'In Lavorazione' },
      qc: { bg: [139, 92, 246], text: 'Controllo Qualità' },
      shipped: { bg: [34, 197, 94], text: 'Spedito' },
      delivered: { bg: [22, 163, 74], text: 'Consegnato' },
    };
    const priority = priorityColors[caseData.priority] || priorityColors.normal;
    doc.setFillColor(...priority.bg);
    doc.rect(margin, badgeY - 3, 25, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(priority.text.toUpperCase(), margin + 12.5, badgeY + 1, { align: 'center' });
    const status = statusColors[caseData.status] || statusColors.received;
    doc.setFillColor(...status.bg);
    doc.rect(margin + 28, badgeY - 3, 30, 6, 'F');
    doc.text(status.text.toUpperCase(), margin + 43, badgeY + 1, { align: 'center' });
    currentY += 10;

    // DATE
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Data Ricezione:', margin, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(this.formatDate(caseData.receivedDate), margin + 28, currentY);
    doc.setFont('helvetica', 'bold');
    doc.text('Consegna Prevista:', pageWidth - margin - 45, currentY);
    doc.setTextColor(220, 38, 38);
    doc.text(this.formatDate(caseData.dueDate), pageWidth - margin, currentY, { align: 'right' });
    currentY += 8;

    // LINEA SEPARATRICE
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 6;

    // TABELLA DENTI
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('LAVORAZIONI', margin, currentY);
    currentY += 4;
    const teethData = (caseData.teeth || []).map((tooth) => [
      tooth.toothNumber.toString(),
      this.getWorkTypeLabel(tooth.workType),
      this.getMaterialLabel(tooth.material),
      tooth.vitaColor || '-',
      tooth.unitPrice ? `€${tooth.unitPrice.toFixed(2)}` : '-',
    ]);
    if (teethData.length === 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      doc.text('Nessuna lavorazione specificata', margin, currentY + 5);
      currentY += 10;
    } else {
      autoTable(doc, {
        startY: currentY,
        head: [['Dente', 'Lavorazione', 'Materiale', 'Colore', 'Prezzo']],
        body: teethData,
        theme: 'grid',
        headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 35 },
          2: { cellWidth: 30 },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 25, halign: 'right' },
        },
        margin: { left: margin, right: margin },
        styles: { cellPadding: 2, lineColor: [226, 232, 240], lineWidth: 0.3 },
      });
      currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 4 : currentY + 20;
    }

    // NOTE
    if (caseData.notesInternal || caseData.patientNotes) {
      currentY += 4;
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('NOTE', margin, currentY);
      currentY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      if (caseData.patientNotes) {
        doc.setTextColor(220, 38, 38);
        doc.text(`⚠ ${caseData.patientNotes}`, margin, currentY, { maxWidth: pageWidth - margin * 2 - 25 });
        const noteHeight = doc.getTextDimensions(caseData.patientNotes, { maxWidth: pageWidth - margin * 2 - 25 }).h;
        currentY += noteHeight + 2;
      }
      if (caseData.notesInternal) {
        doc.setTextColor(100, 116, 139);
        doc.text(caseData.notesInternal, margin, currentY, { maxWidth: pageWidth - margin * 2 - 25 });
      }
    }

    // FOOTER CON QR CODE
    const footerY = pageHeight - 25;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);
    try {
      const qrDataUrl = await QRCode.toDataURL(caseData.id, { width: 200, margin: 1, color: { dark: '#1e40af', light: '#ffffff' } });
      const qrSize = 18;
      doc.addImage(qrDataUrl, 'PNG', pageWidth - margin - qrSize, footerY, qrSize, qrSize);
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.text('Scansiona per dettagli', pageWidth - margin - qrSize / 2, footerY + qrSize + 3, { align: 'center' });
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('Shen 3D Lab', margin, footerY + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text('Laboratorio Odontotecnico Specializzato', margin, footerY + 8);
    doc.text('Tel: +39 XXX XXXX XXX | Email: info@shen3d.it', margin, footerY + 11);
    doc.text(`Stampato il: ${new Date().toLocaleDateString('it-IT')}`, margin, footerY + 16);

    // TOTALE
    if (caseData.totalPrice && caseData.totalPrice > 0) {
      const totalY = footerY - 10;
      doc.setFillColor(254, 252, 232);
      doc.rect(pageWidth - margin - 50, totalY - 5, 50, 10, 'F');
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`TOTALE: €${caseData.totalPrice.toFixed(2)}`, pageWidth - margin - 2, totalY + 1, { align: 'right' });
    }
  }

  /**
   * Genera un PDF A5 per un caso dentale e lo scarica
   */
  async generateCasePDF(caseData: Case): Promise<void> {
    const doc = new jsPDF({ format: 'a5', unit: 'mm', orientation: 'portrait' });
    await this.buildPDFContent(doc, caseData);
    const fileName = `${caseData.caseNumber}_${caseData.patientName?.replace(/\s+/g, '_') || 'caso'}.pdf`;
    doc.save(fileName);
  }

  /**
   * Genera un PDF A5 per un caso dentale e restituisce il documento jsPDF
   * Utile per la preview in un iframe
   */
  async generateCasePDFBlob(caseData: Case): Promise<jsPDF> {
    const doc = new jsPDF({ format: 'a5', unit: 'mm', orientation: 'portrait' });
    await this.buildPDFContent(doc, caseData);
    return doc;
  }

  /**
   * Formatta la data per la visualizzazione
   */
  private formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  /**
   * Ottiene la label tradotta per il tipo di lavorazione
   */
  private getWorkTypeLabel(workType: string): string {
    const labels: Record<string, string> = {
      corona: 'Corona',
      protesi: 'Protesi',
      impianto: 'Impianto',
      bite: 'Bite',
      maryland: 'Maryland',
      intarsio: 'Intarsio',
      faccetta: 'Faccetta',
      altro: 'Altro',
    };
    return labels[workType] || workType;
  }

  /**
   * Ottiene la label tradotta per il materiale
   */
  private getMaterialLabel(material: string): string {
    const labels: Record<string, string> = {
      ZR: 'Zirconio',
      EMAX: 'Disilicato Li',
      PMMA: 'PMMA',
      RES: 'Resina',
      'CR-CO': 'Cr-Co',
      CERAM: 'Ceramica',
      COMP: 'Composito',
      ALT: 'Altro',
    };
    return labels[material] || material;
  }
}

const pdfService = new PDFService();
export default pdfService;
