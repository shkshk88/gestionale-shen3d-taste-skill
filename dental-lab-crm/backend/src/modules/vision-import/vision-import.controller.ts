import {
  BadRequestException,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { VisionImportService } from './vision-import.service';
import { VisionAnalysisOutput } from './dto/vision-result.dto';

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per image
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
]);

@ApiTags('vision-import')
@Controller('cases/import-from-vision')
export class VisionImportController {
  constructor(private readonly service: VisionImportService) {}

  @Post()
  @ApiOperation({ summary: 'Analyse 1-5 images and extract case data via AI' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', MAX_FILES, {
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (req, file, cb) => {
        if (ALLOWED_MIME.has(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`Unsupported mime type: ${file.mimetype}`), false);
        }
      },
    }),
  )
  async importFromVision(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<VisionAnalysisOutput> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Upload at least one image');
    }
    return this.service.analyseImages(files);
  }
}
