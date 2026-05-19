import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { MetaWaClient } from './clients/meta-wa.client';

export interface SendTemplateInput {
  caseId?: string | null;
  toPhone: string;
  templateName: string;
  variables: Record<string, string>;
}

export interface SendTemplateResult {
  messageDbId: string;
  metaMessageId: string | null;
  shadowOnly: boolean;
  status: string;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly metaClient: MetaWaClient,
  ) {}

  isAutoSendEnabled(): boolean {
    return this.config.get<string>('WHATSAPP_AUTO_SEND') === 'true';
  }

  async sendTemplate(input: SendTemplateInput): Promise<SendTemplateResult> {
    const template = await this.prisma.whatsAppTemplate.findUnique({
      where: { name: input.templateName },
    });
    if (!template) {
      throw new NotFoundException(`Template ${input.templateName} not found`);
    }
    if (!template.active) {
      throw new Error(`Template ${input.templateName} is not active`);
    }

    const variableNames = template.variables as string[];
    const bodyParameters: string[] = variableNames.map(
      (name) => input.variables[name] ?? '',
    );

    const bodyText = this.renderBody(template.bodyTemplate, bodyParameters);

    const shadowOnly = !this.isAutoSendEnabled() || template.metaStatus !== 'approved';

    if (shadowOnly) {
      this.logger.log(
        `[SHADOW] Would send template "${input.templateName}" to ${input.toPhone} for case=${input.caseId ?? 'n/a'}. Body: ${bodyText}`,
      );
      const record = await this.prisma.whatsAppMessage.create({
        data: {
          caseId: input.caseId ?? null,
          direction: 'outbound',
          toPhone: input.toPhone,
          templateName: input.templateName,
          bodyText,
          variables: input.variables,
          status: 'queued',
          shadowOnly: true,
        },
      });
      return {
        messageDbId: record.id,
        metaMessageId: null,
        shadowOnly: true,
        status: 'queued',
      };
    }

    // Live mode: call Meta
    try {
      const sendResult = await this.metaClient.sendTemplate({
        toPhone: input.toPhone,
        templateName: input.templateName,
        language: template.language,
        bodyParameters,
      });
      const record = await this.prisma.whatsAppMessage.create({
        data: {
          caseId: input.caseId ?? null,
          direction: 'outbound',
          toPhone: input.toPhone,
          templateName: input.templateName,
          bodyText,
          variables: input.variables,
          metaMessageId: sendResult.messageId,
          status: 'sent',
          shadowOnly: false,
          sentAt: new Date(),
        },
      });
      return {
        messageDbId: record.id,
        metaMessageId: sendResult.messageId,
        shadowOnly: false,
        status: 'sent',
      };
    } catch (err: any) {
      const record = await this.prisma.whatsAppMessage.create({
        data: {
          caseId: input.caseId ?? null,
          direction: 'outbound',
          toPhone: input.toPhone,
          templateName: input.templateName,
          bodyText,
          variables: input.variables,
          status: 'failed',
          shadowOnly: false,
          errorMsg: String(err?.message || err).slice(0, 500),
        },
      });
      this.logger.error(
        `Meta send failed for ${input.templateName} to ${input.toPhone}: ${err.message}`,
      );
      return {
        messageDbId: record.id,
        metaMessageId: null,
        shadowOnly: false,
        status: 'failed',
      };
    }
  }

  async listMessages(opts: { caseId?: string; limit?: number } = {}) {
    return this.prisma.whatsAppMessage.findMany({
      where: opts.caseId ? { caseId: opts.caseId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: opts.limit ?? 100,
    });
  }

  async listTemplates() {
    return this.prisma.whatsAppTemplate.findMany({
      orderBy: { name: 'asc' },
    });
  }

  private renderBody(template: string, params: string[]): string {
    return template.replace(/\{\{(\d+)\}\}/g, (_match, idx) => {
      const i = parseInt(idx, 10) - 1;
      return params[i] ?? '';
    });
  }
}
