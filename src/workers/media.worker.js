import { Worker } from 'bullmq';
import { redis, cacheStore } from '../config/redis.js';
import { QUEUE_NAMES } from '../queues/queue.manager.js';
import prisma from '../config/db.js';

let workerInstance = null;

export function initMediaWorker() {
  if (!cacheStore.isRedisActive() || !redis) {
    console.log('[MediaWorker] Redis not active. Media processing running in direct fallback mode.');
    return null;
  }

  workerInstance = new Worker(
    QUEUE_NAMES.MEDIA_PROCESSING,
    async (job) => {
      const { mediaId, fileUrl, mediaType, contractId, milestoneId } = job.data;
      console.log(`[MediaWorker] Processing media asset: ${mediaId || fileUrl} (Type: ${mediaType || 'IMAGE'})`);

      // 1. If mediaId is provided, retrieve and verify
      if (mediaId) {
        const mediaRecord = await prisma.diagnosticMedia.findUnique({
          where: { id: mediaId },
        });

        if (mediaRecord) {
          // Update status or metadata as processed
          console.log(`[MediaWorker] Verified diagnostic media record: ${mediaRecord.id}`);
        }
      }

      // 2. Simulated / Hook for EXIF parsing and WebP optimization
      const simulatedResult = {
        processed: true,
        optimizedUrl: fileUrl,
        format: 'webp',
        compressedAt: new Date().toISOString(),
      };

      return simulatedResult;
    },
    {
      connection: redis,
      concurrency: 5,
    }
  );

  workerInstance.on('completed', (job) => {
    console.log(`[MediaWorker] Media processing job ${job.id} completed successfully`);
  });

  workerInstance.on('failed', (job, err) => {
    console.error(`[MediaWorker] Media job ${job.id} failed:`, err.message);
  });

  return workerInstance;
}

// Standalone execution support
if (process.argv[1] && process.argv[1].endsWith('media.worker.js')) {
  console.log('🚀 Launching Standalone Media Processing Worker Process...');
  initMediaWorker();

  const shutdown = async () => {
    console.log('\n🛑 Shutting down Media Worker...');
    if (workerInstance) {
      await workerInstance.close();
    }
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

export default initMediaWorker;
