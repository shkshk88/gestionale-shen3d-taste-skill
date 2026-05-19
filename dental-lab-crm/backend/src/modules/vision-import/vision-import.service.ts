import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VisionProvider, VisionImage } from './clients/vision-provider.interface';
import { VisionAnalysisOutput } from './dto/vision-result.dto';

// DI token for the swappable VisionProvider implementation.
// Bound to the concrete client in vision-import.module.ts.
export const VISION_PROVIDER = 'VISION_PROVIDER';

// Rough Gemini 2.5 Flash pricing (input $0.075/Mtok, output $0.30/Mtok)
// Used only as audit estimate; not billed.
const GEMINI_INPUT_PER_MTOK = 0.075;
const GEMINI_OUTPUT_PER_MTOK = 0.30;

@Injectable()
export class VisionImportService {
  private readonly logger = new Logger(VisionImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(VISION_PROVIDER) private readonly provider: VisionProvider,
  ) {}

  async analyseImages(
    files: Express.Multer.File[],
  ): Promise<VisionAnalysisOutput> {
    if (!files?.length) {
      throw new Error('No images provided');
    }

    const images: VisionImage[] = files.map((f) => ({
      buffer: f.buffer,
      mimeType: f.mimetype,
    }));

    const startedAt = Date.now();
    let auditLogId: string | null = null;

    try {
      const { result, usage } = await this.provider.analyse(images);
      const latencyMs = Date.now() - startedAt;

      const costUsd = this.estimateCost(this.provider.providerName, usage.tokensIn, usage.tokensOut);

      // Audit log (non-fatal: if it fails, we still return the result)
      try {
        const audit = await this.prisma.lLMAuditLog.create({
          data: {
            provider: this.provider.providerName,
            model: usage.model,
            operation: 'vision_import',
            tokensIn: usage.tokensIn,
            tokensOut: usage.tokensOut,
            costUsd: costUsd as any, // Prisma Decimal accepts number/string
            latencyMs,
            confidence: result.confidence,
            success: true,
          },
        });
        auditLogId = audit.id;
      } catch (auditErr) {
        this.logger.error('Failed to write LLMAuditLog (non-fatal)', auditErr as any);
      }

      return {
        result,
        meta: {
          provider: this.provider.providerName,
          model: usage.model,
          tokensIn: usage.tokensIn,
          tokensOut: usage.tokensOut,
          latencyMs,
          auditLogId,
        },
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startedAt;
      // Best-effort error audit
      try {
        await this.prisma.lLMAuditLog.create({
          data: {
            provider: this.provider.providerName,
            model: 'unknown',
            operation: 'vision_import',
            tokensIn: 0,
            tokensOut: 0,
            latencyMs,
            success: false,
            errorMsg: String(err?.message || err).slice(0, 500),
          },
        });
      } catch {
        /* ignore audit failure on failure path */
      }
      throw err;
    }
  }

  private estimateCost(provider: 'gemini' | 'anthropic', tokensIn: number, tokensOut: number): number {
    if (provider === 'gemini') {
      return (tokensIn / 1_000_000) * GEMINI_INPUT_PER_MTOK
           + (tokensOut / 1_000_000) * GEMINI_OUTPUT_PER_MTOK;
    }
    // Anthropic Haiku 4.5 pricing placeholder; tune when swapping in.
    return (tokensIn / 1_000_000) * 1.0 + (tokensOut / 1_000_000) * 5.0;
  }
}
