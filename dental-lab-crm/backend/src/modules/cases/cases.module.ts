import { Module } from '@nestjs/common';
import { CasesService } from './cases.service';
import { CasesController } from './cases.controller';
import { FilesModule } from '../files/files.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [FilesModule, PrismaModule],
  controllers: [CasesController],
  providers: [CasesService],
  exports: [CasesService],
})
export class CasesModule {}
