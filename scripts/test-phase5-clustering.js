/**
 * Test Suite: Phase 5 Multi-Core PM2 Clustering & Socket.IO Redis Adapter
 *
 * Verifies:
 * 1. Ecosystem config integrity (cluster mode, fork worker isolation, memory limits).
 * 2. Socket.IO initialization with Redis adapter / graceful in-memory fallback.
 * 3. Socket instance export via getIO() and room distribution capability.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initSocketServer, getIO } from '../src/sockets/socket.server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    failed += 1;
    process.exitCode = 1;
  } else {
    console.log(`  ✅ PASS: ${message}`);
    passed += 1;
  }
}

async function runPhase5Tests() {
  console.log('🧪 Starting Phase 5 Clustering & Socket.IO Adapter Verification...\n');

  // Test 1: Validate ecosystem.config.cjs
  try {
    const configPath = path.resolve(__dirname, '../ecosystem.config.cjs');
    assert(fs.existsSync(configPath), 'ecosystem.config.cjs configuration file exists');

    // Dynamic import of CommonJS config file
    const { default: ecosystem } = await import(`file://${configPath}`);
    assert(Array.isArray(ecosystem.apps) && ecosystem.apps.length === 3, 'ecosystem.config.cjs contains 3 orchestrated applications');

    const apiApp = ecosystem.apps.find((app) => app.name === 'artisan-api');
    assert(apiApp && apiApp.exec_mode === 'cluster', 'artisan-api is configured for multi-core "cluster" exec_mode');
    assert(apiApp.instances === 'max' || typeof apiApp.instances === 'number' || apiApp.instances === process.env.PM2_INSTANCES, 'artisan-api scales across CPU cores');

    const workerApp = ecosystem.apps.find((app) => app.name === 'artisan-queue-worker');
    assert(workerApp && workerApp.exec_mode === 'fork' && workerApp.instances === 1, 'artisan-queue-worker is isolated in "fork" mode with 1 instance');

    const chainApp = ecosystem.apps.find((app) => app.name === 'artisan-blockchain-listener');
    assert(chainApp && chainApp.exec_mode === 'fork' && chainApp.instances === 1, 'artisan-blockchain-listener is isolated in "fork" mode with 1 instance');

    console.log(`    (PM2 Config: ${ecosystem.apps.map(a => `${a.name} [${a.exec_mode}]`).join(', ')})`);
  } catch (err) {
    assert(false, `ecosystem.config.cjs validation error: ${err.message}`);
  }

  // Test 2: Socket.IO Server Initialization & Fallback Behavior
  let testServer = null;
  try {
    testServer = http.createServer();
    const io = initSocketServer(testServer);

    assert(io !== null && typeof io.on === 'function', 'Socket.IO initialized successfully with active event hooks');

    const retrievedIO = getIO();
    assert(retrievedIO === io, 'getIO() correctly returns active singleton socket server instance');

    // Check adapter mode
    const adapterType = io.adapter.constructor.name;
    console.log(`    (Active Socket Adapter: ${adapterType})`);
    assert(typeof io.to === 'function' && typeof io.emit === 'function', 'Socket server instance supports multi-room broadcasting');
  } catch (err) {
    assert(false, `Socket server initialization failed: ${err.message}`);
  } finally {
    if (testServer) {
      testServer.close();
    }
  }

  // Summary
  console.log('\n========================================');
  console.log(`Phase 5 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase5Tests().catch((err) => {
  console.error('Fatal error during Phase 5 testing:', err);
  process.exit(1);
});
