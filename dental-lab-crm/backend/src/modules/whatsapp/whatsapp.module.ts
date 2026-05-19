import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';
import { CaseVerifierService } from './case-verifier.service';
import { AssistantOrchestratorService } from './assistant-orchestrator.service';
import { MetaWaClient } from './clients/meta-wa.client';
import { WhatsAppTemplatesSeeder } from './seeds/whatsapp-templates.seed';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [WhatsAppController],
  providers: [
    MetaWaClient,
    CaseVerifierService,
    WhatsAppService,
    AssistantOrchestratorService,
    WhatsAppTemplatesSeeder,
  ],
  exports: [WhatsAppService, CaseVerifierService, AssistantOrchestratorService],
})
export class WhatsAppModule {}
