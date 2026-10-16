export type UserRole = 'CLIENT' | 'ARTISAN' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  phone?: string;
  isKycVerified: boolean;
  clientProfile?: ClientProfile;
  artisanProfile?: ArtisanProfile;
  wallet?: Wallet;
  createdAt?: string;
}

export interface ClientProfile {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  avatarUrl?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
}

export interface ArtisanProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  trade: string; // e.g. "Plumber", "Electrician", "Solar Specialist"
  title?: string; // e.g. "Master Electrician"
  bio?: string;
  avatarUrl?: string;
  hourlyRate?: number;
  startingPrice?: number;
  rating: number;
  reviewCount: number;
  completedJobsCount: number;
  isVerified: boolean;
  isAvailable: boolean;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  skills?: string[];
  portfolio?: Array<{ id: string; title: string; imageUrl: string }>;
}

export type JobStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Job {
  id: string;
  clientId: string;
  title: string;
  description: string;
  trade: string;
  location: string;
  latitude?: number;
  longitude?: number;
  budget: number;
  budgetType: 'FIXED' | 'NEGOTIABLE';
  status: JobStatus;
  urgency: 'NORMAL' | 'HIGH' | 'EMERGENCY';
  createdAt: string;
  proposalsCount?: number;
  photos?: string[];
}

export type EscrowState =
  | 'FUNDED'
  | 'WORK_SUBMITTED'
  | 'RELEASED'
  | 'DISPUTED'
  | 'RESOLVED'
  | 'REFUNDED';

export interface Milestone {
  id: string;
  contractId: string;
  stepNumber: number;
  title: string;
  description?: string;
  amount: number;
  status: EscrowState;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  proofDescription?: string;
  proofSubmittedAt?: string;
  proofLatitude?: number;
  proofLongitude?: number;
  releasedAt?: string;
}

export interface Contract {
  id: string;
  jobId: string;
  jobTitle: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  artisanId: string;
  artisanName: string;
  artisanAvatar?: string;
  artisanTrade: string;
  status: 'ACTIVE' | 'PENDING_FUNDING' | 'COMPLETED' | 'DISPUTED';
  totalAmount: number;
  escrowLockedAmount: number;
  currentMilestoneIndex: number;
  milestones: Milestone[];
  startDate: string;
  estimatedCompletionDate?: string;
  location: string;
  clientNotes?: string;
}

export interface Wallet {
  id: string;
  userId: string;
  availableBalance: number;
  escrowLockedBalance: number;
  todayEarnings?: number;
  currency: 'NGN' | 'MON';
}

export interface UrgentJobLead {
  id: string;
  jobId: string;
  title: string;
  description: string;
  trade: string;
  locationName: string;
  distanceKm: number;
  budget: number;
  priority: 'High Priority' | 'Urgent';
  expiresInSeconds: number;
  client: {
    id: string;
    name: string;
    avatarUrl?: string;
    rating: number;
    reviewCount: number;
    isVerified: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
