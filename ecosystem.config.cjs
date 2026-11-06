/**
 * PM2 Process Manager Orchestration Configuration
 * Phase 5: Multi-core Node.js Cluster Scaling & Process Isolation
 *
 * Usage:
 *   pm2 start ecosystem.config.cjs
 *   pm2 reload ecosystem.config.cjs --update-env
 *   pm2 stop ecosystem.config.cjs
 */

module.exports = {
  apps: [
    // 1. API Web Cluster (Horizontally scales Express across all available CPU cores)
    {
      name: 'artisan-api',
      script: 'src/server.js',
      instances: process.env.PM2_INSTANCES || 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      listen_timeout: 8000,
      kill_timeout: 5000,
      wait_ready: false,
      env: {
        NODE_ENV: 'development',
        ENABLE_INLINE_BLOCKCHAIN_LISTENER: 'false', // Decoupled to dedicated runner
      },
      env_production: {
        NODE_ENV: 'production',
        ENABLE_INLINE_BLOCKCHAIN_LISTENER: 'false',
      },
    },

    // 2. Asynchronous Queue Worker (Processes notifications, media, web push fanouts)
    {
      name: 'artisan-queue-worker',
      script: 'src/workers/notification.worker.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      kill_timeout: 6000,
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },

    // 3. Monad Blockchain Event Listener (Isolated from HTTP traffic to prevent event loop lag)
    {
      name: 'artisan-blockchain-listener',
      script: 'src/workers/blockchain-listener.runner.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      kill_timeout: 5000,
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },

    // 4. Media Processing Worker (Sharp image optimization & WebP encoding)
    {
      name: 'artisan-media-worker',
      script: 'src/workers/media.worker.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      kill_timeout: 5000,
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },

    // 5. Blockchain Transaction Worker (Retry queue & gas escalation)
    {
      name: 'artisan-blockchain-tx-worker',
      script: 'src/workers/blockchain.worker.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      kill_timeout: 5000,
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
