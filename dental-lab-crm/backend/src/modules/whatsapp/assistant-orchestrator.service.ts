import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CaseVerifierService } from './case-verifier.service';
import { WhatsAppService } from './whatsapp.service';

export interface OrchestrationResult {
  caseId: string;
  caseNumber: string;
  verification: {
    status: 'verified' | 'incomplete';
    missingItems: string[];
    recommendedTemplate: string | null;
  };
  sendOutcome:
    | { skipped: true; reason: string }
    | { skipped: false; messageDbId: string; shadowOnly: boolean; status: string };
}

@Injectable()
export class AssistantOrchestratorService {
  private readonly logger = new Logger(AssistantOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly verifier: CaseVerifierService,
    private readonly wa: WhatsAppService,
  ) {}

  async processCase(caseId: string): Promise<OrchestrationResult> {
    const verification = await this.verifier.verify(caseId);
    const c = await this.prisma.case.findUnique({
      where: { id: caseId },
      select: { caseNumber: true },
    });
    const caseNumber = c?.caseNumber ?? caseId;

    const baseResult = {
      caseId,
      caseNumber,
      verification: {
        status: verification.status,
        missingItems: verification.missingItems.map((m) => m.description),
        recommendedTemplate: verification.recommendedTemplate,
      },
    };

    // Persist verification status onto the case
    await this.prisma.case.update({
      where: { id: caseId },
      data: {
        verificationStatus: verification.status === 'verified' ? 'verified' : 'incomplete',
        verificationNotes: verification.notes || null,
      },
    });

    if (!verification.recommendedTemplate) {
      return {
        ...baseResult,
        sendOutcome: { skipped: true, reason: 'no_template_recommended' },
      };
    }
    if (!verification.destinationPhone) {
      return {
        ...baseResult,
        sendOutcome: { skipped: true, reason: 'no_destination_phone' },
      };
    }

    // De-duplication: don't resend the same template for the same case within last 24h
    const sinceCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await this.prisma.whatsAppMessage.findFirst({
      where: {
        caseId,
        templateName: verification.recommendedTemplate,
        createdAt: { gte: sinceCutoff },
      },
    });
    if (existing) {
      return {
        ...baseResult,
        sendOutcome: { skipped: true, reason: 'already_sent_within_24h' },
      };
    }

    const send = await this.wa.sendTemplate({
      caseId,
      toPhone: verification.destinationPhone,
      templateName: verification.recommendedTemplate,
      variables: verification.templateVariables,
    });

    return {
      ...baseResult,
      sendOutcome: {
        skipped: false,
        messageDbId: send.messageDbId,
        shadowOnly: send.shadowOnly,
        status: send.status,
      },
    };
  }
}
