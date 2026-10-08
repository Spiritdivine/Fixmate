import { Router } from 'express';
import { AiController, uploadDiagnosticMedia } from '../controllers/ai.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Diagnostic endpoint: accepts text, photos (up to 4), and voice audio note
router.post('/diagnose', uploadDiagnosticMedia, AiController.diagnose);

// Fetch diagnostic session by ID
router.get('/session/:id', AiController.getSession);

// Fetch authenticated user diagnostic history
router.get('/history', authenticate, AiController.getUserHistory);

// Phase 2: 5-Pillar Matching Trigger / Refinement
router.post('/session/:id/match', AiController.matchArtisans);

// Phase 2: Retrieve Artisan Job Dossier
router.get('/session/:id/dossier/:artisanId', AiController.getDossier);

// Phase 2: 1-Click Convert Diagnosis into Active Job
router.post('/session/:id/convert-to-job', authenticate, AiController.convertToJob);

// Phase 3: Interactive Clarification Answer
router.post('/session/:id/clarify', AiController.clarify);

// Phase 3: Synthesized Artisan Audio Briefing Script
router.get('/session/:id/artisan-audio-script', AiController.getArtisanAudioScript);

// Phase 4: Diagnostic Escrow Pricing & Milestone Breakdown
router.get('/session/:id/escrow-plan', AiController.getEscrowPlan);

// Phase 4: 1-Click Instantiate Escrow Contract & Milestones
router.post('/session/:id/create-escrow-contract', authenticate, AiController.createEscrowContract);

// Phase 4: 1-Tap Emergency SOS Dispatch
router.post('/session/:id/emergency-sos', AiController.triggerEmergencySos);

// Phase 4: Artisan Claim Emergency SOS
router.post('/session/:id/claim-sos', authenticate, AiController.claimEmergencySos);

// Phase 4: AI Post-Repair Before/After Verification
router.post('/session/:id/verify-repair', uploadDiagnosticMedia, AiController.verifyRepair);

// Phase 4: Diagnostic Performance Cache Telemetry
router.get('/cache-stats', AiController.getCacheStats);

// Conversational Chat & Follow-up Messaging (accepts text, optional photos or voice notes)
router.post('/session/:id/message', uploadDiagnosticMedia, AiController.sendChatMessage);

export default router;
