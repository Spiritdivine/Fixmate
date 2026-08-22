import { Router } from 'express';
import authRoutes from './auth.routes.js';
import profileRoutes from './profile.routes.js';
import jobRoutes from './job.routes.js';
import proposalRoutes from './proposal.routes.js';
import contractRoutes from './contract.routes.js';
import escrowRoutes from './escrow.routes.js';
import walletRoutes from './wallet.routes.js';
import paymentRoutes from './payment.routes.js';
import disputeRoutes from './dispute.routes.js';
import reviewRoutes from './review.routes.js';
import chatRoutes from './chat.routes.js';
import notificationRoutes from './notification.routes.js';
import adminRoutes from './admin.routes.js';
import uploadRoutes from './upload.routes.js';
import prisma from '../config/db.js';
import { MonadEscrowService } from '../services/monad-escrow.service.js';

const router = Router();

// Production Health & Readiness Probe
router.get('/health', async (req, res) => {
  let dbStatus = 'ok';
  let monadRpcStatus = 'ok';

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    dbStatus = `unhealthy: ${err.message}`;
  }

  try {
    const provider = MonadEscrowService.getProvider();
    await provider.getBlockNumber();
  } catch (err) {
    monadRpcStatus = `unreachable: ${err.message}`;
  }

  const isHealthy = dbStatus === 'ok';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    service: 'Artisan Escrow Marketplace Backend API',
    environment: process.env.NODE_ENV || 'development',
    network: 'Monad Testnet',
    checks: {
      database: dbStatus,
      monadRpc: monadRpcStatus,
    },
    timestamp: new Date().toISOString(),
  });
});

// Mount modules
router.use('/auth', authRoutes);
router.use('/profiles', profileRoutes);
router.use('/jobs', jobRoutes);
router.use('/proposals', proposalRoutes);
router.use('/contracts', contractRoutes);
router.use('/escrow', escrowRoutes);
router.use('/wallets', walletRoutes);
router.use('/payments', paymentRoutes);
router.use('/disputes', disputeRoutes);
router.use('/reviews', reviewRoutes);
router.use('/chat', chatRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/upload', uploadRoutes);

export default router;

