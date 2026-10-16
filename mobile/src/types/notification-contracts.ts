export type NotificationType =
  | 'LEAD_DISPATCH'
  | 'BID_RECEIVED'
  | 'MILESTONE_FUNDED'
  | 'PROOF_SUBMITTED'
  | 'RELEASE_APPROVED'
  | 'DISPUTE_RAISED'
  | 'SYSTEM';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}
