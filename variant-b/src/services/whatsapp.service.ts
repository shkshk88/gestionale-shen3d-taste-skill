import api from './api';

export interface WhatsAppStatus {
  autoSendEnabled: boolean;
  shadowMode: boolean;
  metaConfigured: boolean;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  language: string;
  category: string;
  bodyTemplate: string;
  variables: string[];
  metaStatus: 'pending' | 'approved' | 'rejected';
  metaRejectionReason: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppMessage {
  id: string;
  caseId: string | null;
  direction: 'outbound' | 'inbound';
  toPhone: string | null;
  fromPhone: string | null;
  templateName: string | null;
  bodyText: string | null;
  variables: Record<string, string> | null;
  metaMessageId: string | null;
  status: string;
  errorCode: string | null;
  errorMsg: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  responseAt: string | null;
  shadowOnly: boolean;
  createdAt: string;
}

export interface VerifyResult {
  status: 'verified' | 'incomplete';
  missingItems: { type: string; description: string; toothNumber?: number }[];
  recommendedTemplate: string | null;
  templateVariables: Record<string, string>;
  destinationPhone: string | null;
  notes: string;
}

export interface OrchestrationResult {
  caseId: string;
  caseNumber: string;
  verification: {
    status: 'verified' | 'incomplete';
    missingItems: string[];
    recommendedTemplate: string | null;
  };
  sendOutcome:
    | { skipped: true; reason: string }
    | { skipped: false; messageDbId: string; shadowOnly: boolean; status: string };
}

class WhatsAppService {
  getStatus(): Promise<WhatsAppStatus> {
    return api.get<WhatsAppStatus>('/whatsapp/status');
  }

  setAutoSend(enabled: boolean): Promise<WhatsAppStatus> {
    return api.post<WhatsAppStatus>('/whatsapp/settings/auto-send', { enabled });
  }

  listTemplates(): Promise<WhatsAppTemplate[]> {
    return api.get<WhatsAppTemplate[]>('/whatsapp/templates');
  }

  listMessages(opts: { caseId?: string; limit?: number } = {}): Promise<WhatsAppMessage[]> {
    return api.get<WhatsAppMessage[]>('/whatsapp/messages', {
      params: { caseId: opts.caseId, limit: opts.limit ?? 100 },
    });
  }

  verifyCase(caseId: string): Promise<VerifyResult> {
    return api.post<VerifyResult>(`/whatsapp/verify/${caseId}`);
  }

  triggerCase(caseId: string): Promise<OrchestrationResult> {
    return api.post<OrchestrationResult>(`/whatsapp/trigger/${caseId}`);
  }
}

export default new WhatsAppService();
