import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { VisionImportController } from './vision-import.controller';
import { VisionImportService, VISION_PROVIDER } from './vision-import.service';
import { GeminiVisionClient } from './clients/gemini-vision.client';

// Active vision provider. To swap to Claude:
//   1. create ./clients/claude-vision.client.ts (implements VisionProvider)
//   2. replace GeminiVisionClient below with ClaudeVisionClient (both as provider AND useExisting)
// No other file needs to change.
@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [VisionImportController],
  providers: [
    GeminiVisionClient,
    {
      provide: VISION_PROVIDER,
      useExisting: GeminiVisionClient,
    },
    VisionImportService,
  ],
})
export class VisionImportModule {}
