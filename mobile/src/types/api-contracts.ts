/**
 * Fixmate Institutional API Contracts & Domain Interfaces
 * Strictly conforms to Interface Segregation Principle (ISP)
 * and matches Prisma schema & Express API schemas.
 */

export type UserRole = 'CLIENT' | 'ARTISAN' | 'ADMIN';

export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  statusCode: number;
  message?: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface UserSession {
  id: string;
  email: string;
  role: UserRole;
  phone?: string;
  phoneNumber?: string;
  isKycVerified: boolean;
  avatarUrl?: string;
  clientProfile?: ClientProfileData | null;
  artisanProfile?: ArtisanProfileData | null;
  wallet?: WalletData | null;
  createdAt: string;
}

export interface ClientProfileData {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface ArtisanProfileData {
  id: string;
  userId: string;
  trade: string;
  businessName?: string;
  title?: string;
  tagline?: string;
  bio?: string;
  avatarUrl?: string;
  yearsOfExperience?: number;
  startingPrice: number;
  hourlyRate: number;
  rating: number;
  reviewCount: number;
  completedJobsCount: number;
  isVerified: boolean;
  isAvailable: boolean;
  latitude?: number;
  longitude?: number;
  skills: string[];
  portfolio?: PortfolioItem[];
}

export interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
}

export type JobStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type BudgetType = 'FIXED' | 'HOURLY';
export type JobUrgency = 'NORMAL' | 'URGENT' | 'EMERGENCY' | 'LOW' | 'MEDIUM' | 'HIGH';

export interface JobAttachment {
  id: string;
  jobId?: string;
  url?: string;
  fileUrl?: string;
  fileName?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  fileType?: string;
  createdAt?: string;
}

export interface JobRecord {
  id: string;
  clientId: string;
  categoryId?: number;
  category?: { id: number; name: string; slug?: string; iconUrl?: string };
  title: string;
  description: string;
  trade: string;
  location: string;
  state?: string;
  lgaCity?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  budget: number;
  budgetMin?: number;
  budgetMax?: number;
  budgetType: BudgetType;
  urgency: JobUrgency;
  expectedOutcome?: string;
  materialsProvidedBy?: string;
  completionProofReq?: string;
  deadlineDate?: string;
  status: JobStatus;
  proposalsCount?: number;
  attachments?: JobAttachment[];
  client?: {
    id: string;
    email: string;
    avatarUrl?: string;
    clientProfile?: ClientProfileData;
  };
  createdAt: string;
  updatedAt: string;
}

export type ProposalStatus = 'PENDING' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface MilestoneProposal {
  id?: string;
  stepOrder?: number;
  title: string;
  amount: number;
  estimatedDays?: number;
  durationDays?: number;
  dueDate?: string;
}

export interface ProposalRecord {
  id: string;
  jobId: string;
  artisanId: string;
  amount: number;
  bidAmount?: number;
  durationDays: number;
  estimatedDays?: number;
  coverLetter: string;
  status: ProposalStatus;
  milestones?: MilestoneProposal[];
  artisan?: {
    id: string;
    email: string;
    avatarUrl?: string;
    artisanProfile?: ArtisanProfileData;
  };
  job?: JobRecord;
  createdAt: string;
  updatedAt?: string;
}

export interface JobInvitationRecord {
  id: string;
  jobId: string;
  artisanId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: string;
  job?: JobRecord;
  artisan?: {
    id: string;
    email: string;
    avatarUrl?: string;
    artisanProfile?: ArtisanProfileData;
  };
}

export type ContractStatus = 'ACTIVE' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED';
export type MilestoneStatus = 'PENDING' | 'FUNDED' | 'IN_PROGRESS' | 'SUBMITTED' | 'IN_REVIEW' | 'REVISION_REQUESTED' | 'RELEASED' | 'DISPUTED';

export interface MilestoneRecord {
  id: string;
  contractId: string;
  stepOrder?: number;
  title: string;
  description?: string;
  amount: number;
  estimatedDays?: number;
  status: MilestoneStatus;
  dueDate?: string;
  workNotes?: string;
  revisionNotes?: string;
  proofPhotos?: string[];
  submittedAt?: string;
  releasedAt?: string;
  proofAttachments?: Array<{
    url: string;
    fileType: string;
    tag?: 'BEFORE' | 'AFTER' | 'IN_PROGRESS';
  }>;
}

export interface ContractRecord {
  id: string;
  contractCode?: string;
  jobId: string;
  clientId: string;
  artisanId: string;
  title: string;
  totalAmount: number;
  status: ContractStatus;
  milestones: MilestoneRecord[];
  disputeId?: string;
  job?: JobRecord;
  client?: {
    id: string;
    email: string;
    avatarUrl?: string;
    clientProfile?: ClientProfileData;
  };
  artisan?: {
    id: string;
    email: string;
    avatarUrl?: string;
    phoneNumber?: string;
    artisanProfile?: ArtisanProfileData;
    clientProfile?: ClientProfileData;
  };
  startedAt?: string;
  completedAt?: string;
  smartContractAddr?: string;
  onChainEscrowId?: string;
  fundingTxHash?: string;
  escrowFundedAmount?: number;
  escrowReleasedAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WalletData {
  id: string;
  userId: string;
  balance: number;
  escrowLockedBalance: number;
  currency: string;
  monadAddress?: string;
  transactions?: TransactionRecord[];
}

export interface TransactionRecord {
  id: string;
  walletId: string;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'ESCROW_LOCK' | 'ESCROW_RELEASE' | 'REFUND';
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  reference?: string;
  description: string;
  createdAt: string;
}

export interface BankAccountRecord {
  id: string;
  userId: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  bankName: string;
  isDefault: boolean;
}

export interface MessageMetadata {
  duration?: number;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface MessageRecord {
  id: string;
  conversationId: string;
  senderId: string;
  messageType: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'AUDIO' | 'LOCATION' | 'SYSTEM_ALERT' | 'MILESTONE_PROMPT';
  body?: string;
  attachmentUrl?: string;
  metadata?: MessageMetadata;
  isRead?: boolean;
  sender?: {
    id: string;
    email: string;
    avatarUrl?: string;
  };
  createdAt: string;
}

export interface ConversationRecord {
  id: string;
  title?: string;
  jobId?: string;
  contractId?: string;
  job?: { id: string; title: string };
  contract?: { id: string; contractCode: string; status: string };
  participants: Array<{
    userId: string;
    lastReadAt?: string;
    isMuted?: boolean;
    user: {
      id: string;
      email: string;
      avatarUrl?: string;
      clientProfile?: ClientProfileData;
      artisanProfile?: ArtisanProfileData;
    };
  }>;
  messages?: MessageRecord[];
  lastMessage?: MessageRecord;
  lastMessageAt?: string;
  unreadCount?: number;
}
