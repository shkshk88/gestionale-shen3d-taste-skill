import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Req,
  BadRequestException
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { CasesService } from './cases.service';
import { FilesService } from '../files/files.service';
import { PrismaService } from '../../prisma/prisma.service';

export type CaseStatus = 'received' | 'in_progress' | 'qc' | 'shipped' | 'delivered';

@ApiTags('cases')
@Controller('cases')
// SECURITY TODO: re-enable JWT guard when real login is implemented.
// Currently the frontend portal manually passes clientId in query for scoping (see B-02 audit fix).
// Until JWT is back, a malicious client could call /cases without clientId and see everything.
// @UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class CasesController {
  constructor(
    private readonly casesService: CasesService,
    private readonly filesService: FilesService,
    private readonly prisma: PrismaService,
  ) {}

  // Health check endpoint for Railway
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  async health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'shen3d-backend',
    };
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get cases statistics' })
  async getStatistics() {
    return this.casesService.getStatistics();
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get cases statistics summary' })
  async getStatisticsSummary() {
    return this.casesService.getStatistics();
  }

  @Get('number/:caseNumber')
  @ApiOperation({ summary: 'Get case by case number' })
  async findByCaseNumber(@Param('caseNumber') caseNumber: string) {
    return this.casesService.findByCaseNumber(caseNumber);
  }

  @Get()
  @ApiOperation({ summary: 'Get all cases' })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Req() req: any,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: CaseStatus,
    @Query('clientId') clientId?: string,
    @Query('search') search?: string,
  ) {
    const user = req.user;
    const where: any = {};

    // If user is a client, only show their cases
    if (user && user.role === 'client' && user.clientId) {
      where.clientId = user.clientId;
    } else if (clientId) {
      where.clientId = clientId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { caseNumber: { contains: search, mode: 'insensitive' } },
        { patientName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [cases, total] = await Promise.all([
      this.casesService.findAll({
        skip: skip ? parseInt(skip) : undefined,
        take: take ? parseInt(take) : undefined,
        where,
      }),
      this.casesService.count(where),
    ]);

    return { data: cases, total };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get case by ID' })
  async findOne(@Param('id') id: string) {
    return this.casesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new case' })
  async create(@Req() req: any, @Body() data: any) {
    // TODO: Get real user ID after implementing auth
    const userId = req.user?.id || (await this.prisma.user.findFirst({ where: { role: 'admin' } }))?.id;

    if (!userId) {
      throw new BadRequestException('No user ID found - cannot create case');
    }

    const caseNumber = await this.casesService.generateCaseNumber();

    // Extract clientId, dentistId and teeth from data to avoid conflicts
    const { clientId, dentistId, teeth, ...caseData } = data;

    // Validate required fields
    if (!clientId) {
      throw new BadRequestException('clientId is required');
    }
    // dueDate is OPTIONAL — frontend may submit a case without delivery date

    const newCase = await this.casesService.create({
      ...caseData,
      caseNumber,
      // createdBy is set automatically by Prisma through the creator relation
      creator: { connect: { id: userId } },
      client: { connect: { id: clientId } },
      ...(dentistId ? { dentist: { connect: { id: dentistId } } } : {}),
      teeth: teeth ? {
        create: teeth.map((tooth: any) => ({
          toothNumber: tooth.toothNumber,
          workType: tooth.workType,
          material: tooth.material,
          vitaColor: tooth.vitaColor,
          unitPrice: tooth.unitPrice,
          notes: tooth.notes,
        })),
      } : undefined,
    });

    // Timeline creation is non-fatal — if case_timeline table is missing in production the case still saves.
    try {
      await this.prisma.caseTimeline.create({
        data: {
          caseId: newCase.id,
          eventType: 'created',
          eventData: JSON.stringify({ createdBy: req.user?.name || 'System' }),
          userId,
        },
      });
    } catch (e) {
      console.error('Timeline creation failed (non-fatal):', e);
    }

    return newCase;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update case' })
  async update(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    // Extract clientId, dentistId and teeth from data
    const { clientId, dentistId, teeth, ...caseData } = data;

    // If teeth are provided, we need to delete old teeth and create new ones
    if (teeth) {
      // Use transaction to ensure atomicity
      return this.prisma.$transaction(async (prisma) => {
        // Delete existing teeth
        await prisma.caseTooth.deleteMany({
          where: { caseId: id },
        });

        // Update case with new teeth
        const updatedCase = await prisma.case.update({
          where: { id },
          data: {
            ...caseData,
            ...(clientId ? { client: { connect: { id: clientId } } } : {}),
            ...(dentistId ? { dentist: { connect: { id: dentistId } } } : {}),
            teeth: {
              create: teeth.map((tooth: any) => ({
                toothNumber: tooth.toothNumber,
                workType: tooth.workType,
                material: tooth.material,
                vitaColor: tooth.vitaColor,
                unitPrice: tooth.unitPrice,
                notes: tooth.notes,
              })),
            },
          },
          include: {
            client: true,
            teeth: true,
            files: true,
          },
        });

        // Add timeline event
        const userId = req.user?.id || (await prisma.user.findFirst({ where: { role: 'admin' } }))?.id;
        await prisma.caseTimeline.create({
          data: {
            caseId: id,
            eventType: 'note_added',
            eventData: JSON.stringify({ action: 'case_updated' }),
            userId,
          },
        });

        return updatedCase;
      });
    }

    // If no teeth, just update the case data
    return this.casesService.update(id, {
      ...caseData,
      ...(clientId ? { client: { connect: { id: clientId } } } : {}),
      ...(dentistId ? { dentist: { connect: { id: dentistId } } } : {}),
    });
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update case status' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: CaseStatus,
    @Req() req: any,
  ) {
    const userId = req.user?.id || (await this.prisma.user.findFirst({ where: { role: 'admin' } }))?.id;
    return this.casesService.updateStatus(id, status, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete case' })
  async remove(@Param('id') id: string) {
    return this.casesService.delete(id);
  }

  // ============ FILE ENDPOINTS ============

  @Post(':id/files')
  @ApiOperation({ summary: 'Upload files to a case' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    }),
  )
  async uploadFiles(
    @Param('id') caseId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const userId = req.user?.id || (await this.prisma.user.findFirst({ where: { role: 'admin' } }))?.id;

    const uploaded = await Promise.all(
      files.map((file) => this.filesService.uploadFile(file, caseId, userId)),
    );

    // Add timeline event
    await this.prisma.caseTimeline.create({
      data: {
        caseId,
        eventType: 'file_uploaded',
        eventData: JSON.stringify({ fileCount: files.length, fileNames: files.map(f => f.originalname) }),
        userId,
      },
    });

    return uploaded;
  }

  @Get(':id/files')
  @ApiOperation({ summary: 'Get all files for a case' })
  async getCaseFiles(@Param('id') caseId: string) {
    return this.filesService.findByCaseId(caseId);
  }

  @Delete(':id/files/:fileId')
  @ApiOperation({ summary: 'Delete a file from a case' })
  async deleteCaseFile(@Param('id') caseId: string, @Param('fileId') fileId: string) {
    return this.filesService.softDelete(fileId);
  }

  // ============ MESSAGE ENDPOINTS ============

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message in a case' })
  async sendMessage(
    @Param('id') caseId: string,
    @Body() body: { messageText: string; fileId?: string },
    @Req() req: any,
  ) {
    const userId = req.user?.id || (await this.prisma.user.findFirst({ where: { role: 'admin' } }))?.id;

    const message = await this.prisma.caseMessage.create({
      data: {
        caseId,
        senderId: userId,
        messageText: body.messageText,
        messageType: body.fileId ? 'file' : 'text',
        fileId: body.fileId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        file: true,
      },
    });

    // Add timeline event
    await this.prisma.caseTimeline.create({
      data: {
        caseId,
        eventType: 'message_sent',
        eventData: JSON.stringify({ messageId: message.id }),
        userId,
      },
    });

    return message;
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get all messages for a case' })
  async getCaseMessages(@Param('id') caseId: string) {
    return this.prisma.caseMessage.findMany({
      where: { caseId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        file: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  @Post(':id/messages/mark-read')
  @ApiOperation({ summary: 'Mark all messages as read' })
  async markMessagesAsRead(@Param('id') caseId: string, @Req() req: any) {
    const userId = req.user?.id || (await this.prisma.user.findFirst({ where: { role: 'admin' } }))?.id;

    await this.prisma.caseMessage.updateMany({
      where: {
        caseId,
        senderId: { not: userId },
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return { success: true };
  }
}
