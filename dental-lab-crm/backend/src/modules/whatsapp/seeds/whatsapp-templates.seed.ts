import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

interface SeedTemplate {
  name: string;
  language: string;
  category: string;
  bodyTemplate: string;
  variables: string[];
}

const SEED_TEMPLATES: SeedTemplate[] = [
  {
    name: 'caso_incompleto_file',
    language: 'it',
    category: 'utility',
    bodyTemplate:
      'Ciao Dr. {{1}}, per il caso {{2}} (paziente {{3}}) mancano i file 3D (STL/PLY). Puoi inviarli rispondendo a questo messaggio o caricarli dal portale? Grazie.',
    variables: ['dentistName', 'caseNumber', 'patientName'],
  },
  {
    name: 'caso_incompleto_colore',
    language: 'it',
    category: 'utility',
    bodyTemplate:
      'Ciao Dr. {{1}}, per il caso {{2}} (paziente {{3}}) manca il colore VITA per i denti {{4}}. Puoi confermarmelo? Grazie.',
    variables: ['dentistName', 'caseNumber', 'patientName', 'teethList'],
  },
  {
    name: 'caso_incompleto_generico',
    language: 'it',
    category: 'utility',
    bodyTemplate:
      'Ciao Dr. {{1}}, per il caso {{2}} (paziente {{3}}) mancano alcuni dati: {{4}}. Puoi completarli rispondendo o dal portale? Grazie.',
    variables: ['dentistName', 'caseNumber', 'patientName', 'missingItems'],
  },
  {
    name: 'caso_promemoria_consegna',
    language: 'it',
    category: 'utility',
    bodyTemplate:
      'Ciao Dr. {{1}}, promemoria: il caso {{2}} (paziente {{3}}) è in consegna il {{4}}. A presto.',
    variables: ['dentistName', 'caseNumber', 'patientName', 'dueDate'],
  },
  {
    name: 'caso_pronto_ritiro',
    language: 'it',
    category: 'utility',
    bodyTemplate:
      'Ciao Dr. {{1}}, il caso {{2}} (paziente {{3}}) è pronto per il ritiro. Quando passi a prenderlo? Grazie.',
    variables: ['dentistName', 'caseNumber', 'patientName'],
  },
];

@Injectable()
export class WhatsAppTemplatesSeeder implements OnModuleInit {
  private readonly logger = new Logger(WhatsAppTemplatesSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      for (const t of SEED_TEMPLATES) {
        await this.prisma.whatsAppTemplate.upsert({
          where: { name: t.name },
          update: {
            language: t.language,
            category: t.category,
            bodyTemplate: t.bodyTemplate,
            variables: t.variables,
          },
          create: {
            name: t.name,
            language: t.language,
            category: t.category,
            bodyTemplate: t.bodyTemplate,
            variables: t.variables,
            metaStatus: 'pending',
            active: true,
          },
        });
      }
      this.logger.log(`Seeded ${SEED_TEMPLATES.length} WhatsApp templates`);
    } catch (err: any) {
      this.logger.error(`Failed to seed templates: ${err.message}`);
    }
  }
}
