import { Worker } from 'bullmq';
import { redis, cacheStore } from '../config/redis.js';
import { QUEUE_NAMES } from '../queues/queue.manager.js';
import { MonadEscrowService } from '../services/monad-escrow.service.js';
import prisma from '../config/db.js';

let workerInstance = null;

export function initBlockchainWorker() {
  if (!cacheStore.isRedisActive() || !redis) {
    console.log('[BlockchainWorker] Redis not active. Blockchain transaction worker running in fallback mode.');
    return null;
  }

  workerInstance = new Worker(
    QUEUE_NAMES.BLOCKCHAIN_TRANSACTIONS,
    async (job) => {
      const { txHash, action, contractId, onChainEscrowId } = job.data;
      console.log(`[BlockchainWorker] Processing blockchain job ${job.id}: Action=${action}, TxHash=${txHash}`);

      if (action === 'VERIFY_RELEASE') {
        const result = await MonadEscrowService.verifyReleaseTransaction(txHash, onChainEscrowId);
        return { success: true, verified: result };
      }

      if (action === 'VERIFY_FUNDING') {
        const provider = MonadEscrowService.getProvider();
        const receipt = await provider.getTransactionReceipt(txHash);

        if (!receipt) {
          throw new Error(`Transaction ${txHash} is still pending on Monad`);
        }

        if (receipt.status === 0) {
          throw new Error(`Transaction ${txHash} reverted on-chain`);
        }

        if (contractId) {
          await prisma.contract.update({
            where: { id: contractId },
            data: { status: 'ACTIVE' },
          });
        }

        return { success: true, blockNumber: receipt.blockNumber };
      }

      return { processed: true, note: `Unknown action ${action}` };
    },
    {
      connection: redis,
      concurrency: 1, // Single concurrency to preserve nonce ordering per arbiter
    }
  );

  workerInstance.on('completed', (job) => {
    console.log(`[BlockchainWorker] Blockchain job ${job.id} completed`);
  });

  workerInstance.on('failed', (job, err) => {
    console.error(`[BlockchainWorker] Blockchain job ${job.id} failed:`, err.message);
  });

  return workerInstance;
}

// Standalone execution support
if (process.argv[1] && process.argv[1].endsWith('blockchain.worker.js')) {
  console.log('🚀 Launching Standalone Blockchain Transaction Worker Process...');
  initBlockchainWorker();

  const shutdown = async () => {
    console.log('\n🛑 Shutting down Blockchain Worker...');
    if (workerInstance) {
      await workerInstance.close();
    }
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

export default initBlockchainWorker;
