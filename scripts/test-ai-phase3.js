import prisma from '../src/config/db.js';
import { AiDiagnosticService } from '../src/services/ai-diagnostic.service.js';
import { TranscriptionService } from '../src/services/transcription.service.js';

async function runPhase3Tests() {
  console.log('🧪 Starting Phase 3 Voice Note & Dialect Loop Tests...\n');

  try {
    // 1. Direct Transcription Service Test (Pidgin dialect & emergency tone check)
    console.log('--- Step 1: Testing TranscriptionService Dialect & Tone Processing ---');
    const dummyAudioBuffer = Buffer.from('RIFF_MOCK_AUDIO_DATA_FOR_VOICE_NOTE_TEST');
    const transcription = await TranscriptionService.transcribeAudioBuffer({
      audioBuffer: dummyAudioBuffer,
      mimeType: 'audio/webm',
    });

    console.log('✅ Literal Transcript:', transcription.literalTranscript);
    console.log('✅ Technical Summary:', transcription.technicalSummary);
    console.log('✅ Emergency Tone Flag:', transcription.isEmergencyTone);
    console.log('✅ Detected Dialect:', transcription.detectedDialect);

    if (!transcription.literalTranscript || !transcription.technicalSummary) {
      throw new Error('Transcription failed to produce required transcript fields');
    }

    // 2. Multimodal Diagnostic with Voice Audio Buffer
    console.log('\n--- Step 2: Running Multimodal Diagnostic with Voice Audio Buffer ---');
    const diagWithVoice = await AiDiagnosticService.runDiagnostic({
      textPrompt: '',
      voiceAudioBuffer: dummyAudioBuffer,
      voiceMimeType: 'audio/webm',
      voiceAudioUrl: 'https://res.cloudinary.com/demo/video/upload/sample_voice_pumping_machine.webm',
      clientCoords: { latitude: '6.5244', longitude: '3.3792' }, // Yaba, Lagos
      clientAddress: '14 Commercial Avenue, Sabo, Yaba, Lagos',
    });

    const sessionId = diagWithVoice.session.id;
    console.log('✅ Diagnostic Session ID:', sessionId);
    console.log('✅ Input Type:', diagWithVoice.session.inputType);
    console.log('✅ Diagnostic Title:', diagWithVoice.session.diagnosticTitle);
    console.log('✅ Transcribed Audio in DB:', diagWithVoice.session.transcribedAudio ? 'Present' : 'Missing');
    console.log('✅ Voice Audio URL in DB:', diagWithVoice.session.voiceAudioUrl);
    console.log('✅ Clarification Question:', diagWithVoice.session.clarificationQuestion || 'None');
    console.log('✅ Clarification Options:', diagWithVoice.session.clarificationOptions);

    if (diagWithVoice.session.inputType !== 'VOICE') {
      throw new Error(`Expected inputType 'VOICE', got ${diagWithVoice.session.inputType}`);
    }

    // 3. Test Clarification Loop with Ambiguous Electrical/AC Session
    console.log('\n--- Step 3: Testing Interactive Clarification Question Loop ---');
    const ambiguousSession = await AiDiagnosticService.runDiagnostic({
      textPrompt: 'My AC is making a strange rattling sound in the bedroom.',
      clientCoords: { latitude: '6.4500', longitude: '3.6000' }, // Ajah
      clientAddress: 'Badore Road, Ajah, Lagos',
    });

    const ambSessionId = ambiguousSession.session.id;
    console.log('✅ Ambiguous Session ID:', ambSessionId);
    console.log('✅ Clarification Question Generated:', ambiguousSession.session.clarificationQuestion);
    console.log('✅ Clarification Options Generated:', ambiguousSession.session.clarificationOptions);

    if (!ambiguousSession.session.clarificationQuestion) {
      throw new Error('Expected clarification question for ambiguous AC rattling sound');
    }

    // Submit clarification answer
    const selectedAnswer = ambiguousSession.session.clarificationOptions[0] || 'Inside the room (fan blower unit)';
    console.log(`Submitting client answer: "${selectedAnswer}"...`);

    const clarificationResult = await AiDiagnosticService.submitClarificationAnswer({
      sessionId: ambSessionId,
      answer: selectedAnswer,
    });

    console.log('✅ Clarification Confirmed:', clarificationResult.clarificationConfirmed);
    console.log('✅ Refined Probable Cause:', clarificationResult.session.probableCause);
    console.log('✅ Clarification Answer Saved in DB:', clarificationResult.session.clarificationAnswer);

    if (clarificationResult.session.clarificationAnswer !== selectedAnswer) {
      throw new Error('Clarification answer was not correctly updated on session');
    }

    // 4. Test Artisan Audio Briefing Script Generation
    console.log('\n--- Step 4: Testing Localized Artisan Audio Briefing Script ---');
    const briefingResult = await AiDiagnosticService.getArtisanAudioScript({
      sessionId: ambSessionId,
      artisanName: 'Babatunde',
    });

    console.log('✅ Dispatched Artisan Name:', briefingResult.artisanName);
    console.log('✅ Target Duration (secs):', briefingResult.targetDurationSecs);
    console.log('✅ Language / Tone:', briefingResult.language);
    console.log('✅ Localized Briefing Script:\n   "' + briefingResult.audioScript + '"');

    if (!briefingResult.audioScript.includes('Babatunde') || !briefingResult.audioScript.includes('Artifix escrow')) {
      throw new Error('Artisan briefing script missing personalization or escrow reassurance');
    }

    console.log('\n🎉 ALL PHASE 3 VOICE NOTE & DIALECT LOOP TESTS PASSED SUCCESSFULLY! 🚀\n');
  } catch (error) {
    console.error('❌ Phase 3 Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase3Tests();
