import api from './api';

export interface VisionToothExtraction {
  toothNumber: number;
  workType: string;
  material: string;
  vitaColor: string | null;
  notes: string | null;
}

export interface VisionResult {
  patientName: string | null;
  dentistName: string | null;
  studioName: string | null;
  notes: string | null;
  teeth: VisionToothExtraction[];
  dueDate: string | null; // 'YYYY-MM-DD'
  priority: 'normal' | 'urgent' | 'rush';
  confidence: number;
}

export interface VisionAnalysisOutput {
  result: VisionResult;
  meta: {
    provider: 'anthropic' | 'gemini';
    model: string;
    tokensIn: number;
    tokensOut: number;
    latencyMs: number;
    auditLogId: string | null;
  };
}

class VisionService {
  async analyseImages(
    files: File[],
    onProgress?: (percent: number) => void,
  ): Promise<VisionAnalysisOutput> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const axiosInstance = api.getAxiosInstance();
    const response = await axiosInstance.post<VisionAnalysisOutput>(
      '/cases/import-from-vision',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 90_000, // vision analysis can take ~10-30s
        onUploadProgress: (evt) => {
          if (onProgress && evt.total) {
            onProgress(Math.round((evt.loaded * 100) / evt.total));
          }
        },
      },
    );
    return response.data;
  }
}

const visionService = new VisionService();
export default visionService;
