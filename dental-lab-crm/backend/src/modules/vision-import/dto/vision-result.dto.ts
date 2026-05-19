// Result returned by any vision provider after analysing one or more images.
// Shape mirrors what the frontend ImportVisionPage will use to pre-fill the
// Nuovo Caso form, so the operator only has to confirm/adjust.

export interface VisionToothExtraction {
  toothNumber: number; // FDI: 11-48
  workType: string; // 'corona' | 'protesi' | 'impianto' | 'bite' | 'maryland' | 'intarsio' | 'faccetta' | 'altro'
  material: string; // 'ZR' | 'EMAX' | 'PMMA' | 'RES' | 'CR_CO' | 'CERAM' | 'COMP' | 'ALT'
  vitaColor: string | null;
  notes: string | null;
}

export interface VisionResultDto {
  patientName: string | null;
  dentistName: string | null;
  studioName: string | null;
  notes: string | null;
  teeth: VisionToothExtraction[];
  dueDate: string | null; // 'YYYY-MM-DD'
  priority: 'normal' | 'urgent' | 'rush';
  confidence: number; // 0..1
}

export interface VisionAnalysisOutput {
  result: VisionResultDto;
  meta: {
    provider: 'anthropic' | 'gemini';
    model: string;
    tokensIn: number;
    tokensOut: number;
    latencyMs: number;
    auditLogId: string | null;
  };
}
