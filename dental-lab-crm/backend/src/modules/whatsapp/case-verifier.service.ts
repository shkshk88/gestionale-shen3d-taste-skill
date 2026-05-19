import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CaseVerificationResult, MissingItem } from './dto/verification.dto';

@Injectable()
export class CaseVerifierService {
  private readonly logger = new Logger(CaseVerifierService.name);

  constructor(private readonly prisma: PrismaService) {}

  async verify(caseId: string): Promise<CaseVerificationResult> {
    const c = await this.prisma.case.findUnique({
      where: { id: caseId },
      include: {
        client: true,
        dentist: true,
        teeth: true,
        files: { where: { isDeleted: false } },
      },
    });
    if (!c) throw new NotFoundException(`Case ${caseId} not found`);

    const missing: MissingItem[] = [];

    if (!c.dentistId || !c.dentist) {
      missing.push({ type: 'dentist', description: 'dentista assegnato' });
    }
    if (!c.patientName || c.patientName.trim().length < 2) {
      missing.push({ type: 'patient', description: 'nome paziente' });
    }
    if (c.teeth.length === 0) {
      missing.push({ type: 'teeth', description: 'denti da lavorare' });
    }

    const teethMissingColor: number[] = [];
    const teethMissingMaterial: number[] = [];
    const teethMissingWorkType: number[] = [];
    for (const t of c.teeth) {
      if (!t.vitaColor || t.vitaColor.trim() === '') {
        teethMissingColor.push(t.toothNumber);
      }
      if (!t.material || t.material === 'ALT') {
        teethMissingMaterial.push(t.toothNumber);
      }
      if (!t.workType || t.workType === 'altro') {
        teethMissingWorkType.push(t.toothNumber);
      }
    }
    if (teethMissingColor.length > 0) {
      missing.push({
        type: 'vitaColor',
        description: `colore VITA per denti ${teethMissingColor.join(', ')}`,
      });
    }
    if (teethMissingMaterial.length > 0) {
      missing.push({
        type: 'material',
        description: `materiale per denti ${teethMissingMaterial.join(', ')}`,
      });
    }
    if (teethMissingWorkType.length > 0) {
      missing.push({
        type: 'workType',
        description: `tipo lavorazione per denti ${teethMissingWorkType.join(', ')}`,
      });
    }

    const has3DFile = c.files.some((f) =>
      ['stl', 'ply', 'obj'].includes((f.fileType || '').toLowerCase()),
    );
    if (!has3DFile && c.teeth.length > 0) {
      missing.push({ type: 'file', description: 'file 3D (STL/PLY)' });
    }

    const destinationPhone = this.pickPhone(c);
    const dentistName = c.dentist?.name || c.client.contactPerson || c.client.studioName;
    const patientName = c.patientName || 's.n.';

    let recommendedTemplate: string | null = null;
    const templateVariables: Record<string, string> = {
      dentistName,
      caseNumber: c.caseNumber,
      patientName,
    };

    if (missing.length === 0) {
      // verified — optionally send reminder if dueDate close
      if (c.dueDate) {
        const daysToDue = Math.floor(
          (c.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );
        if (daysToDue >= 0 && daysToDue <= 2) {
          recommendedTemplate = 'caso_promemoria_consegna';
          templateVariables.dueDate = c.dueDate.toLocaleDateString('it-IT');
        }
      }
      return {
        status: 'verified',
        missingItems: [],
        recommendedTemplate,
        templateVariables,
        destinationPhone,
        notes: '',
      };
    }

    // Choose template based on what's missing
    const onlyFiles =
      missing.length === 1 && missing[0].type === 'file';
    const onlyColor =
      missing.length === 1 && missing[0].type === 'vitaColor';

    if (onlyFiles) {
      recommendedTemplate = 'caso_incompleto_file';
    } else if (onlyColor) {
      recommendedTemplate = 'caso_incompleto_colore';
      templateVariables.teethList = teethMissingColor.join(', ');
    } else {
      recommendedTemplate = 'caso_incompleto_generico';
      templateVariables.missingItems = missing
        .map((m) => m.description)
        .join('; ');
    }

    return {
      status: 'incomplete',
      missingItems: missing,
      recommendedTemplate,
      templateVariables,
      destinationPhone,
      notes: missing.map((m) => m.description).join('; '),
    };
  }

  private pickPhone(c: {
    dentist?: { phone: string | null } | null;
    client: { whatsapp: string | null; phone: string | null };
  }): string | null {
    const candidates = [
      c.dentist?.phone,
      c.client.whatsapp,
      c.client.phone,
    ].filter((p): p is string => !!p && p.trim() !== '');
    if (candidates.length === 0) return null;
    return this.normalisePhone(candidates[0]);
  }

  private normalisePhone(raw: string): string {
    // E.164 without leading +. Strip spaces, dashes, parens, leading +.
    const cleaned = raw.replace(/[\s\-()]/g, '').replace(/^\+/, '');
    return cleaned;
  }
}
