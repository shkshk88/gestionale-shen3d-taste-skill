import api from './api';

export interface UnbilledCaseTooth {
  toothNumber: number;
  workType: string;
  material: string;
  unitPrice: number | null;
}

export interface UnbilledCase {
  id: string;
  caseNumber: string;
  patientName: string | null;
  shippedDate: string | null;
  receivedDate: string;
  priority: 'normal' | 'urgent' | 'rush';
  totalPrice: number;
  teethCount: number;
  teeth: UnbilledCaseTooth[];
}

export interface UnbilledGroup {
  client: {
    id: string;
    studioName: string;
    contactPerson: string | null;
    logoUrl: string | null;
    email: string | null;
    whatsapp: string | null;
    phone: string | null;
  };
  cases: UnbilledCase[];
  totalAmount: number;
  casesCount: number;
  teethCount: number;
}

class BillingService {
  listUnbilledCases(): Promise<UnbilledGroup[]> {
    return api.get<UnbilledGroup[]>('/cases/unbilled');
  }
}

export default new BillingService();
