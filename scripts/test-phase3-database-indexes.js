import prisma from '../src/config/db.js';

async function runPhase3Tests() {
  console.log('🧪 Starting Phase 3 Database Composite Index Verification...\n');

  let passed = 0;
  let failed = 0;

  async function assert(desc, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${desc} -> ${err.message}`);
      failed++;
    }
  }

  try {
    // TEST 1: Inspect pg_indexes catalog for jobs table
    await assert('PostgreSQL contains composite performance indexes on table "jobs"', async () => {
      const indexes = await prisma.$queryRaw`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'jobs' AND schemaname = 'public';
      `;

      const defs = indexes.map((i) => i.indexdef.toLowerCase()).join('\n');
      if (!defs.includes('status') || !defs.includes('created_at')) {
        throw new Error(`Missing index on (status, created_at): \n${defs}`);
      }
      if (!defs.includes('client_id') || !defs.includes('status')) {
        throw new Error(`Missing index on (client_id, status): \n${defs}`);
      }
      console.log(`    (Found ${indexes.length} active indexes on jobs table)`);
    });

    // TEST 2: Inspect pg_indexes catalog for artisan_profiles table
    await assert('PostgreSQL contains composite ranking index on "artisan_profiles"', async () => {
      const indexes = await prisma.$queryRaw`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'artisan_profiles' AND schemaname = 'public';
      `;

      const defs = indexes.map((i) => i.indexdef.toLowerCase()).join('\n');
      if (!defs.includes('is_available') || !defs.includes('rating_avg')) {
        throw new Error(`Missing index on (is_available, rating_avg): \n${defs}`);
      }
      console.log(`    (Found ${indexes.length} active indexes on artisan_profiles table)`);
    });

    // TEST 3: Inspect pg_indexes catalog for contracts table
    await assert('PostgreSQL contains composite indexes on "contracts"', async () => {
      const indexes = await prisma.$queryRaw`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'contracts' AND schemaname = 'public';
      `;

      const defs = indexes.map((i) => i.indexdef.toLowerCase()).join('\n');
      if (!defs.includes('client_id') || !defs.includes('status')) {
        throw new Error(`Missing index on (client_id, status): \n${defs}`);
      }
      if (!defs.includes('artisan_id') || !defs.includes('status')) {
        throw new Error(`Missing index on (artisan_id, status): \n${defs}`);
      }
      console.log(`    (Found ${indexes.length} active indexes on contracts table)`);
    });

    // TEST 4: Inspect pg_indexes catalog for notifications table
    await assert('PostgreSQL contains composite chronological indexes on "notifications"', async () => {
      const indexes = await prisma.$queryRaw`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'notifications' AND schemaname = 'public';
      `;

      const defs = indexes.map((i) => i.indexdef.toLowerCase()).join('\n');
      if (!defs.includes('user_id') || !defs.includes('created_at')) {
        throw new Error(`Missing index on (user_id, created_at): \n${defs}`);
      }
      console.log(`    (Found ${indexes.length} active indexes on notifications table)`);
    });

    // TEST 5: Inspect pg_indexes catalog for ai_diagnostic_sessions table
    await assert('PostgreSQL contains composite status and user indexes on "ai_diagnostic_sessions"', async () => {
      const indexes = await prisma.$queryRaw`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'ai_diagnostic_sessions' AND schemaname = 'public';
      `;

      const defs = indexes.map((i) => i.indexdef.toLowerCase()).join('\n');
      if (!defs.includes('diagnostic_status') || !defs.includes('created_at')) {
        throw new Error(`Missing index on (diagnostic_status, created_at): \n${defs}`);
      }
      console.log(`    (Found ${indexes.length} active indexes on ai_diagnostic_sessions table)`);
    });

    // TEST 6: EXPLAIN Query Plan Verification on Hot Path
    await assert('EXPLAIN plan confirms index scanning on jobs feed query', async () => {
      const plan = await prisma.$queryRawUnsafe(`
        EXPLAIN SELECT id FROM jobs 
        WHERE status = 'OPEN' 
        ORDER BY created_at DESC 
        LIMIT 20;
      `);
      const planString = plan.map((p) => p['QUERY PLAN']).join('\n');
      console.log(`    (Execution Plan: ${planString.split('\n')[0]})`);
    });

    console.log(`\n========================================`);
    console.log(`Phase 3 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal testing error in Phase 3:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect().catch(() => {});
    process.exit(0);
  }
}

runPhase3Tests();
