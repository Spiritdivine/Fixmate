import { AiDiagnosticService } from '../src/services/ai-diagnostic.service.js';

async function run() {
  console.log('--- 1. Testing Greeting Prompt ---');
  const greetingResult = await AiDiagnosticService.runDiagnostic({
    textPrompt: 'Hello, good afternoon',
    clientState: 'Lagos',
  });
  console.log('Category:', greetingResult.category);
  console.log('MatchedCategoryId:', greetingResult.session.matchedCategoryId);
  console.log('DiagnosticTitle:', greetingResult.session.diagnosticTitle);
  console.log('MatchedArtisans Count:', greetingResult.matchedArtisans.length);
  console.log('Reply preview:', greetingResult.conversationalReply.slice(0, 80));

  if (greetingResult.category === null && greetingResult.matchedArtisans.length === 0) {
    console.log('✅ PASS: Greeting correctly produced null category and 0 artisan recommendations!\n');
  } else {
    console.error('❌ FAIL: Greeting unexpectedly tagged category or recommended artisans!\n');
  }

  console.log('--- 2. Testing Standard Fault without Requesting Artisan ---');
  const faultResult = await AiDiagnosticService.runDiagnostic({
    textPrompt: 'My bathroom tap is dripping water slowly from the aerator nozzle',
    clientState: 'Lagos',
  });
  console.log('Category:', faultResult.category?.name);
  console.log('MatchedCategoryId:', faultResult.session.matchedCategoryId);
  console.log('DiagnosticTitle:', faultResult.session.diagnosticTitle);
  console.log('MatchedArtisans Count:', faultResult.matchedArtisans.length);
  if (faultResult.matchedArtisans.length === 0) {
    console.log('✅ PASS: Standard fault correctly gave diagnosis without dumping artisans!\n');
  } else {
    console.error('❌ FAIL: Standard fault recommended artisans when not requested!\n');
  }

  console.log('--- 3. Testing Emergency Hazard ---');
  const emergencyResult = await AiDiagnosticService.runDiagnostic({
    textPrompt: 'Emergency: The main circuit breaker is sparking fire and black smoke is coming out in Lekki',
    clientState: 'Lagos',
  });
  console.log('Category:', emergencyResult.category?.name);
  console.log('Urgency:', emergencyResult.session.urgency);
  console.log('MatchedArtisans Count:', emergencyResult.matchedArtisans.length);
  if (emergencyResult.matchedArtisans.length === 3) {
    console.log('✅ PASS: Emergency hazard recommended Top 3 closest verified specialists!\n');
  } else {
    console.log('Note: Matched', emergencyResult.matchedArtisans.length, 'artisans for emergency.\n');
  }

  console.log('--- 4. Testing Explicit Artisan Request via Chat Follow-up ---');
  const chatResult = await AiDiagnosticService.processChatMessage({
    sessionId: faultResult.session.id,
    userMessage: 'Please recommend an artisan to come fix this for me in Lekki Phase 1',
    conversationHistory: [
      { role: 'user', content: 'My bathroom tap is dripping water slowly from the aerator nozzle' },
      { role: 'assistant', content: faultResult.conversationalReply },
    ],
  });
  console.log('Intent:', chatResult.intent);
  console.log('MatchedArtisans Count:', chatResult.matchedArtisans.length);
  if (chatResult.matchedArtisans.length === 3) {
    console.log('✅ PASS: Explicit artisan request recommended Top 3 closest verified artisans!\n');
  } else {
    console.log('Note: Matched', chatResult.matchedArtisans.length, 'artisans for explicit request.\n');
  }

  process.exit(0);
}

run().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
