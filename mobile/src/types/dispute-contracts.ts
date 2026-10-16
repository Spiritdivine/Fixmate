export type DisputeStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'ARBITRATION_HEARING'
  | 'RESOLVED'
  | 'DISMISSED';

export interface DisputeEvidenceRecord {
  id: string;
  senderRole: 'CLIENT' | 'ARTISAN' | 'ARBITER';
  senderName: string;
  comment: string;
  attachments?: Array<{ url: string; fileType: string }>;
  createdAt: string;
}

export interface DisputeRecord {
  id: string;
  contractId: string;
  milestoneId?: string;
  jobTitle?: string;
  claimantId: string;
  respondentId: string;
  reason: 'POOR_QUALITY' | 'INCOMPLETE_WORK' | 'ABANDONMENT' | 'PROPERTY_DAMAGE' | 'OVERCHARGING' | string;
  description: string;
  amountInDispute: number;
  status: DisputeStatus;
  evidence?: DisputeEvidenceRecord[];
  arbiterVerdict?: {
    resolvedAt: string;
    refundToClientAmount: number;
    payoutToArtisanAmount: number;
    explanation: string;
  };
  createdAt: string;
}

export interface CreateDisputePayload {
  contractId: string;
  milestoneId?: string;
  reason: string;
  description: string;
  explanation?: string;
  evidenceUrls?: string[];
  category?: string;
  requestedResolution?: string;
}
