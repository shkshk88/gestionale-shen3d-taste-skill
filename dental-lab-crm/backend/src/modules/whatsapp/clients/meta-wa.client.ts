import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MetaTemplateSendParams {
  toPhone: string;
  templateName: string;
  language: string;
  bodyParameters: string[];
}

export interface MetaSendResult {
  messageId: string;
  raw: any;
}

interface MetaApiResponse {
  messages?: Array<{ id: string }>;
  error?: { code: number; message: string };
}

@Injectable()
export class MetaWaClient {
  private readonly logger = new Logger(MetaWaClient.name);
  private readonly phoneNumberId: string;
  private readonly accessToken: string;
  private readonly graphVersion = 'v21.0';

  constructor(private readonly config: ConfigService) {
    this.phoneNumberId = this.config.get<string>('META_WA_PHONE_NUMBER_ID') || '';
    this.accessToken = this.config.get<string>('META_WA_ACCESS_TOKEN') || '';
  }

  isConfigured(): boolean {
    return !!this.phoneNumberId && !!this.accessToken;
  }

  async sendTemplate(params: MetaTemplateSendParams): Promise<MetaSendResult> {
    if (!this.isConfigured()) {
      throw new Error('Meta WhatsApp client not configured (missing env vars)');
    }

    const url = `https://graph.facebook.com/${this.graphVersion}/${this.phoneNumberId}/messages`;
    const body = {
      messaging_product: 'whatsapp',
      to: params.toPhone,
      type: 'template',
      template: {
        name: params.templateName,
        language: { code: params.language },
        components: params.bodyParameters.length
          ? [
              {
                type: 'body',
                parameters: params.bodyParameters.map((text) => ({
                  type: 'text',
                  text,
                })),
              },
            ]
          : [],
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as MetaApiResponse;

    if (!res.ok || data.error) {
      const code = data.error?.code ?? res.status;
      const msg = data.error?.message ?? res.statusText;
      this.logger.error(
        `Meta WA send failed (code=${code}): ${msg}. Payload: ${JSON.stringify(body)}`,
      );
      throw new Error(`Meta API error ${code}: ${msg}`);
    }

    const messageId = data.messages?.[0]?.id ?? '';
    return { messageId, raw: data };
  }
}
