export interface SubmitReviewPayload {
  contractId: string;
  artisanId: string;
  rating: number;
  comment: string;
  tags?: string[];
  tipAmount?: number;
}

export interface ReviewRecord {
  id: string;
  contractId: string;
  clientName: string;
  clientAvatar?: string;
  rating: number;
  comment: string;
  tags?: string[];
  createdAt: string;
}
