import prisma from '../src/config/db.js';
import { AiDiagnosticService } from '../src/services/ai-diagnostic.service.js';

async function runTests() {
  console.log('🧪 Starting Phase 1 AI Diagnostic Service & Database Integration Tests...\n');

  try {
    // Test 1: Electrical Critical Hazard Inquiry
    console.log('--- Test 1: Electrical Fault Diagnosis ---');
    const electricalResult = await AiDiagnosticService.runDiagnostic({
      textPrompt: 'My circuit breaker trips immediately when I turn on the AC and there is a burning spark in the distribution box.',
      imageUrls: ['https://res.cloudinary.com/demo/image/upload/sample.jpg'],
      clientCoords: { latitude: '6.4474', longitude: '3.4731' }, // Lekki Phase 1
      clientAddress: 'Lekki Phase 1, Lagos, Nigeria',
    });

    console.log('✅ Title:', electricalResult.session.diagnosticTitle);
    console.log('✅ Severity:', electricalResult.session.severity);
    console.log('✅ Is Hazardous:', electricalResult.session.isHazardous);
    console.log('✅ Safety Instructions:', electricalResult.session.safetyInstructions);
    console.log('✅ BOM Estimate:', electricalResult.session.estimatedBOM);
    console.log('✅ Labor Range:', `₦${electricalResult.session.estimatedLaborMin} - ₦${electricalResult.session.estimatedLaborMax}`);
    const artisanCount = (electricalResult.matchedArtisans || electricalResult.preliminaryArtisans || []).length;
    console.log('✅ Matched Artisans Count:', artisanCount);

    if (!electricalResult.session.id) throw new Error('Session ID was not generated');
    if (!electricalResult.session.isHazardous) throw new Error('Expected electrical arcing to be flagged as hazardous');

    // Test 2: Plumbing Leak Inquiry
    console.log('\n--- Test 2: Plumbing Joint Leak Diagnosis ---');
    const plumbingResult = await AiDiagnosticService.runDiagnostic({
      textPrompt: 'Water is gushing out from the pipe joint under the kitchen sink. It is flooding the floor.',
      clientCoords: { latitude: '9.0765', longitude: '7.3986' }, // Abuja Wuse II
    });

    console.log('✅ Title:', plumbingResult.session.diagnosticTitle);
    console.log('✅ Severity:', plumbingResult.session.severity);
    console.log('✅ Urgency:', plumbingResult.session.urgency);
    console.log('✅ DIY Allowed:', plumbingResult.session.diyAllowed);
    console.log('✅ Matched Category:', plumbingResult.category?.name);

    // Test 3: Session Retrieval by ID
    console.log('\n--- Test 3: Session Retrieval from DB ---');
    const retrievedSession = await AiDiagnosticService.getSessionById(electricalResult.session.id);
    console.log('✅ Retrieved Session ID:', retrievedSession.id);
    console.log('✅ Media Files Attached:', retrievedSession.mediaFiles.length);

    if (retrievedSession.id !== electricalResult.session.id) {
      throw new Error('Retrieved session ID mismatch');
    }

    // Test 4: Empty Inquiry Rejection
    console.log('\n--- Test 4: Validation Edge Case ---');
    let threwError = false;
    try {
      await AiDiagnosticService.runDiagnostic({ textPrompt: '', imageUrls: [] });
    } catch {
      threwError = true;
      console.log('✅ Correctly rejected empty inquiry');
    }
    if (!threwError) throw new Error('Expected empty inquiry to be rejected');

    console.log('\n🎉 ALL PHASE 1 AI DIAGNOSTIC TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
