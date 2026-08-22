import prisma from '../src/config/db.js';
import { MonadListenerService } from '../src/services/monad-listener.service.js';

async function main() {
  console.log('\n============================================================');
  console.log('📡 Artisan Escrow — Monad Blockchain Real-Time Event Daemon');
  console.log('============================================================\n');

  await prisma.$connect();
  console.log('✅ Connected to PostgreSQL Database');

  await MonadListenerService.startListening();

  console.log('Press Ctrl+C to stop listening.\n');

  process.on('SIGINT', async () => {
    console.log('\n🛑 Gracefully shutting down event listener...');
    MonadListenerService.stopListening();
    await prisma.$disconnect();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('❌ Fatal error in Monad event daemon:', err);
  process.exit(1);
});
