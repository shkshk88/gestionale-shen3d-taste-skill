import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { DocumentsService } from './documents.service';
import { DocumentsPdfService } from './documents.pdf.service';
import {
  CreateFromCasesDto,
  ListDocumentsQuery,
  UpdateDocumentDto,
} from './dto/create-document.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('documents')
export class DocumentsController {
  private readonly logger = new Logger(DocumentsController.name);

  constructor(
    private readonly service: DocumentsService,
    private readonly pdfService: DocumentsPdfService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  list(@Query() q: ListDocumentsQuery) {
    return this.service.list({
      ...q,
      skip: q.skip ? Number(q.skip) : undefined,
      take: q.take ? Number(q.take) : undefined,
    });
  }

  @Get('aggregate')
  aggregate(@Query() q: ListDocumentsQuery) {
    return this.service.aggregateByDate(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('from-cases')
  async createFromCases(
    @Body() body: CreateFromCasesDto,
    @Req() req: Request,
  ) {
    const userId = await this.resolveUserId(req);
    return this.service.createFromCases(body, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateDocumentDto) {
    return this.service.update(id, body);
  }

  @Post(':id/issue')
  issue(@Param('id') id: string) {
    return this.service.issue(id);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('preview-report')
  async previewReport(
    @Body() body: { clientId: string; caseIds: string[] },
    @Res() res: Response,
  ) {
    if (!body.clientId || !Array.isArray(body.caseIds) || body.caseIds.length === 0) {
      return res
        .status(400)
        .json({ message: 'clientId e caseIds[] richiesti' });
    }
    const buffer = await this.pdfService.generateUnbilledReport(
      body.clientId,
      body.caseIds,
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'inline; filename="report-da-approvare.pdf"',
    );
    res.send(buffer);
  }

  @Get(':id/pdf')
  async getPdf(@Param('id') id: string, @Res() res: Response) {
    const doc = await this.service.findOne(id);

    // Fase C: se invoice4u synced, ridirezione al PDF ufficiale
    if (doc.invoice4uUniqueId) {
      const url = `https://newview.invoice4u.co.il/Views/PDF.aspx?docid=${doc.invoice4uUniqueId}`;
      return res.redirect(url);
    }

    // Fase B: PDF promemoria locale
    const buffer = await this.pdfService.generate(id);
    const filename = `${doc.documentNumber || 'draft'}-${doc.id.slice(0, 8)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.send(buffer);
  }

  /**
   * In DEV mode (no JWT) we pick the first admin user as creator.
   * When real auth is restored, derive from req.user.
   */
  private async resolveUserId(req: Request): Promise<string> {
    const user = (req as any).user;
    if (user?.id) return user.id;
    // Fallback for build mode without auth
    const admin = await this.prisma.user.findFirst({
      where: { role: { in: ['admin', 'operator'] } },
      select: { id: true },
    });
    if (!admin) {
      throw new Error('Nessun admin trovato per creare il documento');
    }
    return admin.id;
  }
}
