import { VisionResultDto } from '../dto/vision-result.dto';

export interface VisionImage {
  buffer: Buffer;
  mimeType: string; // 'image/jpeg' | 'image/png' | 'image/webp' | ...
}

export interface VisionProviderUsage {
  tokensIn: number;
  tokensOut: number;
  model: string;
}

export interface VisionProviderResponse {
  result: VisionResultDto;
  usage: VisionProviderUsage;
}

/**
 * Generic vision provider. Implementations:
 *  - GeminiVisionClient (default)
 *  - ClaudeVisionClient (drop-in swap, see vision-import.service)
 *
 * To switch provider, only the wiring in vision-import.module.ts changes.
 */
export interface VisionProvider {
  readonly providerName: 'anthropic' | 'gemini';
  analyse(images: VisionImage[]): Promise<VisionProviderResponse>;
}
