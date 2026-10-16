import Redis from 'ioredis';
import { env } from './env.js';

let redisInstance = null;
let redisSubInstance = null;
let isConnected = false;

// Determine connection parameters
const shouldConnectRedis = Boolean(env.REDIS_URL || env.REDIS_HOST);
const redisHost = env.REDIS_HOST;
const redisPort = Number(env.REDIS_PORT) || 6379;
const redisPassword = env.REDIS_PASSWORD || undefined;
const redisTls = env.REDIS_TLS === 'true' ? {} : undefined;

const baseOptions = {
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: true,
  connectTimeout: 5000,
  lazyConnect: false,
  retryStrategy(times) {
    if (times > 3) {
      return null; // Stop retrying automatically if unreachable
    }
    const delay = Math.min(times * 100, 1000);
    return delay;
  },
  reconnectOnError(err) {
    return err.message.includes('READONLY');
  },
};

const createClient = () => {
  if (env.REDIS_URL) {
    return new Redis(env.REDIS_URL, baseOptions);
  }
  return new Redis({
    host: redisHost || '127.0.0.1',
    port: redisPort,
    password: redisPassword,
    tls: redisTls,
    ...baseOptions,
  });
};

if (shouldConnectRedis) {
  try {
    redisInstance = createClient();
    redisSubInstance = createClient();

    redisInstance.on('connect', () => {
      isConnected = true;
      console.log('✅ Connected to Redis cache service');
    });

    redisInstance.on('ready', () => {
      isConnected = true;
    });

    redisInstance.on('error', (err) => {
      isConnected = false;
      if (env.NODE_ENV === 'development') {
        console.warn(`[Redis Notice] Connection notice: ${err.message}`);
      }
    });

    redisInstance.on('close', () => {
      isConnected = false;
    });
  } catch (err) {
    console.warn('[Redis Init] Failed to initialize Redis client, falling back:', err.message);
  }
} else {
  // Silent, fast in-memory store in local dev unless REDIS_URL/HOST is provided
}

// In-Memory Fallback Map when Redis is unreachable
const memoryFallbackStore = new Map();

/**
 * Universal Cache Wrapper that seamlessly uses Redis if online, or in-memory fallback
 */
export const cacheStore = {
  async get(key) {
    if (isConnected && redisInstance) {
      try {
        return await redisInstance.get(key);
      } catch (err) {
        console.warn('[Cache] Redis get error, checking memory fallback:', err.message);
      }
    }
    const item = memoryFallbackStore.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      memoryFallbackStore.delete(key);
      return null;
    }
    return item.value;
  },

  async set(key, value, ...args) {
    const isNx = args.includes('NX');
    let ttl = 3600;
    const exIdx = args.indexOf('EX');
    if (exIdx !== -1 && args[exIdx + 1]) {
      ttl = Number(args[exIdx + 1]);
    } else if (typeof args[0] === 'number') {
      ttl = args[0];
    }

    if (isConnected && redisInstance) {
      try {
        const redisArgs = [key, value];
        if (ttl) redisArgs.push('EX', ttl);
        if (isNx) redisArgs.push('NX');
        return await redisInstance.set(...redisArgs);
      } catch (err) {
        console.warn('[Cache] Redis set error, storing in memory fallback:', err.message);
      }
    }

    if (isNx && memoryFallbackStore.has(key)) {
      const existing = memoryFallbackStore.get(key);
      if (!existing.expiresAt || Date.now() < existing.expiresAt) {
        return null; // Atomic lock already acquired by another worker
      }
    }

    memoryFallbackStore.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    });
    return 'OK';
  },

  async del(key) {
    if (isConnected && redisInstance) {
      try {
        return await redisInstance.del(key);
      } catch (err) {
        // ignore
      }
    }
    return memoryFallbackStore.delete(key);
  },

  isRedisActive() {
    return isConnected;
  },
};

export const redis = redisInstance;
export const redisSub = redisSubInstance;
export default redis;
