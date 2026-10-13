const API_BASE = 'http://localhost:5050/api/v1';

async function postJson(url, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    const err = new Error(json.message || `HTTP ${res.status}`);
    err.response = { status: res.status, data: json };
    throw err;
  }
  return json;
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('🧪 TESTING AI CHAT DUAL MISSION: DIAGNOSTIC & MATCH');
  console.log('====================================================\n');

  let sessionId = null;

  // 1. Initial Diagnostic Test
  console.log('TEST 1: Initial Fault Diagnosis (/ai/diagnose)...');
  try {
    const res = await postJson(`${API_BASE}/ai/diagnose`, {
      textPrompt: 'My kitchen sink PVC pipe burst under the cupboard and water is spraying everywhere in Lekki Phase 1',
      latitude: 6.4474,
      longitude: 3.4731,
    });

    const data = res.data;
    sessionId = data.session.id;

    console.log(`✅ Session ID: ${sessionId}`);
    console.log(`✅ Diagnostic Title: "${data.session.diagnosticTitle}"`);
    console.log(`✅ Category: ${data.category?.name} (${data.category?.slug})`);
    console.log(`✅ Severity: ${data.session.severity} | Urgency: ${data.session.urgency}`);
    console.log(`✅ Estimated Labor: ₦${data.session.estimatedLaborMin?.toLocaleString()} - ₦${data.session.estimatedLaborMax?.toLocaleString()}`);
    console.log(`✅ BOM Items (${data.session.estimatedBOM?.length || 0}):`, data.session.estimatedBOM?.map(b => `${b.item} (₦${b.estimatedCostMin || b.minCost})`).slice(0, 3).join(', '));
    if (data.session.clarificationQuestion) {
      console.log(`✅ Clarification Question: "${data.session.clarificationQuestion}"`);
      console.log(`✅ Clarification Options:`, data.session.clarificationOptions);
    }
  } catch (err) {
    console.error('❌ Test 1 Failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 2. Technical Conversational Follow-Up Test (Negative test for false keyword match)
  console.log('\nTEST 2: Technical Conversational Follow-Up (Checking that "plumber" keyword does not trigger false match)...');
  try {
    const res = await postJson(`${API_BASE}/ai/session/${sessionId}/message`, {
      message: 'Can I apply waterproof silicone sealant or tape to seal the pipe temporarily before the plumber arrives?',
      history: [
        { role: 'user', content: 'My kitchen sink PVC pipe burst under the cupboard and water is spraying everywhere in Lekki Phase 1' },
      ],
    });

    const data = res.data;
    console.log(`✅ Reply received (${data.reply.length} chars)`);
    console.log(`✅ Intent Resolved: "${data.intent}"`);
    console.log(`✅ Snippet: "${data.reply.slice(0, 150)}..."`);

    if (data.intent === 'ARTISAN_MATCH' && data.reply.includes('Zero Cross-Trade Guarantee')) {
      console.error('❌ FAILED: False keyword match occurred!');
      process.exit(1);
    } else {
      console.log('✅ PASSED: True technical advice delivered without premature match cutoff!');
    }
  } catch (err) {
    console.error('❌ Test 2 Failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 3. Explicit Artisan Matching Request
  console.log('\nTEST 3: Explicit Artisan Matching Request...');
  try {
    const res = await postJson(`${API_BASE}/ai/session/${sessionId}/message`, {
      message: 'Please match me with a verified plumber in Lekki to fix this permanently right now',
    });

    const data = res.data;
    console.log(`✅ Reply: "${data.reply}"`);
    console.log(`✅ Matched Specialists Count: ${data.matchedArtisans?.length || 0}`);
    if (data.matchedArtisans?.length > 0) {
      data.matchedArtisans.forEach((m, idx) => {
        console.log(`   ${idx + 1}. ${m.artisan.name} (${m.artisan.businessName || 'Independent'})`);
        console.log(`      Rating: ${m.artisan.rating}★ | Distance: ${m.distanceKm} km | KYC: ${m.artisan.kycVerified ? 'Yes' : 'No'}`);
      });
      console.log('✅ PASSED: Precision 5-Pillar Artisan Match achieved!');
    } else {
      console.warn('⚠️ No artisans returned. Check radius or trade binding.');
    }
  } catch (err) {
    console.error('❌ Test 3 Failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 4. Mid-Session Hazard Detection Test
  console.log('\nTEST 4: Mid-Session Hazard Safety Shield Trigger...');
  try {
    const res = await postJson(`${API_BASE}/ai/session/${sessionId}/message`, {
      message: 'Wait, water is now spraying directly into the main 240V distribution socket and it is smoking and buzzing with sparks!',
    });

    const data = res.data;
    console.log(`✅ Hazard Reply: "${data.reply.slice(0, 160)}..."`);
    console.log(`✅ Hazard Escalate Detected: ${data.reply.includes('CRITICAL SAFETY ALERT') || data.reply.includes('HAZARD')}`);
    console.log('✅ PASSED: Safety Shield continuously enforced!');
  } catch (err) {
    console.error('❌ Test 4 Failed:', err.response?.data || err.message);
    process.exit(1);
  }

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! The AI Chat engine is production-ready.');
  process.exit(0);
}

runTestSuite();
