export type MissingItemType =
  | 'file'
  | 'vitaColor'
  | 'material'
  | 'workType'
  | 'dentist'
  | 'patient'
  | 'teeth'
  | 'dueDate';

export interface MissingItem {
  type: MissingItemType;
  description: string;
  toothNumber?: number;
}

export type VerificationStatus = 'verified' | 'incomplete';

export interface CaseVerificationResult {
  status: VerificationStatus;
  missingItems: MissingItem[];
  recommendedTemplate: string | null;
  templateVariables: Record<string, string>;
  destinationPhone: string | null;
  notes: string;
}
