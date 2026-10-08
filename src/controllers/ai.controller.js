import multer from 'multer';
import { AiDiagnosticService } from '../services/ai-diagnostic.service.js';
import { MatchingEngineService } from '../services/matching-engine.service.js';
import { AiEscrowService } from '../services/ai-escrow.service.js';
import { EmergencyDispatchService } from '../services/emergency-dispatch.service.js';
import { AiVerificationService } from '../services/ai-verification.service.js';
import { AiCacheService } from '../services/ai-cache.service.js';
import { UploadService } from '../services/upload.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { ApiError } from '../utils/api-error.js';
import { verifyAccessToken } from '../utils/token.util.js';
import prisma from '../config/db.js';

// Configure in-memory multer for up to 4 photos (max 5MB each) and 1 voice audio note (max 15MB)
const storage = multer.memoryStorage();
export const uploadDiagnosticMedia = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'photos') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new ApiError(400, 'Only image files (JPEG, PNG, WebP) are permitted for diagnostic photos'));
      }
    } else if (file.fieldname === 'voice') {
      if (
        file.mimetype.startsWith('audio/') ||
        file.mimetype.startsWith('video/') ||
        file.mimetype === 'application/octet-stream'
      ) {
        cb(null, true);
      } else {
        cb(new ApiError(400, 'Only audio files (WebM, MP3, WAV, OGG, M4A) are permitted for voice notes'));
      }
    } else {
      cb(null, true);
    }
  },
}).fields([
  { name: 'photos', maxCount: 4 },
  { name: 'voice', maxCount: 1 },
]);

export const uploadDiagnosticPhotos = uploadDiagnosticMedia;

export class AiController {
  /**
   * POST /api/ai/diagnose
   * Multipart request with textPrompt, latitude, longitude, and optional photos or voice note
   */
  static async diagnose(req, res, next) {
    try {
      const { textPrompt, latitude, longitude, address, clientSessionToken, clientRequestedArtisan } = req.body;
      
      let photoFiles = [];
      let voiceFile = null;

      if (Array.isArray(req.files)) {
        photoFiles = req.files;
      } else if (req.files) {
        photoFiles = req.files.photos || [];
        voiceFile = req.files.voice?.[0] || null;
      }

      if (!textPrompt && photoFiles.length === 0 && !voiceFile) {
        throw ApiError.badRequest('Please provide either a text description, at least one photo, or a voice note of the issue.');
      }

      // Check optional user auth from bearer token header
      let userId = req.user?.id || null;
      if (!userId && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const decoded = verifyAccessToken(token);
          if (decoded?.userId) {
            const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
            if (user) userId = user.id;
          }
        } catch {
          // Token invalid or expired, continue as guest
        }
      }

      // Prepare direct base64 data URIs for immediate, exact vision analysis
      const visionImageUrls = [];
      const imageUrls = [];

      if (photoFiles.length > 0) {
        photoFiles.forEach((file) => {
          const mime = file.mimetype || 'image/jpeg';
          visionImageUrls.push(`data:${mime};base64,${file.buffer.toString('base64')}`);
        });

        // Parallel upload to Cloudinary for permanent storage
        const uploadPromises = photoFiles.map((file) =>
          UploadService.uploadBuffer(file.buffer, 'ai_diagnostics', 'image').catch((err) => {
            console.warn('⚠️ Cloudinary photo upload warning:', err.message);
            return null;
          })
        );
        const uploadResults = await Promise.all(uploadPromises);
        uploadResults.forEach((result) => {
          if (result?.url) imageUrls.push(result.url);
        });
      }

      // Upload voice note to Cloudinary if provided
      let voiceAudioUrl = null;
      let voiceAudioBuffer = null;
      let voiceMimeType = 'audio/webm';

      if (voiceFile) {
        voiceAudioBuffer = voiceFile.buffer;
        voiceMimeType = voiceFile.mimetype || 'audio/webm';
        try {
          const voiceUpload = await UploadService.uploadBuffer(voiceFile.buffer, 'ai_voice_notes', 'video');
          if (voiceUpload?.url) voiceAudioUrl = voiceUpload.url;
        } catch (err) {
          console.warn('⚠️ Voice note storage upload warning:', err.message);
        }
      }

      const clientCoords = latitude && longitude ? { latitude, longitude } : null;
      const wantsArtisan = clientRequestedArtisan === 'true' || clientRequestedArtisan === true;

      const result = await AiDiagnosticService.runDiagnostic({
        textPrompt,
        imageUrls: imageUrls.length > 0 ? imageUrls : visionImageUrls,
        visionImageUrls,
        voiceAudioBuffer,
        voiceMimeType,
        voiceAudioUrl,
        clientCoords,
        clientAddress: address,
        userId,
        clientSessionToken,
        clientRequestedArtisan: wantsArtisan,
      });

      return res.status(201).json(
        new ApiResponse(201, result, 'Fault diagnostic analysis completed successfully.')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/ai/session/:id
   */
  static async getSession(req, res, next) {
    try {
      const { id } = req.params;
      const session = await AiDiagnosticService.getSessionById(id);
      return res.json(new ApiResponse(200, session, 'Diagnostic session retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/ai/history
   */
  static async getUserHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const sessions = await AiDiagnosticService.getUserSessions(userId);
      return res.json(new ApiResponse(200, sessions, 'User diagnostic history retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/ai/session/:id/match
   * Trigger or refine 5-pillar matching
   */
  static async matchArtisans(req, res, next) {
    try {
      const { id } = req.params;
      const { limit = 3, maxRadiusKm = 25.0 } = req.body || {};
      const matches = await MatchingEngineService.findTopMatches({
        diagnosticSessionId: id,
        limit: Number(limit),
        maxRadiusKm: Number(maxRadiusKm),
      });
      return res.json(new ApiResponse(200, matches, 'Artisan recommendations generated successfully.'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/ai/session/:id/dossier/:artisanId
   * Retrieve structured job dossier for the matched artisan
   */
  static async getDossier(req, res, next) {
    try {
      const { id, artisanId } = req.params;
      const dossier = await MatchingEngineService.generateArtisanDossier({
        sessionId: id,
        artisanProfileId: artisanId,
      });
      return res.json(new ApiResponse(200, dossier, 'Artisan dossier compiled successfully.'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/ai/session/:id/convert-to-job
   * 1-Click Convert diagnosis into an active job
   */
  static async convertToJob(req, res, next) {
    try {
      const { id } = req.params;
      const { preferredArtisanId, customNotes } = req.body || {};
      const userId = req.user.id;

      const result = await MatchingEngineService.convertDiagnosisToJob({
        sessionId: id,
        userId,
        preferredArtisanId,
        customNotes,
      });

      return res.status(201).json(
        new ApiResponse(201, result, 'Diagnosis converted to active job successfully.')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/ai/session/:id/clarify
   * Submit interactive answer to clarifying diagnostic question
   */
  static async clarify(req, res, next) {
    try {
      const { id } = req.params;
      const { answer } = req.body;

      if (!answer) {
        throw ApiError.badRequest('Please provide an answer to the clarifying question.');
      }

      const result = await AiDiagnosticService.submitClarificationAnswer({
        sessionId: id,
        answer,
      });

      return res.json(
        new ApiResponse(200, result, 'Clarification recorded and diagnostic recommendations refined.')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/ai/session/:id/artisan-audio-script
   * Generate personalized colloquial voice note briefing script for artisan
   */
  static async getArtisanAudioScript(req, res, next) {
    try {
      const { id } = req.params;
      const { artisanName } = req.query;

      const result = await AiDiagnosticService.getArtisanAudioScript({
        sessionId: id,
        artisanName,
      });

      return res.json(
        new ApiResponse(200, result, 'Artisan audio briefing script generated.')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/ai/session/:id/escrow-plan
   * Calculate automated milestone split and dual-rail NGN/USDC pricing
   */
  static async getEscrowPlan(req, res, next) {
    try {
      const { id } = req.params;
      const plan = await AiEscrowService.calculateEscrowPlan({ sessionId: id });
      return res.json(new ApiResponse(200, plan, 'Escrow pricing and milestone plan calculated.'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/ai/session/:id/create-escrow-contract
   * Create active contract with materials and labor milestones from AI diagnosis
   */
  static async createEscrowContract(req, res, next) {
    try {
      const { id } = req.params;
      const { artisanProfileId, customNotes } = req.body || {};
      const clientId = req.user.id;

      if (!artisanProfileId) {
        throw ApiError.badRequest('artisanProfileId is required to instantiate escrow contract.');
      }

      const result = await AiEscrowService.createEscrowContractFromDiagnosis({
        sessionId: id,
        clientId,
        artisanProfileId,
        customNotes,
      });

      return res.status(201).json(
        new ApiResponse(201, result, 'Escrow contract and milestones created successfully.')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/ai/session/:id/emergency-sos
   * 1-Tap Emergency SOS Dispatch
   */
  static async triggerEmergencySos(req, res, next) {
    try {
      const { id } = req.params;
      const { maxRadiusKm = 10.0 } = req.body || {};
      const clientId = req.user?.id || null;

      const result = await EmergencyDispatchService.triggerEmergencySos({
        sessionId: id,
        clientId,
        maxRadiusKm: Number(maxRadiusKm),
      });

      return res.json(
        new ApiResponse(200, result, 'Emergency SOS dispatched to nearby on-call specialists.')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/ai/session/:id/claim-sos
   * Artisan claims emergency dispatch with first-to-claim lock
   */
  static async claimEmergencySos(req, res, next) {
    try {
      const { id } = req.params;
      const artisanUserId = req.user.id;

      const result = await EmergencyDispatchService.claimEmergencySos({
        sessionId: id,
        artisanUserId,
      });

      return res.json(
        new ApiResponse(200, result, 'Emergency dispatch claimed. Proceed to client location.')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/ai/session/:id/verify-repair
   * AI Before/After inspection of completed repair
   */
  static async verifyRepair(req, res, next) {
    try {
      const { id } = req.params;
      const { contractId, milestoneId, postRepairPhotoUrls = [] } = req.body || {};
      
      let photoUrls = Array.isArray(postRepairPhotoUrls) ? [...postRepairPhotoUrls] : [];

      // Support uploaded photo files if present
      let files = [];
      if (Array.isArray(req.files)) {
        files = req.files;
      } else if (req.files?.photos) {
        files = req.files.photos;
      }

      if (files.length > 0) {
        const uploadPromises = files.map((file) =>
          UploadService.uploadBuffer(file.buffer, 'ai_repairs', 'image')
        );
        const uploadResults = await Promise.all(uploadPromises);
        uploadResults.forEach((r) => {
          if (r?.url) photoUrls.push(r.url);
        });
      }

      const result = await AiVerificationService.verifyRepairWork({
        sessionId: id,
        contractId,
        milestoneId,
        postRepairPhotoUrls: photoUrls,
      });

      return res.json(
        new ApiResponse(200, result, 'AI Post-Repair Inspection completed successfully.')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/ai/cache-stats
   * Cache hit rate and token savings telemetry
   */
  static async getCacheStats(req, res, next) {
    try {
      const stats = AiCacheService.getStats();
      return res.json(new ApiResponse(200, stats, 'AI diagnostic cache telemetry retrieved.'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/ai/session/:id/message
   * Multi-turn conversational chat message in diagnostic session
   */
  static async sendChatMessage(req, res, next) {
    try {
      const { id } = req.params;
      const { message, history = [], latitude, longitude } = req.body;

      let parsedHistory = history;
      if (typeof history === 'string') {
        try {
          parsedHistory = JSON.parse(history);
        } catch {
          parsedHistory = [];
        }
      }

      let photoFiles = [];
      let voiceFile = null;

      if (Array.isArray(req.files)) {
        photoFiles = req.files;
      } else if (req.files) {
        photoFiles = req.files.photos || [];
        voiceFile = req.files.voice?.[0] || null;
      }

      const newVisionImageUrls = [];
      if (photoFiles.length > 0) {
        photoFiles.forEach((file) => {
          const mime = file.mimetype || 'image/jpeg';
          newVisionImageUrls.push(`data:${mime};base64,${file.buffer.toString('base64')}`);
        });

        // Asynchronously persist uploaded chat photos to Cloudinary and database
        photoFiles.forEach((file) => {
          UploadService.uploadBuffer(file.buffer, 'ai_diagnostics', 'image')
            .then(async (uploadRes) => {
              if (uploadRes?.url) {
                await prisma.diagnosticMedia.create({
                  data: {
                    diagnosticSessionId: id,
                    mediaUrl: uploadRes.url,
                    mediaType: 'IMAGE',
                    fileSize: file.size || 0,
                  },
                }).catch(() => {});
              }
            })
            .catch(() => {});
        });
      }

      let voiceAudioBuffer = voiceFile?.buffer || null;
      let voiceMimeType = voiceFile?.mimetype || 'audio/webm';

      const clientCoords = latitude && longitude ? { latitude, longitude } : null;

      const chatResult = await AiDiagnosticService.processChatMessage({
        sessionId: id,
        userMessage: message || '',
        conversationHistory: parsedHistory,
        clientCoords,
        newImageUrls: newVisionImageUrls,
        voiceAudioBuffer,
        voiceMimeType,
      });

      return res.json(new ApiResponse(200, chatResult, 'Message processed successfully.'));
    } catch (error) {
      next(error);
    }
  }
}

