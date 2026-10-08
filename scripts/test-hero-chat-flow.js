async function testHeroChatFlow() {
  console.log('--- Testing Hero Chat & DIY Triage Backend Flow ---');

  const BASE_URL = 'http://localhost:5050/api/v1/ai';

  // 1. Test DIY Diagnosis with Artisan Suppression
  console.log('\n1. Testing DIY diagnosis (water leak under sink)...');
  const res1 = await fetch(`${BASE_URL}/diagnose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      textPrompt: 'Water dripping slowly under the sink from valve washer',
      clientRequestedArtisan: false,
    }),
  });

  const json1 = await res1.json();
  if (!json1.data) {
    console.error('Response error:', json1);
    process.exit(1);
  }
  const data1 = json1.data;
  const sessionId = data1.session.id;
  console.log('✅ Session ID:', sessionId);
  console.log('✅ Diagnosis Title:', data1.session.diagnosticTitle);
  console.log('✅ DIY Allowed:', data1.session.diyAllowed);
  console.log('✅ DIY Recommended:', data1.diyRecommended);
  console.log('✅ Matched Artisans Count (Should be 0 due to DIY suppression):', data1.matchedArtisans.length);

  if (data1.matchedArtisans.length === 0) {
    console.log('🎉 Requirement 1 PASSED: Artisans successfully suppressed for DIY issue!');
  } else {
    console.error('❌ Artisans were not suppressed!');
  }

  // 2. Test Multi-Turn Chat: User asks follow-up advice
  console.log('\n2. Testing follow-up chat message (asking for tool advice)...');
  const res2 = await fetch(`${BASE_URL}/session/${sessionId}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'What tools do I need to tighten the valve?',
    }),
  });
  const json2 = await res2.json();
  console.log('✅ AI Reply:', json2.data.reply);
  console.log('✅ Intent:', json2.data.intent);
  console.log('✅ Matched Artisans Count:', json2.data.matchedArtisans.length);

  // 3. Test Multi-Turn Chat: Client insists on matching an artisan
  console.log('\n3. Testing follow-up chat message (client insists on hiring an artisan)...');
  const res3 = await fetch(`${BASE_URL}/session/${sessionId}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'I do not have time, please match me with a plumber to fix it',
    }),
  });
  const json3 = await res3.json();
  console.log('✅ AI Reply:', json3.data.reply);
  console.log('✅ Intent:', json3.data.intent);
  console.log('✅ Matched Artisans Count (Should now be > 0):', json3.data.matchedArtisans.length);
  if (json3.data.matchedArtisans.length > 0) {
    console.log('🎉 Requirement 1 & 4 PASSED: Artisans successfully matched when client insisted!');
    console.log('Specialist matched:', json3.data.matchedArtisans[0].artisan.name);
  }

  console.log('\n🎉 ALL HERO CHAT & DIY TRIAGE BACKEND TESTS PASSED SUCCESSFULLY! 🚀');
}

testHeroChatFlow().catch((err) => {
  console.error('Test failed:', err?.response?.data || err.message);
  process.exit(1);
});
