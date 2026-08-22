export type UserRole = 'CLIENT' | 'ARTISAN' | 'ADMIN' | 'SUPPORT';
export type AccountStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
export type KycStatus = 'UNSUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type IdDocumentType = 'NIN' | 'BVN' | 'DRIVERS_LICENSE' | 'VOTERS_CARD' | 'INTERNATIONAL_PASSPORT';

export type JobStatus = 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
export type BudgetType = 'FIXED' | 'MILESTONE_BASED' | 'HOURLY';
export type ProposalStatus = 'PENDING' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
export type ContractStatus = 'DRAFT' | 'PENDING_FUNDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED' | 'REFUNDED';
export type MilestoneStatus = 'PENDING_FUNDING' | 'FUNDED' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'RELEASED' | 'DISPUTED' | 'CANCELLED';

export type TransactionType = 'WALLET_DEPOSIT' | 'ESCROW_LOCK' | 'ESCROW_RELEASE' | 'ESCROW_REFUND' | 'PAYOUT_WITHDRAWAL' | 'PLATFORM_FEE' | 'BONUS';
export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REVERSED';
export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'AWAITING_EVIDENCE' | 'RESOLVED' | 'CLOSED';
export type DisputeResolution = 'FULL_REFUND_CLIENT' | 'FULL_PAYOUT_ARTISAN' | 'SPLIT_SETTLEMENT' | 'CANCELLED';
export type MessageType = 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'LOCATION' | 'SYSTEM_ALERT' | 'MILESTONE_PROMPT';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface User {
  id: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  status: AccountStatus;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isKycVerified: boolean;
  walletAddress?: string | null;
  avatarUrl?: string | null;
  artisanProfile?: ArtisanProfile | null;
  clientProfile?: ClientProfile | null;
  wallet?: Wallet | null;
  createdAt: string;
}

export interface ArtisanProfile {
  id: string;
  userId: string;
  businessName?: string | null;
  tagline?: string | null;
  bio?: string | null;
  yearsOfExperience: number;
  hourlyRate?: number | string | null;
  state: string;
  lgaCity: string;
  address?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  isAvailable: boolean;
  ratingAvg: number | string;
  reviewCount: number;
  completedJobsCount: number;
  skills?: { skill: Skill }[];
  portfolios?: ArtisanPortfolio[];
  services?: ArtisanService[];
  user?: User;
}

export interface ClientProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  companyName?: string | null;
  state?: string | null;
  city?: string | null;
  address?: string | null;
}

export interface ArtisanPortfolio {
  id: string;
  artisanProfileId: string;
  title: string;
  description?: string | null;
  mediaUrls: string[];
  completionDate?: string | null;
  createdAt: string;
}

export interface ArtisanService {
  id: string;
  artisanProfileId: string;
  title: string;
  description: string;
  price: number | string;
  deliveryDays: number;
  isActive: boolean;
  createdAt: string;
}

export interface JobCategory {
  id: number;
  parentId?: number | null;
  name: string;
  slug: string;
  iconUrl?: string | null;
  isActive: boolean;
  skills?: Skill[];
}

export interface Skill {
  id: number;
  categoryId: number;
  name: string;
  slug: string;
  category?: JobCategory;
}

export interface Job {
  id: string;
  clientId: string;
  categoryId: number;
  title: string;
  description: string;
  budgetType: BudgetType;
  budgetMin: number | string;
  budgetMax: number | string;
  state: string;
  lgaCity: string;
  address?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  expectedOutcome?: string | null;
  materialsProvidedBy?: string | null;
  completionProofReq?: string | null;
  deadlineDate?: string | null;
  status: JobStatus;
  proposalsCount: number;
  createdAt: string;
  updatedAt: string;
  category?: JobCategory;
  skills?: { skill: Skill }[];
  attachments?: JobAttachment[];
  invitations?: JobInvitation[];
  client?: {
    id: string;
    email: string;
    avatarUrl?: string | null;
    clientProfile?: ClientProfile | null;
  };
}

export interface JobAttachment {
  id: string;
  jobId: string;
  fileUrl: string;
  fileName: string;
  fileSizeBytes: string;
  mimeType: string;
}

export interface JobInvitation {
  id: string;
  jobId: string;
  artisanId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: string;
  job?: Job;
  artisan?: {
    id: string;
    email: string;
    avatarUrl?: string | null;
    artisanProfile?: ArtisanProfile | null;
  };
}

export interface Proposal {
  id: string;
  jobId: string;
  artisanId: string;
  coverLetter: string;
  bidAmount: number | string;
  estimatedDays: number;
  status: ProposalStatus;
  createdAt: string;
  updatedAt: string;
  job?: Job;
  artisan?: {
    id: string;
    email: string;
    avatarUrl?: string | null;
    artisanProfile?: ArtisanProfile | null;
  };
  milestones?: ProposalMilestone[];
  contract?: Contract | null;
}

export interface ProposalMilestone {
  id: string;
  proposalId: string;
  stepOrder: number;
  title: string;
  amount: number | string;
  estimatedDays: number;
}

export interface Contract {
  id: string;
  contractCode: string;
  jobId: string;
  proposalId: string;
  clientId: string;
  artisanId: string;
  totalAmount: number | string;
  escrowFundedAmount: number | string;
  escrowReleasedAmount: number | string;
  escrowRefundedAmount: number | string;
  platformFeePercent: number | string;
  platformFeeAmount: number | string;
  status: ContractStatus;
  onChainEscrowId?: number | null;
  smartContractAddr?: string | null;
  fundingTxHash?: string | null;
  releaseTxHash?: string | null;
  refundTxHash?: string | null;
  cryptoAmount?: string | null;
  cryptoCurrency: string;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  job?: Job;
  milestones?: Milestone[];
  client?: {
    id: string;
    email: string;
    avatarUrl?: string | null;
    clientProfile?: ClientProfile | null;
  };
  artisan?: {
    id: string;
    email: string;
    avatarUrl?: string | null;
    artisanProfile?: ArtisanProfile | null;
  };
  disputes?: Dispute[];
  reviews?: Review[];
  conversations?: Conversation[];
  transactions?: Transaction[];
}

export interface Milestone {
  id: string;
  contractId: string;
  stepOrder: number;
  title: string;
  description?: string | null;
  amount: number | string;
  status: MilestoneStatus;
  fundedAt?: string | null;
  submittedAt?: string | null;
  submissionNotes?: string | null;
  beforeProofUrls: string[];
  submissionProofUrls: string[];
  approvedAt?: string | null;
  releasedAt?: string | null;
  dueDate?: string | null;
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  availableBalance: number | string;
  escrowLockedBalance: number | string;
  currency: string;
  transactions?: Transaction[];
}

export interface Transaction {
  id: string;
  walletId: string;
  contractId?: string | null;
  milestoneId?: string | null;
  reference: string;
  paymentGatewayRef?: string | null;
  type: TransactionType;
  amount: number | string;
  fee: number | string;
  netAmount: number | string;
  status: TransactionStatus;
  balanceBefore: number | string;
  balanceAfter: number | string;
  description: string;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  userId: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  isVerified: boolean;
  isDefault: boolean;
  createdAt: string;
}

export interface PayoutRequest {
  id: string;
  userId: string;
  walletId: string;
  bankAccountId: string;
  amount: number | string;
  fee: number | string;
  reference: string;
  status: PayoutStatus;
  failureReason?: string | null;
  processedAt?: string | null;
  createdAt: string;
  bankAccount?: BankAccount;
}

export interface SavedPaymentMethod {
  id: string;
  userId: string;
  gateway: string;
  authorizationCode: string;
  cardBrand: string;
  last4: string;
  expMonth: string;
  expYear: string;
  cardHolderName?: string | null;
  bankName?: string | null;
  isDefault: boolean;
  createdAt: string;
}

export interface KycVerification {
  id: string;
  userId: string;
  documentType: IdDocumentType;
  documentNumber: string;
  documentFrontUrl: string;
  documentBackUrl?: string | null;
  selfieUrl: string;
  status: KycStatus;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface Dispute {
  id: string;
  disputeCode: string;
  contractId: string;
  milestoneId?: string | null;
  initiatedByUserId: string;
  reason: string;
  explanation: string;
  disputedAmount: number | string;
  status: DisputeStatus;
  resolution?: DisputeResolution | null;
  refundToClientAmount: number | string;
  payoutToArtisanAmount: number | string;
  adminResolutionNotes?: string | null;
  onChainResolutionTxHash?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  contract?: Contract;
  evidences?: DisputeEvidence[];
  messages?: DisputeMessage[];
  initiatedByUser?: User;
}

export interface DisputeEvidence {
  id: string;
  disputeId: string;
  uploaderId: string;
  title: string;
  fileUrl: string;
  mimeType: string;
  createdAt: string;
}

export interface DisputeMessage {
  id: string;
  disputeId: string;
  senderId: string;
  body: string;
  attachmentUrls: string[];
  createdAt: string;
  sender: {
    id: string;
    email: string;
    role: UserRole;
    avatarUrl?: string | null;
  };
}

export interface Review {
  id: string;
  contractId: string;
  reviewerId: string;
  revieweeId: string;
  overallRating: number;
  qualityRating?: number | null;
  communicationRating?: number | null;
  punctualityRating?: number | null;
  comment?: string | null;
  artisanReply?: string | null;
  isPublic: boolean;
  createdAt: string;
  reviewer?: {
    id: string;
    avatarUrl?: string | null;
    clientProfile?: ClientProfile | null;
  };
}

export interface Conversation {
  id: string;
  jobId?: string | null;
  contractId?: string | null;
  lastMessageAt: string;
  createdAt: string;
  job?: { id: string; title: string };
  contract?: { id: string; contractCode: string; status: ContractStatus };
  participants: {
    id: string;
    userId: string;
    isMuted: boolean;
    user: {
      id: string;
      email: string;
      avatarUrl?: string | null;
      artisanProfile?: { businessName?: string | null };
      clientProfile?: { firstName: string; lastName: string };
    };
  }[];
  messages?: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  messageType: MessageType;
  body?: string | null;
  attachmentUrl?: string | null;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    email: string;
    avatarUrl?: string | null;
  };
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  actionUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount?: number;
}

export interface AuditLog {
  id: string;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldState?: any;
  newState?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  actor?: {
    id: string;
    email: string;
    role: UserRole;
  } | null;
}

export interface SystemSetting {
  key: string;
  value: string;
  description?: string | null;
  updatedBy?: string | null;
  updatedAt: string;
  admin?: {
    id: string;
    email: string;
  } | null;
}

export interface AdminAnalyticsMetrics {
  totalUsers: number;
  totalArtisans: number;
  totalClients: number;
  pendingKycCount: number;
  totalJobs: number;
  activeJobs: number;
  totalContracts: number;
  activeContracts: number;
  disputedContracts: number;
  completedContracts: number;
  openDisputesCount: number;
  pendingPayoutsCount: number;
  grossVolume: number;
  escrowFundedVolume: number;
  escrowReleasedVolume: number;
  escrowRefundedVolume: number;
  platformFeesEarned: number;
}

export interface AdminAnalyticsOverview {
  metrics: AdminAnalyticsMetrics;
  recentAuditLogs: AuditLog[];
  recentUsers: User[];
  recentContracts: Contract[];
}

