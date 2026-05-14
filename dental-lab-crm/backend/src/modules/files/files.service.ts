import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CaseFile, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';

export type FileType = 'image' | 'stl' | 'ply' | 'other';

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService) {}

  private getFileType(mimetype: string, filename: string): FileType {
    const ext = path.extname(filename).toLowerCase();

    if (['.jpg', '.jpeg', '.png', '.heic', '.webp'].includes(ext)) {
      return 'image';
    }
    if (ext === '.stl') {
      return 'stl';
    }
    if (ext === '.ply') {
      return 'ply';
    }
    return 'other';
  }

  async uploadFile(
    file: Express.Multer.File,
    caseId: string,
    uploadedBy: string,
  ): Promise<CaseFile> {
    // Verify that the case exists
    const caseExists = await this.prisma.case.findUnique({
      where: { id: caseId },
      select: { id: true },
    });

    if (!caseExists) {
      throw new NotFoundException(`Case with ID ${caseId} not found`);
    }

    // Verify that the user exists
    const userExists = await this.prisma.user.findUnique({
      where: { id: uploadedBy },
      select: { id: true },
    });

    if (!userExists) {
      throw new NotFoundException(`User with ID ${uploadedBy} not found`);
    }

    const fileId = uuidv4();
    const ext = path.extname(file.originalname);
    const fileName = `${fileId}${ext}`;
    const fileType = this.getFileType(file.mimetype, file.originalname);

    // In production, upload to S3/R2/GCS
    // For development, save locally
    const uploadDir = path.join(process.cwd(), 'uploads', caseId);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, file.buffer);

    return this.prisma.caseFile.create({
      data: {
        id: fileId,
        caseId,
        fileName: file.originalname,
        filePath: `/uploads/${caseId}/${fileName}`,
        fileType,
        fileSize: file.size,
        uploadedBy,
      },
    });
  }

  async findByCaseId(caseId: string): Promise<CaseFile[]> {
    return this.prisma.caseFile.findMany({
      where: { caseId, isDeleted: false },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async findById(id: string): Promise<CaseFile | null> {
    return this.prisma.caseFile.findUnique({
      where: { id },
    });
  }

  async softDelete(id: string): Promise<CaseFile> {
    return this.prisma.caseFile.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async getFileStream(id: string): Promise<{ stream: fs.ReadStream; file: CaseFile } | null> {
    const file = await this.findById(id);
    if (!file) return null;

    const absolutePath = path.join(process.cwd(), file.filePath);
    if (!fs.existsSync(absolutePath)) return null;

    return {
      stream: fs.createReadStream(absolutePath),
      file,
    };
  }
}
