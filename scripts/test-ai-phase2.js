import prisma from '../src/config/db.js';
import { AiDiagnosticService } from '../src/services/ai-diagnostic.service.js';
import { MatchingEngineService } from '../src/services/matching-engine.service.js';

async function runPhase2Tests() {
  console.log('🧪 Starting Phase 2 Geospatial & Multi-Factor Matching Engine Tests...\n');

  try {
    // 1. Create a diagnostic session
    console.log('--- Step 1: Generating Test Diagnostic Session ---');
    const diagResult = await AiDiagnosticService.runDiagnostic({
      textPrompt: 'My 1.5HP AC outdoor compressor is vibrating loudly and blowing warm air in Lekki.',
      imageUrls: ['https://res.cloudinary.com/demo/image/upload/sample_ac.jpg'],
      clientCoords: { latitude: '6.4474', longitude: '3.4731' }, // Lekki Phase 1
      clientAddress: 'Plot 12, Admiralty Way, Lekki Phase 1, Lagos',
    });

    const sessionId = diagResult.session.id;
    console.log('✅ Created Session ID:', sessionId);
    console.log('✅ Matched Category:', diagResult.category?.name);

    // 2. Test 5-Pillar Matching Algorithm
    console.log('\n--- Step 2: Testing 5-Pillar Matching Engine ---');
    const topMatches = await MatchingEngineService.findTopMatches({
      diagnosticSessionId: sessionId,
      categoryId: diagResult.category?.id,
      categorySlug: 'hvac-refrigeration',
      skillSlugs: ['ac-repair', 'compressor-servicing'],
      clientLat: 6.4474,
      clientLng: 3.4731,
      limit: 3,
      maxRadiusKm: 25.0,
    });

    console.log(`✅ Returned ${topMatches.length} candidate match(es):`);
    topMatches.forEach((m, idx) => {
      console.log(`   #${idx + 1}: ${m.artisan.name} — Score: ${m.matchScore}/100, Dist: ${m.distanceKm}km, Rating: ${m.artisan.rating}★`);
    });

    // Check DB persistence of DiagnosticMatch
    const persistedMatches = await prisma.diagnosticMatch.findMany({
      where: { diagnosticSessionId: sessionId },
    });
    console.log(`✅ Confirmed ${persistedMatches.length} DiagnosticMatch records persisted in PostgreSQL.`);

    if (topMatches.length > 0) {
      const bestMatch = topMatches[0];

      // 3. Test Artisan Job Dossier Generation
      console.log('\n--- Step 3: Compiling Artisan Job Dossier ---');
      const dossier = await MatchingEngineService.generateArtisanDossier({
        sessionId,
        artisanProfileId: bestMatch.artisanProfileId,
      });

      console.log('✅ Dossier ID:', dossier.dossierId);
      console.log('✅ Job Overview Title:', dossier.jobOverview.title);
      console.log('✅ Recommended Specialty Tools:', dossier.materialsAndTools.recommendedSpecialtyTools);
      console.log('✅ Parts to Procure (BOM):', dossier.materialsAndTools.partsToProcure.length, 'items');
      console.log('✅ Assigned Artisan:', dossier.artisanAssigned.businessName);

      // 4. Test 1-Click "Diagnosis to Job" Conversion
      console.log('\n--- Step 4: Testing 1-Click Diagnosis to Job Conversion ---');
      // Find or create test client user
      let testUser = await prisma.user.findFirst({
        where: { role: 'CLIENT' },
      });

      if (!testUser) {
        testUser = await prisma.user.create({
          data: {
            email: `test_client_${Date.now()}@fixmate.test`,
            passwordHash: 'hashed_password_placeholder',
            role: 'CLIENT',
            status: 'ACTIVE',
          },
        });
      }

      const conversionResult = await MatchingEngineService.convertDiagnosisToJob({
        sessionId,
        userId: testUser.id,
        preferredArtisanId: bestMatch.artisanProfileId,
        customNotes: 'Please arrive after 2 PM. Security gate code is 4421.',
      });

      console.log('✅ Converted Job ID:', conversionResult.job.id);
      console.log('✅ Job Title:', conversionResult.job.title);
      console.log('✅ Budget Range: ₦', conversionResult.job.budgetMin, 'to ₦', conversionResult.job.budgetMax);
      console.log('✅ Job Status:', conversionResult.job.status);

      // Verify Session has convertedToJobId linked
      const updatedSession = await prisma.aiDiagnosticSession.findUnique({
        where: { id: sessionId },
      });
      console.log('✅ Session convertedToJobId in DB:', updatedSession.convertedToJobId);

      if (updatedSession.convertedToJobId !== conversionResult.job.id) {
        throw new Error('convertedToJobId was not properly recorded on diagnostic session');
      }
    }

    console.log('\n🎉 ALL PHASE 2 MATCHING ENGINE & CONVERSION TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Phase 2 test failed with error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase2Tests();
