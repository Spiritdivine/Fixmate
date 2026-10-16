import { AiDiagnosticService } from '../src/services/ai-diagnostic.service.js';
import prisma from '../src/config/db.js';

async function run() {
  console.log('--- TEST 1: Professional Gating (Electrical Sparking Outlet) ---');
  const res1 = await AiDiagnosticService.runDiagnostic({
    textPrompt: 'My wall socket is sparking and making a buzzing noise when I plug something in.',
    clientState: 'Lagos',
  });

  console.log('Diagnostic Title:', res1.diagnosis.diagnosticTitle);
  console.log('DIY Allowed:', res1.diagnosis.diyAllowed);
  console.log('Conversational Reply:\n', res1.conversationalReply);

  const sessionId = res1.session.id;

  console.log('\n--- TEST 2: Affirmative Response ("Yes please, connect me") ---');
  const chatRes = await AiDiagnosticService.processChatMessage({
    sessionId,
    userMessage: 'Yes please, connect me with someone nearby.',
    conversationHistory: [
      { role: 'user', content: 'My wall socket is sparking and making a buzzing noise when I plug something in.' },
      { role: 'assistant', content: res1.conversationalReply }
    ],
  });

  console.log('Chat Reply:\n', chatRes.reply);
  console.log('Intent:', chatRes.intent);
  console.log('Should Match Artisans:', chatRes.shouldMatchArtisans);
  console.log('Matched Artisans Count:', chatRes.matchedArtisans?.length || 0);

  console.log('\n--- TEST 3: Safe DIY Task (Leaky faucet dripping slowly) ---');
  const res3 = await AiDiagnosticService.runDiagnostic({
    textPrompt: 'My kitchen sink faucet is dripping slowly from the spout when closed.',
    clientState: 'Lagos',
  });
  console.log('DIY Allowed:', res3.diagnosis.diyAllowed);
  console.log('DIY Guide Summary:', res3.diagnosis.diyGuide ? res3.diagnosis.diyGuide.slice(0, 150) + '...' : 'None');

  await prisma.$disconnect();
}

run().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
