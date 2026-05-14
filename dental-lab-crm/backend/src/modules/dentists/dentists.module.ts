import { Module } from '@nestjs/common';
import { DentistsController } from './dentists.controller';
import { DentistsService } from './dentists.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DentistsController],
  providers: [DentistsService],
  exports: [DentistsService],
})
export class DentistsModule {}
