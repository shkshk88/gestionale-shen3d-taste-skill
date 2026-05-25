import { Logger, Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentsPdfService } from './documents.pdf.service';
import { MockInvoice4uClient } from './invoice4u/mock-invoice4u.client';
import { SoapInvoice4uClient } from './invoice4u/soap-invoice4u.client';
import {
  INVOICE4U_CLIENT_TOKEN,
  Invoice4uClient,
} from './invoice4u/invoice4u.types';

const WSDL_STAGING =
  'https://apiqa.invoice4u.co.il/Services/ApiService.svc?singleWsdl';
const WSDL_PRODUCTION =
  'https://api.invoice4u.co.il/Services/ApiService.svc?singleWsdl';

@Module({
  imports: [PrismaModule],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    DocumentsPdfService,
    {
      provide: INVOICE4U_CLIENT_TOKEN,
      useFactory: (): Invoice4uClient => {
        const mode = (process.env.INVOICE4U_MODE || 'mock').toLowerCase();
        const token = process.env.INVOICE4U_TOKEN || '';
        const dryRun = process.env.INVOICE4U_DRY_RUN === 'true';
        const logger = new Logger('Invoice4uFactory');

        if (mode === 'mock') {
          logger.log('Using MockInvoice4uClient (INVOICE4U_MODE=mock)');
          return new MockInvoice4uClient();
        }

        if (mode === 'staging') {
          logger.log(
            `Using SoapInvoice4uClient → STAGING (apiqa.invoice4u.co.il)${dryRun ? ' [DRY-RUN]' : ''}`,
          );
          return new SoapInvoice4uClient(WSDL_STAGING, token, 'staging', dryRun);
        }

        if (mode === 'production') {
          logger.warn(
            `Using SoapInvoice4uClient → PRODUCTION (api.invoice4u.co.il)${dryRun ? ' [DRY-RUN]' : ''} — documents will be FISCAL!`,
          );
          return new SoapInvoice4uClient(
            WSDL_PRODUCTION,
            token,
            'production',
            dryRun,
          );
        }

        logger.warn(
          `Unknown INVOICE4U_MODE=${mode}, falling back to mock`,
        );
        return new MockInvoice4uClient();
      },
    },
  ],
  exports: [DocumentsService],
})
export class DocumentsModule {}
