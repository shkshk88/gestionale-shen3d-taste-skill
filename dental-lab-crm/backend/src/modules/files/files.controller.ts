import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Req,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { FilesService } from './files.service';
import { PrismaService } from '../../prisma/prisma.service';

const MAX_FILE_SIZE = 35 * 1024 * 1024; // 35MB
const ALLOWED_IMAGE_MIMETYPES = [
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/webp',
];

@ApiTags('files')
@Controller('files')
// @UseGuards(AuthGuard('jwt')) // TODO: Re-enable after implementing login
@ApiBearerAuth()
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('upload/:caseId')
  @ApiOperation({ summary: 'Upload file to a case' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (req, file, cb) => {
        const ext = file.originalname.toLowerCase();
        if (
          ALLOWED_IMAGE_MIMETYPES.includes(file.mimetype) ||
          ext.endsWith('.stl') ||
          ext.endsWith('.ply')
        ) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid file type'), false);
        }
      },
    }),
  )
  async uploadFile(
    @Param('caseId') caseId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    // Get user ID from request or find a default user from database
    let userId = req.user?.id;
    if (!userId) {
      // Find first admin or any user as default
      const defaultUser = await this.prisma.user.findFirst({
        where: { role: 'admin' },
        select: { id: true },
      });
      if (!defaultUser) {
        throw new BadRequestException('No default user found in database');
      }
      userId = defaultUser.id;
    }
    return this.filesService.uploadFile(file, caseId, userId);
  }

  @Post('upload-multiple/:caseId')
  @ApiOperation({ summary: 'Upload multiple files to a case' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (req, file, cb) => {
        const ext = file.originalname.toLowerCase();
        if (
          ALLOWED_IMAGE_MIMETYPES.includes(file.mimetype) ||
          ext.endsWith('.stl') ||
          ext.endsWith('.ply')
        ) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid file type'), false);
        }
      },
    }),
  )
  async uploadMultipleFiles(
    @Param('caseId') caseId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    // Get user ID from request or find a default user from database
    let userId = req.user?.id;
    if (!userId) {
      // Find first admin or any user as default
      const defaultUser = await this.prisma.user.findFirst({
        where: { role: 'admin' },
        select: { id: true },
      });
      if (!defaultUser) {
        throw new BadRequestException('No default user found in database');
      }
      userId = defaultUser.id;
    }

    const uploaded = await Promise.all(
      files.map((file) => this.filesService.uploadFile(file, caseId, userId)),
    );

    return uploaded;
  }

  @Get('case/:caseId')
  @ApiOperation({ summary: 'Get all files for a case' })
  async getFilesByCaseId(@Param('caseId') caseId: string) {
    return this.filesService.findByCaseId(caseId);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download a file' })
  async downloadFile(@Param('id') id: string, @Res() res: Response) {
    const result = await this.filesService.getFileStream(id);

    if (!result) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${result.file.fileName}"`);
    res.setHeader('Content-Length', result.file.fileSize);

    result.stream.pipe(res);
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Preview a file (inline, not download)' })
  async previewFile(@Param('id') id: string, @Res() res: Response) {
    const result = await this.filesService.getFileStream(id);

    if (!result) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Determine content type based on file type
    const { file } = result;
    let contentType = 'application/octet-stream';

    if (file.fileType === 'image') {
      // Get extension from filename
      const ext = file.fileName.split('.').pop()?.toLowerCase();
      switch (ext) {
        case 'jpg':
        case 'jpeg':
          contentType = 'image/jpeg';
          break;
        case 'png':
          contentType = 'image/png';
          break;
        case 'webp':
          contentType = 'image/webp';
          break;
        case 'heic':
          contentType = 'image/heic';
          break;
        default:
          contentType = 'image/jpeg';
      }
    } else if (file.fileType === 'stl') {
      contentType = 'application/octet-stream';
    } else if (file.fileType === 'ply') {
      contentType = 'application/octet-stream';
    }

    // Set CORS headers for 3D viewer access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`);
    res.setHeader('Content-Length', file.fileSize);

    result.stream.pipe(res);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a file' })
  async deleteFile(@Param('id') id: string) {
    return this.filesService.softDelete(id);
  }
}
