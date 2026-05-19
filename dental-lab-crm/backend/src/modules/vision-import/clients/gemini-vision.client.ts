import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  VisionImage,
  VisionProvider,
  VisionProviderResponse,
} from './vision-provider.interface';
import { VisionResultDto } from '../dto/vision-result.dto';

const SYSTEM_PROMPT = `Sei un assistente per un laboratorio odontotecnico. Analizza una o più immagini di **prescrizioni mediche / ricette / moduli d'ordine scritti** dei dentisti.

IMPORTANTE: NON sono RX panoramiche, NON sono ortopantomografie, NON sono foto intraorali. Sono SOLO documenti scritti / prescrizioni cartacee o digitali in cui il dentista descrive il lavoro richiesto al laboratorio.

Estrai SOLO ciò che è esplicitamente scritto nella prescrizione. Non dedurre nulla, non inventare. Se un campo non è scritto chiaramente, lascialo null.

Rispondi SOLO in formato JSON con questa struttura ESATTA:
{
  "patientName": "string|null",          // Nome paziente scritto sulla ricetta
  "dentistName": "string|null",          // Nome del dentista firmatario
  "studioName": "string|null",           // Nome studio dentistico / clinica (intestazione)
  "notes": "string|null",                // Eventuali note libere del dentista (es. "urgente per matrimonio")
  "teeth": [
    {
      "toothNumber": 11-48,              // Numero FDI esplicitamente scritto
      "workType": "corona|protesi|impianto|bite|maryland|intarsio|faccetta|altro",
      "material": "ZR|EMAX|PMMA|RES|CR_CO|CERAM|COMP|ALT",
      "vitaColor": "string|null",        // Es. "A2", "B1", "A3.5"
      "notes": "string|null"
    }
  ],
  "dueDate": "YYYY-MM-DD|null",          // Data consegna richiesta dal dentista
  "priority": "normal|urgent|rush",      // "urgent" o "rush" solo se esplicitamente segnato
  "confidence": 0-1                      // Quanto sei certo dell'estrazione complessiva
}

Schema FDI denti (per validare i numeri):
- Arcata superiore destra: 18 17 16 15 14 13 12 11
- Arcata superiore sinistra: 21 22 23 24 25 26 27 28
- Arcata inferiore sinistra: 31 32 33 34 35 36 37 38
- Arcata inferiore destra: 48 47 46 45 44 43 42 41

Materiali validi (rispetta i codici esatti):
- ZR = Zirconio
- EMAX = Disilicato di Litio (e.max)
- PMMA = Polimetilmetacrilato
- RES = Resina
- CR_CO = Cromo-Cobalto / Metallo-Ceramica con base CrCo
- CERAM = Ceramica
- COMP = Composito
- ALT = Altro

Tipi di lavoro validi:
- corona = corona singola
- protesi = protesi totale / parziale / ponte
- impianto = lavorazione su impianto
- bite = bite occlusale, byte notturno
- maryland = ponte adesivo Maryland
- intarsio = intarsio / inlay / onlay
- faccetta = faccetta estetica / veneer
- altro = qualsiasi cosa non rientri nelle categorie sopra

Regole rigide:
1. Se l'immagine NON è una prescrizione (es. è una RX, una foto di un dente, uno screenshot a caso), rispondi con tutti i campi a null, teeth=[], priority="normal", confidence=0.
2. Se il testo è in mano scritta poco leggibile, usa confidence < 0.6.
3. Non aggiungere mai denti che non sono esplicitamente nominati nella prescrizione.
4. Non inferire il materiale da "il colore A2 sembra una zirconia": deve essere scritto.`;

interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}

interface GeminiResponse {
  candidates?: Array<{ content: { parts: Array<{ text: string }> } }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
}

@Injectable()
export class GeminiVisionClient implements VisionProvider {
  readonly providerName = 'gemini' as const;
  private readonly logger = new Logger(GeminiVisionClient.name);
  private readonly model: string;
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('GEMINI_API_KEY') || '';
    this.model = 'gemini-2.5-flash';
  }

  async analyse(images: VisionImage[]): Promise<VisionProviderResponse> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }
    if (!images.length) {
      throw new Error('No images provided');
    }

    const parts: GeminiPart[] = [{ text: SYSTEM_PROMPT }];
    for (const img of images) {
      parts.push({
        inline_data: {
          mime_type: img.mimeType,
          data: img.buffer.toString('base64'),
        },
      });
    }

    const body = {
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4000,
        responseMimeType: 'application/json',
      },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      this.logger.error(`Gemini API error: ${res.status} ${errText}`);
      throw new Error(`Gemini API error: ${res.status} ${errText.slice(0, 200)}`);
    }

    const data = (await res.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;
    const parsed = JSON.parse(jsonStr) as VisionResultDto;

    return {
      result: this.normalise(parsed),
      usage: {
        tokensIn: data.usageMetadata?.promptTokenCount ?? 0,
        tokensOut: data.usageMetadata?.candidatesTokenCount ?? 0,
        model: this.model,
      },
    };
  }

  private normalise(raw: any): VisionResultDto {
    const validWorkTypes = new Set([
      'corona', 'protesi', 'impianto', 'bite', 'maryland',
      'intarsio', 'faccetta', 'altro',
    ]);
    const validMaterials = new Set([
      'ZR', 'EMAX', 'PMMA', 'RES', 'CR_CO', 'CERAM', 'COMP', 'ALT',
    ]);
    const validPriorities = new Set(['normal', 'urgent', 'rush']);

    const teeth = Array.isArray(raw?.teeth) ? raw.teeth : [];
    const cleanTeeth = teeth
      .filter((t: any) =>
        Number.isFinite(t?.toothNumber) &&
        t.toothNumber >= 11 && t.toothNumber <= 48,
      )
      .map((t: any) => ({
        toothNumber: Math.floor(t.toothNumber),
        workType: validWorkTypes.has(t.workType) ? t.workType : 'altro',
        material: validMaterials.has(t.material) ? t.material : 'ALT',
        vitaColor: typeof t.vitaColor === 'string' ? t.vitaColor : null,
        notes: typeof t.notes === 'string' ? t.notes : null,
      }));

    return {
      patientName: typeof raw?.patientName === 'string' ? raw.patientName : null,
      dentistName: typeof raw?.dentistName === 'string' ? raw.dentistName : null,
      studioName: typeof raw?.studioName === 'string' ? raw.studioName : null,
      notes: typeof raw?.notes === 'string' ? raw.notes : null,
      teeth: cleanTeeth,
      dueDate: typeof raw?.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.dueDate)
        ? raw.dueDate : null,
      priority: validPriorities.has(raw?.priority) ? raw.priority : 'normal',
      confidence: typeof raw?.confidence === 'number'
        ? Math.max(0, Math.min(1, raw.confidence))
        : 0.5,
    };
  }
}
