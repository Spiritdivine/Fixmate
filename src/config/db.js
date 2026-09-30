import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

const globalForPrisma = globalThis;

const client =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

export const PRISMA_TX_OPTIONS = {
  maxWait: 10000, // Wait up to 10s to acquire a connection (handles serverless/cold-start latency)
  timeout: 25000, // Allow up to 25s for multi-step transaction completion
};

// Automatically provide resilient timeouts across all interactive transactions
if (!client._hasCustomTxWrapper) {
  const originalTx = client.$transaction.bind(client);
  client.$transaction = (arg, options = {}) => {
    if (typeof arg === 'function') {
      return originalTx(arg, { ...PRISMA_TX_OPTIONS, ...options });
    }
    return originalTx(arg, options);
  };
  client._hasCustomTxWrapper = true;
}

export const prisma = client;

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
