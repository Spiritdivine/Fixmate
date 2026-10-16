import { Platform } from 'react-native';
import { apiClient } from '../lib/api-client';
import { ApiResponse } from '../types/api-contracts';
import {
  DiagnosticSessionRecord,
  DiagnoseRequestPayload,
  MatchedArtisanDossier,
  DiagnosticBOMItem,
} from '../types/ai-contracts';

async function convertUriToBlob(uri: string, defaultMime = 'image/jpeg'): Promise<Blob> {
  if (uri.startsWith('data:')) {
    const parts = uri.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : defaultMime;
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }
  const res = await fetch(uri);
  return await res.blob();
}

/**
 * AiService (SRP):
 * Bridges mobile client to backend multimodal diagnostic engine,
 * interactive triage clarification, and 5-pillar matching.
 */
export class AiService {
  static async diagnose(payload: DiagnoseRequestPayload): Promise<DiagnosticSessionRecord> {
    const formData = new FormData();

    if (payload.promptText) {
      formData.append('textPrompt', payload.promptText);
      formData.append('prompt', payload.promptText);
    }
    if (payload.latitude && payload.longitude) {
      formData.append('latitude', String(payload.latitude));
      formData.append('longitude', String(payload.longitude));
    }
    if (payload.address) {
      formData.append('address', payload.address);
    }

    if (payload.audioUri) {
      if (Platform.OS === 'web') {
        try {
          const audioBlob = await convertUriToBlob(payload.audioUri, 'audio/webm');
          formData.append('voice', audioBlob, 'voice_note.webm');
        } catch (e) {
          console.warn('[AiService] Failed to convert audio on web:', e);
        }
      } else {
        const audioBlob = {
          uri: payload.audioUri,
          name: 'voice_note.m4a',
          type: 'audio/m4a',
        } as unknown as Blob;
        formData.append('voice', audioBlob);
      }
    }

    if (payload.imageUris && payload.imageUris.length > 0) {
      for (let idx = 0; idx < Math.min(payload.imageUris.length, 4); idx++) {
        const uri = payload.imageUris[idx];
        if (Platform.OS === 'web') {
          try {
            const imgBlob = await convertUriToBlob(uri, 'image/jpeg');
            formData.append('photos', imgBlob, `defect_photo_${idx + 1}.jpg`);
          } catch (e) {
            console.warn('[AiService] Failed to convert image on web:', e);
          }
        } else {
          const photoBlob = {
            uri,
            name: `defect_photo_${idx + 1}.jpg`,
            type: 'image/jpeg',
          } as unknown as Blob;
          formData.append('photos', photoBlob);
        }
      }
    }

    const response = await apiClient.post<ApiResponse<any>>(
      '/ai/diagnose',
      formData,
      {
        timeout: 60000,
      }
    );
    const raw = response.data.data;
    if (!raw) return raw;

    const safetyFirst = Array.isArray(raw.diagnosis?.safetyInstructions)
      ? raw.diagnosis?.safetyInstructions[0]?.action
      : typeof raw.diagnosis?.safetyInstructions === 'string'
      ? raw.diagnosis?.safetyInstructions
      : undefined;

    return {
      ...raw,
      id: raw.session?.id || raw.id,
      explanation: raw.conversationalReply || raw.diagnosis?.conversationalReply || raw.session?.probableCause || raw.explanation || 'Diagnosis completed.',
      detectedTrade: raw.category?.name || raw.diagnosis?.categorySlug || raw.detectedTrade || 'General Maintenance',
      estimatedLaborCost: {
        min: Number(raw.diagnosis?.estimatedLaborMin || raw.session?.estimatedLaborMin || 10000),
        max: Number(raw.diagnosis?.estimatedLaborMax || raw.session?.estimatedLaborMax || 25000),
      },
      severity: raw.diagnosis?.severity || raw.session?.severity || 'NORMAL',
      hazardWarning: safetyFirst || raw.hazardWarning,
      billOfMaterials: raw.diagnosis?.estimatedBOM || raw.session?.estimatedBOM || raw.billOfMaterials || [],
      matchedArtisans: raw.matchedArtisans || raw.session?.matchedArtisans || [],
      guestAccessToken: raw.guestAccessToken,
      clarificationOptions: raw.clarification?.options || raw.diagnosis?.clarificationOptions || raw.session?.clarificationOptions || [],
      diagnosticStatus: raw.session?.diagnosticStatus || (raw.diagnosis?.clarificationNeeded ? 'INFORMATION_GATHERING' : 'ASSESSMENT_READY'),
      isResolved: raw.session?.diagnosticStatus === 'RESOLVED',
    };
  }

  static async getSession(sessionId: string): Promise<DiagnosticSessionRecord> {
    const response = await apiClient.get<ApiResponse<DiagnosticSessionRecord>>(
      `/ai/session/${sessionId}`
    );
    return response.data.data;
  }

  static async submitClarification(
    sessionId: string,
    questionId: string,
    selectedOption: string
  ): Promise<DiagnosticSessionRecord> {
    const response = await apiClient.post<ApiResponse<DiagnosticSessionRecord>>(
      `/ai/session/${sessionId}/clarify`,
      { questionId, selectedOption }
    );
    return response.data.data;
  }

  static async matchArtisans(
    sessionId: string,
    radiusKm = 15
  ): Promise<MatchedArtisanDossier[]> {
    const response = await apiClient.post<ApiResponse<MatchedArtisanDossier[]>>(
      `/ai/session/${sessionId}/match`,
      { radiusKm }
    );
    return response.data.data;
  }

  static async convertToJob(
    sessionId: string,
    overrides?: { budget?: number; urgency?: string }
  ): Promise<{ jobId: string }> {
    const response = await apiClient.post<ApiResponse<{ jobId: string }>>(
      `/ai/session/${sessionId}/convert-to-job`,
      overrides
    );
    return response.data.data;
  }

  static async triggerEmergencySos(
    sessionId: string,
    clientCoordinates: { latitude: number; longitude: number }
  ): Promise<{ broadcastId: string; dispatchedCount: number }> {
    const response = await apiClient.post<ApiResponse<{ broadcastId: string; dispatchedCount: number }>>(
      `/ai/session/${sessionId}/emergency-sos`,
      clientCoordinates
    );
    return response.data.data;
  }

  static async verifyRepair(
    sessionId: string,
    beforeUrl: string,
    afterPhotoUri: string
  ): Promise<{ isVerified: boolean; confidence: number; feedback: string }> {
    const formData = new FormData();
    formData.append('beforeUrl', beforeUrl);
    formData.append('afterPhoto', {
      uri: afterPhotoUri,
      name: 'completion_proof.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);

    const response = await apiClient.post<ApiResponse<{ isVerified: boolean; confidence: number; feedback: string }>>(
      `/ai/session/${sessionId}/verify-repair`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data;
  }

  static async sendChatMessage(
    sessionId: string,
    payload: {
      message: string;
      history?: Array<{ role: 'user' | 'assistant'; text: string }>;
      latitude?: number;
      longitude?: number;
      imageUris?: string[];
      audioUri?: string;
      guestAccessToken?: string;
    }
  ): Promise<{
    reply: string;
    detectedTrade?: string;
    severity?: string;
    estimatedCostRange?: { min: number; max: number };
    suggestedActions?: string[];
    clarificationQuestions?: Array<{ id: string; text: string; options: string[] }>;
    clarificationOptions?: string[];
    isResolved?: boolean;
    diagnosticStatus?: string;
    billOfMaterials?: DiagnosticBOMItem[];
    safetyWarning?: string;
    matchedArtisans?: MatchedArtisanDossier[];
    updatedProbableCause?: string;
    diagnosticTitle?: string;
  }> {
    const formattedHistory = (payload.history || []).map((h) => ({
      role: h.role,
      content: h.text,
    }));

    let requestBody: any;
    let headers: Record<string, string> | undefined = undefined;

    const hasMedia = (payload.imageUris && payload.imageUris.length > 0) || Boolean(payload.audioUri);

    if (hasMedia) {
      const formData = new FormData();
      formData.append('message', payload.message);
      formData.append('history', JSON.stringify(formattedHistory));
      if (payload.latitude && payload.longitude) {
        formData.append('latitude', String(payload.latitude));
        formData.append('longitude', String(payload.longitude));
      }

      if (payload.audioUri) {
        if (Platform.OS === 'web') {
          try {
            const audioBlob = await convertUriToBlob(payload.audioUri, 'audio/webm');
            formData.append('voice', audioBlob, 'voice_note.webm');
          } catch (e) {
            console.warn('[AiService] Failed to append follow-up audio:', e);
          }
        } else {
          const audioBlob = {
            uri: payload.audioUri,
            name: 'voice_note.m4a',
            type: 'audio/m4a',
          } as unknown as Blob;
          formData.append('voice', audioBlob);
        }
      }

      if (payload.imageUris && payload.imageUris.length > 0) {
        for (let idx = 0; idx < Math.min(payload.imageUris.length, 4); idx++) {
          const uri = payload.imageUris[idx];
          if (Platform.OS === 'web') {
            try {
              const imgBlob = await convertUriToBlob(uri, 'image/jpeg');
              formData.append('photos', imgBlob, `defect_photo_${idx + 1}.jpg`);
            } catch (e) {
              console.warn('[AiService] Failed to append follow-up image:', e);
            }
          } else {
            const photoBlob = {
              uri,
              name: `defect_photo_${idx + 1}.jpg`,
              type: 'image/jpeg',
            } as unknown as Blob;
            formData.append('photos', photoBlob);
          }
        }
      }

      requestBody = formData;
    } else {
      requestBody = {
        message: payload.message,
        history: formattedHistory,
        latitude: payload.latitude,
        longitude: payload.longitude,
      };
    }

    const response = await apiClient.post<ApiResponse<any>>(
      `/ai/session/${sessionId}/message`,
      requestBody,
      {
        timeout: 60000,
        headers: payload.guestAccessToken ? { 'x-diagnostic-session-token': payload.guestAccessToken } : headers,
      }
    );
    const raw = response.data.data;
    return {
      reply: raw?.reply || raw?.conversationalReply || 'Understood. Let me know if you would like me to dispatch a verified artisan.',
      detectedTrade: raw?.detectedTrade,
      severity: raw?.isEmergency ? 'EMERGENCY' : raw?.severity,
      estimatedCostRange: raw?.estimatedCostRange,
      suggestedActions: raw?.safetyWarning ? [raw.safetyWarning] : undefined,
      clarificationQuestions: raw?.clarificationQuestions,
      clarificationOptions: raw?.clarificationOptions || [],
      isResolved: Boolean(raw?.isResolved),
      diagnosticStatus: raw?.diagnosticStatus,
      billOfMaterials: raw?.billOfMaterials || [],
      safetyWarning: raw?.safetyWarning || undefined,
      matchedArtisans: raw?.matchedArtisans || [],
      updatedProbableCause: raw?.updatedProbableCause,
      diagnosticTitle: raw?.updatedProbableCause || raw?.detectedTrade,
    };
  }

  static async getUserHistory(): Promise<DiagnosticSessionRecord[]> {
    const response = await apiClient.get<ApiResponse<DiagnosticSessionRecord[]>>('/ai/history');
    return response.data.data;
  }

  static async getSession(sessionId: string): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(`/ai/session/${sessionId}`);
    return response.data.data;
  }

  static async evaluateInvoiceVariance(
    milestoneId: string,
    actualInvoiceAmountNgn: number
  ): Promise<{
    varianceAmount: number;
    variancePercent: number;
    isFlagged: boolean;
    recommendation?: string;
  }> {
    const response = await apiClient.post<ApiResponse<any>>(
      `/ai/milestone/${milestoneId}/evaluate-variance`,
      { actualInvoiceAmountNgn }
    );
    return response.data.data;
  }

  static async generateNonVisualOtp(
    milestoneId: string,
    clientId?: string
  ): Promise<{
    otpCode: string;
    expiresAt: string;
    message?: string;
  }> {
    const response = await apiClient.post<ApiResponse<any>>(
      `/ai/milestone/${milestoneId}/generate-nonvisual-otp`,
      { clientId }
    );
    return response.data.data;
  }

  static async verifyNonVisualOtp(
    milestoneId: string,
    otpCode: string,
    clientId?: string
  ): Promise<{
    success: boolean;
    releasedMilestone?: any;
    message?: string;
  }> {
    const response = await apiClient.post<ApiResponse<any>>(
      `/ai/milestone/${milestoneId}/verify-nonvisual-otp`,
      { otpCode, clientId }
    );
    return response.data.data;
  }
}

