import prisma from '../src/config/db.js';
import { AiDiagnosticService } from '../src/services/ai-diagnostic.service.js';
import { TranscriptionService } from '../src/services/transcription.service.js';

async function runMultimodalTests() {
  console.log('🧪 Starting End-to-End Multimodal Vision & Voice Integration Tests...\n');

  try {
    // 1. Minimal 1x1 test JPEG data URI to simulate camera upload
    const test1x1JpegBase64 =
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

    console.log('--- Test 1: Multipart Photo Ingestion & Vision Diagnostic ---');
    const visionDiagnostic = await AiDiagnosticService.runDiagnostic({
      textPrompt: 'This water heater pipe is dripping hot water from the copper brass compression fitting.',
      visionImageUrls: [test1x1JpegBase64],
      imageUrls: [test1x1JpegBase64],
      clientCoords: { latitude: '6.4281', longitude: '3.4219' }, // Victoria Island, Lagos
    });

    console.log('✅ Diagnostic Title:', visionDiagnostic.session.diagnosticTitle);
    console.log('✅ Probable Cause:', visionDiagnostic.session.probableCause);
    console.log('✅ Input Type:', visionDiagnostic.session.inputType || 'MULTIMODAL');
    const sessionId = visionDiagnostic.session.id;
    console.log('✅ Session ID:', sessionId);

    // 2. Test Multi-Turn Conversational Chat with Session Vision Context
    console.log('\n--- Test 2: Conversational Multi-Turn Vision Inquiry ---');
    // Ensure the session in database has media files linked
    await prisma.diagnosticMedia.create({
      data: {
        diagnosticSessionId: sessionId,
        mediaUrl: test1x1JpegBase64,
        mediaType: 'IMAGE',
        fileSize: 1024,
      },
    });

    const chatVisionReply = await AiDiagnosticService.processChatMessage({
      sessionId,
      userMessage: 'Can you see the photo I uploaded? What fitting needs replacement?',
      conversationHistory: [
        { role: 'user', text: 'This water heater pipe is dripping hot water.' },
        { role: 'assistant', text: visionDiagnostic.conversationalReply || 'Inspecting fitting...' },
      ],
    });

    console.log('✅ AI Conversational Reply:\n', chatVisionReply.reply);
    console.log('✅ Intent:', chatVisionReply.intent);

    if (
      chatVisionReply.reply.toLowerCase().includes('unable to view images') ||
      chatVisionReply.reply.toLowerCase().includes('cannot view images')
    ) {
      throw new Error('AI still claiming it cannot view images!');
    }
    console.log('🎉 Vision context successfully acknowledged by AI in multi-turn conversation!');

    // 3. Test Voice Note Handling & Transcription Integration
    console.log('\n--- Test 3: Voice Note Transcription Service Integration ---');
    const mockAudioBuffer = Buffer.from('mock-audio-data-riff-wave');
    const simulationResult = await TranscriptionService.transcribeAudioBuffer({
      audioBuffer: mockAudioBuffer,
      mimeType: 'audio/webm',
    });
    console.log('✅ Transcribed summary:', simulationResult.technicalSummary);
    console.log('✅ Detected dialect:', simulationResult.detectedDialect);

    // 4. Test Multi-Turn Chat with Newly Attached Voice Note
    console.log('\n--- Test 4: Chat Follow-up with Attached Voice Buffer ---');
    const chatVoiceReply = await AiDiagnosticService.processChatMessage({
      sessionId,
      userMessage: '',
      voiceAudioBuffer: mockAudioBuffer,
      voiceMimeType: 'audio/webm',
      conversationHistory: [
        { role: 'user', text: 'Can you see the photo I uploaded?' },
        { role: 'assistant', text: chatVisionReply.reply },
      ],
    });
    console.log('✅ AI Voice Chat Reply:\n', chatVoiceReply.reply);

    console.log('\n🎉 ALL MULTIMODAL VISION & VOICE INTEGRATION TESTS PASSED! 🚀\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Multimodal test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMultimodalTests();
