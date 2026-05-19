import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { CaseVerifierService } from './case-verifier.service';
import { WhatsAppService } from './whatsapp.service';
import { AssistantOrchestratorService } from './assistant-orchestrator.service';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('whatsapp')
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly verifier: CaseVerifierService,
    private readonly wa: WhatsAppService,
    private readonly orchestrator: AssistantOrchestratorService,
    private readonly prisma: PrismaService,
  ) {}

  // -------- Status & config --------
  @Get('status')
  getStatus() {
    return {
      autoSendEnabled: this.wa.isAutoSendEnabled(),
      shadowMode: !this.wa.isAutoSendEnabled(),
      metaConfigured:
        !!this.config.get<string>('META_WA_PHONE_NUMBER_ID') &&
        !!this.config.get<string>('META_WA_ACCESS_TOKEN'),
    };
  }

  // -------- Templates --------
  @Get('templates')
  listTemplates() {
    return this.wa.listTemplates();
  }

  // -------- Messages log --------
  @Get('messages')
  listMessages(
    @Query('caseId') caseId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.wa.listMessages({
      caseId: caseId || undefined,
      limit: limit ? parseInt(limit, 10) : 100,
    });
  }

  // -------- Manual triggers (for testing) --------
  @Post('verify/:caseId')
  verifyCase(@Param('caseId') caseId: string) {
    return this.verifier.verify(caseId);
  }

  @Post('trigger/:caseId')
  triggerCase(@Param('caseId') caseId: string) {
    return this.orchestrator.processCase(caseId);
  }

  // -------- Meta webhook --------
  @Get('webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const expected = this.config.get<string>('META_WA_WEBHOOK_VERIFY_TOKEN');
    if (mode === 'subscribe' && token === expected) {
      this.logger.log('Meta webhook verified successfully');
      return res.status(200).send(challenge);
    }
    this.logger.warn(
      `Meta webhook verification rejected (mode=${mode}, tokenMatch=${token === expected})`,
    );
    return res.status(403).send('Forbidden');
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async receiveWebhook(@Req() req: Request) {
    // Best-effort: log entries and update message status when possible.
    // Real parsing per Meta's schema can be expanded later.
    const body = req.body as any;
    try {
      const entries = body?.entry ?? [];
      for (const entry of entries) {
        const changes = entry?.changes ?? [];
        for (const change of changes) {
          const value = change?.value ?? {};
          const statuses = value.statuses ?? [];
          for (const s of statuses) {
            const metaId: string | undefined = s.id;
            const status: string | undefined = s.status;
            if (!metaId || !status) continue;
            const data: Record<string, any> = { status };
            const ts = s.timestamp ? new Date(Number(s.timestamp) * 1000) : null;
            if (ts) {
              if (status === 'sent') data.sentAt = ts;
              if (status === 'delivered') data.deliveredAt = ts;
              if (status === 'read') data.readAt = ts;
            }
            if (s.errors?.length) {
              data.errorCode = String(s.errors[0]?.code ?? '');
              data.errorMsg = String(s.errors[0]?.message ?? '').slice(0, 500);
            }
            await this.prisma.whatsAppMessage
              .updateMany({
                where: { metaMessageId: metaId },
                data,
              })
              .catch((e) =>
                this.logger.error(`Failed to update message ${metaId}: ${e.message}`),
              );
          }

          const messages = value.messages ?? [];
          for (const m of messages) {
            const fromPhone: string | undefined = m.from;
            const text: string | undefined = m.text?.body;
            if (!fromPhone) continue;
            await this.prisma.whatsAppMessage.create({
              data: {
                direction: 'inbound',
                fromPhone,
                bodyText: text ?? null,
                status: 'delivered',
                shadowOnly: false,
                metaMessageId: m.id ?? null,
              },
            });
            // Best-effort: mark the most recent outbound to this phone as responded
            await this.prisma.whatsAppMessage.updateMany({
              where: {
                direction: 'outbound',
                toPhone: fromPhone,
                responseAt: null,
              },
              data: { responseAt: new Date() },
            });
          }
        }
      }
    } catch (err: any) {
      this.logger.error(`Webhook processing error: ${err.message}`);
    }
    return { received: true };
  }
}
