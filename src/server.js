import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { initSocketServer } from './sockets/socket.server.js';
import prisma from './config/db.js';
import { MonadListenerService } from './services/monad-listener.service.js';

const server = http.createServer(app);

// Initialize Socket.IO
initSocketServer(server);

const PORT = env.PORT || 5050;

const startServer = async () => {
  try {
    // Verify database connection with retry for serverless DB cold starts (e.g. Neon)
    let retries = 3;
    while (retries > 0) {
      try {
        await prisma.$connect();
        console.log('✅ Connected to PostgreSQL Database via Prisma');
        break;
      } catch (err) {
        retries -= 1;
        if (retries === 0) throw err;
        console.warn(`⏳ Database connection attempt failed (${err.message}). Retrying in 2 seconds (${retries} retries left)...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    server.listen(PORT, () => {
      console.log(`🚀 Artisan Escrow Backend API running on http://localhost:${PORT}`);
      console.log(`📡 Socket.IO Server active and listening for connections`);
      console.log(`📚 API Health check available at: http://localhost:${PORT}/api/v1/health`);

      // Initialize Monad event listener in background (Monad Testnet)
      MonadListenerService.startListening().catch((err) => {
        console.warn(`⚠️ Monad Event Listener notice: ${err.message}`);
      });
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful Shutdown Handlers
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  // Stop blockchain polling
  MonadListenerService.stopListening();

  server.close(async () => {
    console.log('🛑 HTTP and WebSocket servers closed.');
    try {
      await prisma.$disconnect();
      console.log('🛑 Database connection disconnected cleanly.');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error during database disconnection:', err);
      process.exit(1);
    }
  });

  // Force close after 10s timeout
  setTimeout(() => {
    console.error('⚠️ Forcefully terminating after shutdown timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Promise Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

startServer();

