import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

const globalForPrisma = globalThis;

// Enforce conservative connection pool limit per process to prevent connection exhaustion in PM2 clusters
const defaultPoolLimit = process.env.DB_POOL_LIMIT || (env.NODE_ENV === 'production' ? 5 : 10);
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('connection_limit')) {
  const separator = process.env.DATABASE_URL.includes('?') ? '&' : '?';
  process.env.DATABASE_URL = `${process.env.DATABASE_URL}${separator}connection_limit=${defaultPoolLimit}`;
}

const client =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

export const PRISMA_TX_OPTIONS = {
  maxWait: 15000, // Wait up to 15s to acquire a connection from pool
  timeout: 30000, // 30s maximum transaction execution time for cloud database latency
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
