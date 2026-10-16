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
export type JobUrgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';

export interface JobAttachment {
  id: string;
  url: string;
  fileType: string;
}

export interface JobRecord {
  id: string;
  clientId: string;
  title: string;
  description: string;
  trade: string;
  location: string;
  latitude?: number;
  longitude?: number;
  budget: number;
  budgetType: BudgetType;
  urgency: JobUrgency;
  status: JobStatus;
  proposalsCount?: number;
  attachments?: JobAttachment[];
  client?: {
    id: string;
    email: string;
    clientProfile?: ClientProfileData;
  };
  createdAt: string;
  updatedAt: string;
}

export type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface MilestoneProposal {
  title: string;
  amount: number;
  durationDays?: number;
  dueDate?: string;
}

export interface ProposalRecord {
  id: string;
  jobId: string;
  artisanId: string;
  amount: number;
  durationDays: number;
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
}

export type ContractStatus = 'ACTIVE' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED';
export type MilestoneStatus = 'PENDING' | 'FUNDED' | 'IN_PROGRESS' | 'SUBMITTED' | 'IN_REVIEW' | 'REVISION_REQUESTED' | 'RELEASED';

export interface MilestoneRecord {
  id: string;
  contractId: string;
  title: string;
  amount: number;
  status: MilestoneStatus;
  dueDate?: string;
  workNotes?: string;
  revisionNotes?: string;
  proofAttachments?: Array<{
    url: string;
    fileType: string;
    tag?: 'BEFORE' | 'AFTER' | 'IN_PROGRESS';
  }>;
}

export interface ContractRecord {
  id: string;
  jobId: string;
  clientId: string;
  artisanId: string;
  title: string;
  totalAmount: number;
  status: ContractStatus;
  milestones: MilestoneRecord[];
  disputeId?: string;
  client?: {
    id: string;
    email: string;
    clientProfile?: ClientProfileData;
  };
  artisan?: {
    id: string;
    email: string;
    artisanProfile?: ArtisanProfileData;
  };
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

export interface MessageRecord {
  id: string;
  conversationId: string;
  senderId: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'LOCATION' | 'AUDIO';
  body: string;
  attachmentUrl?: string;
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
  participants: Array<{
    userId: string;
    user: {
      id: string;
      email: string;
      avatarUrl?: string;
      clientProfile?: ClientProfileData;
      artisanProfile?: ArtisanProfileData;
    };
  }>;
  lastMessage?: MessageRecord;
  lastMessageAt?: string;
  unreadCount?: number;
}
