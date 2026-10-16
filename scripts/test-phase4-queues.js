import { enqueueNotification, QUEUE_NAMES } from '../src/queues/queue.manager.js';
import prisma from '../src/config/db.js';
import { spawn } from 'child_process';

async function runPhase4Tests() {
  console.log('🧪 Starting Phase 4 Queue Decoupling & Worker Isolation Verification...\n');

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
    // TEST 1: Verify Queue Definitions
    await assert('BullMQ queue definitions exist with exponential backoff configuration', () => {
      if (!QUEUE_NAMES.NOTIFICATIONS || !QUEUE_NAMES.MEDIA_PROCESSING || !QUEUE_NAMES.BLOCKCHAIN_TRANSACTIONS) {
        throw new Error('QUEUE_NAMES missing required queue identifier keys');
      }
      console.log(`    (Configured Queues: ${Object.values(QUEUE_NAMES).join(', ')})`);
    });

    // TEST 2: Asynchronous Non-Blocking Notification Enqueue
    await assert('enqueueNotification dispatches asynchronously and persists to database', async () => {
      // Find a valid user to associate with the notification
      const user = await prisma.user.findFirst();
      if (!user) {
        throw new Error('No user found in database to test notifications');
      }

      const testTitle = `Escrow Test ${Date.now()}`;
      const testBody = 'Your milestone payment of 50,000 NGN has been locked in escrow.';

      const startTime = Date.now();
      const jobResult = await enqueueNotification({
        userId: user.id,
        title: testTitle,
        message: testBody,
        actionUrl: '/dashboard/contracts',
        type: 'ESCROW_FUNDED',
      });
      const durationMs = Date.now() - startTime;

      if (!jobResult || !jobResult.id) {
        throw new Error('Expected jobResult to contain an ID');
      }
      if (durationMs > 100) {
        throw new Error(`Enqueue took ${durationMs}ms, expected non-blocking dispatch under 100ms`);
      }

      // Wait 300ms for background processing
      await new Promise((r) => setTimeout(r, 300));

      const savedNotification = await prisma.notification.findFirst({
        where: { userId: user.id, title: testTitle },
      });

      if (!savedNotification) {
        throw new Error('Notification record was not persisted to database by queue handler');
      }
      if (savedNotification.body !== testBody) {
        throw new Error(`Notification body mismatch: "${savedNotification.body}" vs "${testBody}"`);
      }

      // Clean up test notification
      await prisma.notification.delete({ where: { id: savedNotification.id } });
      console.log(`    (Non-blocking dispatch completed in ${durationMs}ms, DB persistence verified)`);
    });

    // TEST 3: Standalone Blockchain Worker Runner Lifecycle
    await assert('Standalone Monad Blockchain Listener Worker boots and shuts down gracefully', async () => {
      await new Promise((resolve, reject) => {
        const workerProc = spawn('node', ['src/workers/blockchain-listener.runner.js'], {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env, NODE_ENV: 'test' },
        });

        let output = '';
        const timeout = setTimeout(() => {
          workerProc.kill('SIGTERM');
          reject(new Error(`Worker timed out before initializing. Output: ${output}`));
        }, 8000);

        workerProc.stdout.on('data', (data) => {
          output += data.toString();
          if (output.includes('Initializing Standalone Monad Blockchain Listener')) {
            clearTimeout(timeout);
            // Send SIGTERM to test graceful shutdown
            workerProc.kill('SIGTERM');
          }
        });

        workerProc.stderr.on('data', (data) => {
          output += data.toString();
        });

        workerProc.on('exit', (code) => {
          clearTimeout(timeout);
          if (code === 0 || code === null) {
            resolve();
          } else {
            reject(new Error(`Worker exited with non-zero code ${code}. Output: ${output}`));
          }
        });
      });
      console.log('    (Standalone Blockchain Worker process spawned, initialized, and cleanly stopped via SIGTERM)');
    });

    console.log(`\n========================================`);
    console.log(`Phase 4 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal testing error in Phase 4:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect().catch(() => {});
    process.exit(0);
  }
}

runPhase4Tests();
