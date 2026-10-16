export interface DiagnosticBOMItem {
  name: string;
  quantity: number;
  specification?: string;
  estimatedCostRange: {
    min: number;
    max: number;
    currency: string;
  };
}

export interface DiagnosticClarificationQuestion {
  id: string;
  question: string;
  context?: string;
  options: Array<{
    label: string;
    value: string;
  }>;
}

export interface MatchedArtisanDossier {
  artisanId: string;
  name: string;
  avatarUrl?: string;
  trade: string;
  kycTier?: number;
  matchScore: number;
  distanceKm: number;
  hourlyRate: number;
  rating: number;
  completedJobsCount: number;
  aiFitReason: string;
}

export interface DiagnosticSessionRecord {
  id: string;
  userId?: string;
  status: 'PENDING' | 'DIAGNOSED' | 'CLARIFYING' | 'MATCHED' | 'DISPATCHED';
  initialInputText?: string;
  mediaUrls: string[];
  audioTranscript?: string;
  detectedTrade: string;
  severity: 'ROUTINE' | 'URGENT' | 'LIFE_SAFETY_EMERGENCY';
  hazardWarning?: string;
  explanation: string;
  conversationalReply?: string;
  diyFeasible: boolean;
  diySteps?: string[];
  estimatedLaborCost: { min: number; max: number };
  billOfMaterials: DiagnosticBOMItem[];
  clarificationQueue?: DiagnosticClarificationQuestion[];
  matchedArtisans?: MatchedArtisanDossier[];
  createdAt: string;
  guestAccessToken?: string;
  clarificationOptions?: string[];
  diagnosticStatus?: string;
  isResolved?: boolean;
}

export interface DiagnoseRequestPayload {
  promptText?: string;
  audioUri?: string;
  imageUris?: string[];
  latitude?: number;
  longitude?: number;
  address?: string;
}
