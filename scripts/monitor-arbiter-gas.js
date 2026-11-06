import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { env } from '../src/config/env.js';
import { MonadEscrowService } from '../src/services/monad-escrow.service.js';
import { AlertService } from '../src/services/alert.service.js';

dotenv.config();

/**
 * Production Gas Monitoring Daemon for Monad Platform Arbiter & Relayer
 *
 * Ensures the platform arbiter wallet always retains sufficient native MON tokens
 * to execute dispute resolutions, auto-releases, and emergency refunds on-chain.
 */
async function monitorArbiterGas() {
  console.log('\n============================================================');
  console.log('⛽ Artisan Platform — Monad Arbiter Gas Monitor Daemon');
  console.log('============================================================\n');

  const provider = MonadEscrowService.getProvider();
  let arbiterAddress = env.ESCROW_ARBITER_ADDRESS;

  if (!arbiterAddress || !ethers.isAddress(arbiterAddress)) {
    const privateKey = env.DEPLOYER_PRIVATE_KEY;
    if (privateKey && privateKey.length >= 32) {
      const wallet = new ethers.Wallet(privateKey);
      arbiterAddress = wallet.address;
    }
  }

  if (!arbiterAddress) {
    console.error('❌ Could not resolve Arbiter wallet address. Check ESCROW_ARBITER_ADDRESS or DEPLOYER_PRIVATE_KEY in .env.');
    process.exit(1);
  }

  const network = await provider.getNetwork();
  console.log(`🌐 Connected Network:  Chain ID ${network.chainId.toString()}`);
  console.log(`👤 Monad Arbiter EOA:  ${arbiterAddress}`);

  let balanceRaw = 0n;
  try {
    balanceRaw = await provider.getBalance(arbiterAddress);
  } catch (err) {
    console.error(`❌ Failed to retrieve balance from Monad RPC: ${err.message}`);
    process.exit(1);
  }

  const balanceMon = parseFloat(ethers.formatEther(balanceRaw));
  console.log(`💰 Current Balance:    ${balanceMon.toFixed(4)} MON`);

  const CRITICAL_THRESHOLD = 1.0; // Less than 1 MON
  const WARNING_THRESHOLD = 5.0;  // Less than 5 MON

  if (balanceMon < CRITICAL_THRESHOLD) {
    const message = `Arbiter wallet balance (${balanceMon.toFixed(4)} MON) has dropped below critical threshold (${CRITICAL_THRESHOLD} MON). On-chain escrow releases and dispute resolutions are at risk of out-of-gas failures!`;
    console.error(`\n🚨 CRITICAL GAS ALERT: ${message}`);
    await AlertService.sendAlert({
      level: 'CRITICAL',
      title: 'Monad Arbiter Wallet Gas Critical',
      message,
      metadata: { arbiterAddress, currentBalanceMon: balanceMon, criticalThreshold: CRITICAL_THRESHOLD },
    }).catch(() => {});
    return { status: 'CRITICAL', balanceMon, arbiterAddress };
  } else if (balanceMon < WARNING_THRESHOLD) {
    const message = `Arbiter wallet balance (${balanceMon.toFixed(4)} MON) is low (threshold: ${WARNING_THRESHOLD} MON). Please refill native MON tokens soon.`;
    console.warn(`\n⚠️  WARNING: ${message}`);
    await AlertService.sendAlert({
      level: 'WARNING',
      title: 'Monad Arbiter Wallet Gas Warning',
      message,
      metadata: { arbiterAddress, currentBalanceMon: balanceMon, warningThreshold: WARNING_THRESHOLD },
    }).catch(() => {});
    return { status: 'WARNING', balanceMon, arbiterAddress };
  } else {
    console.log(`\n✅ HEALTHY: Arbiter gas reserves are adequate (>${WARNING_THRESHOLD} MON).\n`);
    return { status: 'HEALTHY', balanceMon, arbiterAddress };
  }
}

// Allow direct execution from CLI
if (process.argv[1]?.endsWith('monitor-arbiter-gas.js')) {
  const isDaemon = process.argv.includes('--daemon');
  const intervalArgIdx = process.argv.indexOf('--interval');
  const intervalSeconds = intervalArgIdx !== -1 && process.argv[intervalArgIdx + 1]
    ? parseInt(process.argv[intervalArgIdx + 1], 10)
    : 300; // default 5 minutes

  if (isDaemon) {
    console.log(`🔄 Running in continuous daemon mode (polling every ${intervalSeconds}s)...`);
    monitorArbiterGas().catch(console.error);
    setInterval(() => {
      monitorArbiterGas().catch(console.error);
    }, intervalSeconds * 1000);
  } else {
    monitorArbiterGas().catch((err) => {
      console.error('Fatal error in gas monitor:', err);
      process.exit(1);
    });
  }
}

export { monitorArbiterGas };
