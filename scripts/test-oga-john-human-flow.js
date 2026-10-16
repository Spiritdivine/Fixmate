const BASE_URL = 'http://localhost:5050/api/v1';

async function postJson(url, data, headers = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || `HTTP ${res.status}`);
  }
  return json;
}

async function runTests() {
  console.log('🚀 Starting Oga John Human-Like Diagnostic Flow Tests...\n');

  try {
    // ----------------------------------------------------
    // Scenario 1: Couch Leg Defect (Couch leg broke)
    // ----------------------------------------------------
    console.log('--- Test 1: Turn 1 Couch Leg Query ("my couch leg just dey, break o") ---');
    const turn1Res = await postJson(`${BASE_URL}/ai/diagnose`, {
      textPrompt: 'my couch leg just dey, break o',
      latitude: 6.5244,
      longitude: 3.3792,
      address: 'Ikeja, Lagos',
    });

    const turn1Data = turn1Res.data;
    const session1Id = turn1Data.session.id;
    const reply1 = turn1Data.conversationalReply;

    console.log(`Diagnostic Status: ${turn1Data.session.diagnosticStatus}`);
    console.log(`Estimated BOM items: ${turn1Data.session.estimatedBOM.length}`);
    console.log(`Labor Min: ${turn1Data.session.estimatedLaborMin}, Max: ${turn1Data.session.estimatedLaborMax}`);
    console.log(`Matched Artisans: ${turn1Data.matchedArtisans.length}`);
    console.log(`Reply:\n"${reply1}"\n`);

    // Invariants Check
    if (turn1Data.session.diagnosticStatus !== 'INFORMATION_GATHERING') {
      console.error(`❌ Expected INFORMATION_GATHERING status, got: ${turn1Data.session.diagnosticStatus}`);
    } else {
      console.log('✅ Status is correctly INFORMATION_GATHERING');
    }

    if (turn1Data.session.estimatedBOM.length > 0) {
      console.error('❌ BOM was generated prematurely on Turn 1!');
    } else {
      console.log('✅ BOM is strictly empty on initial symptom report');
    }

    if (turn1Data.session.estimatedLaborMin !== null) {
      console.error('❌ Labor cost was hallucinated prematurely!');
    } else {
      console.log('✅ Labor cost is correctly null during information gathering');
    }

    if (/hello.*i am oga john/i.test(reply1) || /my name is oga john/i.test(reply1)) {
      console.error('❌ Reply reintroduced Oga John!');
    } else {
      console.log('✅ No self-reintroduction in diagnostic response');
    }

    // ----------------------------------------------------
    // Scenario 1 - Turn 2: Providing more details ("na wooden leg, e snap for bottom")
    // ----------------------------------------------------
    console.log('\n--- Test 2: Turn 2 Follow-up ("na wooden leg, e snap for bottom") ---');
    const sessionHeaders = turn1Data.guestAccessToken
      ? { 'x-diagnostic-session-token': turn1Data.guestAccessToken }
      : {};

    const turn2Res = await postJson(
      `${BASE_URL}/ai/session/${session1Id}/message`,
      { message: 'na wooden leg, e snap for bottom' },
      sessionHeaders
    );

    const turn2Data = turn2Res.data;
    const reply2 = turn2Data.reply;

    console.log(`Status: ${turn2Data.diagnosticStatus}`);
    console.log(`BOM items: ${turn2Data.billOfMaterials.length}`);
    console.log(`Reply:\n"${reply2}"\n`);

    if (turn2Data.billOfMaterials.length > 0) {
      console.error('❌ BOM was returned without being requested!');
    } else {
      console.log('✅ BOM remains empty when user did not ask for it');
    }

    if (/hello.*i am oga john/i.test(reply2)) {
      console.error('❌ Reply reintroduced Oga John in turn 2!');
    } else {
      console.log('✅ No self-reintroduction in follow-up turn');
    }

    // ----------------------------------------------------
    // Scenario 1 - Turn 3: User explicitly asks for materials ("what materials do i need to fix it?")
    // ----------------------------------------------------
    console.log('\n--- Test 3: Turn 3 User explicitly asks for BOM ("what materials do i need to fix it?") ---');
    const turn3Res = await postJson(
      `${BASE_URL}/ai/session/${session1Id}/message`,
      { message: 'what materials do i need to fix it?' },
      sessionHeaders
    );

    const turn3Data = turn3Res.data;
    const reply3 = turn3Data.reply;

    console.log(`BOM items returned: ${turn3Data.billOfMaterials.length}`);
    console.log(`Reply:\n"${reply3}"\n`);
    if (turn3Data.billOfMaterials.length > 0) {
      console.log('✅ BOM items provided upon explicit request:', turn3Data.billOfMaterials);
    } else {
      console.log('ℹ️ BOM was discussed in conversation text:', reply3.slice(0, 150));
    }

    // ----------------------------------------------------
    // Scenario 2: Professional Hazardous Task (Sparks & burning smell at DB panel)
    // ----------------------------------------------------
    console.log('\n--- Test 4: Professional Hazard Gating ("my distribution board breaker dey spark and smell burnt wire") ---');
    const hazardRes = await postJson(`${BASE_URL}/ai/diagnose`, {
      textPrompt: 'my distribution board breaker dey spark and smell burnt wire',
      latitude: 6.5244,
      longitude: 3.3792,
      address: 'Ikeja, Lagos',
    });

    const hazardData = hazardRes.data;
    const hazardReply = hazardData.conversationalReply;

    console.log(`Hazardous: ${hazardData.diagnosis.isHazardous}`);
    console.log(`Urgency: ${hazardData.diagnosis.urgency}`);
    console.log(`DIY Allowed: ${hazardData.diagnosis.diyAllowed}`);
    console.log(`Reply:\n"${hazardReply}"\n`);

    if (hazardData.diagnosis.diyAllowed === true) {
      console.error('❌ DIY was allowed on hazardous electrical fault!');
    } else {
      console.log('✅ DIY is strictly forbidden on electrical sparking fault');
    }

    const offersProfessional =
      hazardReply.toLowerCase().includes('verified') ||
      hazardReply.toLowerCase().includes('specialist') ||
      hazardReply.toLowerCase().includes('electrician') ||
      hazardReply.toLowerCase().includes('professional');

    if (offersProfessional) {
      console.log('✅ Prompt correctly offers verified professional help for hazardous task');
    } else {
      console.warn('⚠️ Professional referral phrasing not explicitly detected in reply');
    }

    console.log('\n🎉 ALL HUMAN DIAGNOSTIC FLOW TESTS COMPLETED!');
  } catch (err) {
    console.error('❌ Test failed with error:', err.message);
  }
}

runTests();
