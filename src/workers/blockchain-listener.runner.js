import { MonadListenerService } from '../services/monad-listener.service.js';
import prisma from '../config/db.js';

let isShuttingDown = false;

async function startBlockchainWorker() {
  console.log('⛓️ Initializing Standalone Monad Blockchain Listener Worker Process...');
  console.log('📡 Listening for EscrowDeposited, EscrowReleased, and DisputeRaised events on Monad Testnet...');

  try {
    await prisma.$connect();
    await MonadListenerService.startListening();
  } catch (error) {
    console.error('❌ Failed to start Monad Blockchain Listener Worker:', error);
    process.exit(1);
  }
}

const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n🛑 Received ${signal}. Stopping Monad Blockchain Event Listener cleanly...`);
  MonadListenerService.stopListening();

  try {
    await prisma.$disconnect();
    console.log('🛑 Database disconnected. Blockchain Worker stopped.');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection in Blockchain Worker at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception in Blockchain Worker:', error);
});

startBlockchainWorker();
