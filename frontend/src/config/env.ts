/**
 * Centralized Frontend Environment Variables Configuration
 * 
 * Single source of truth for all client-side environment variables.
 * Import all variables from this file instead of accessing `import.meta.env` directly.
 */

export const ENV = {
  // 1. Backend REST API & Real-time WebSockets
  API_URL: import.meta.env.VITE_API_URL || '/api/v1',
  SOCKET_URL:
    import.meta.env.VITE_SOCKET_URL ||
    (import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, '')
      : '/'),

  // 2. Monad Blockchain Configuration (Mainnet / Testnet)
  MONAD_NETWORK: import.meta.env.VITE_MONAD_NETWORK || 'testnet',
  MONAD_RPC_URL: import.meta.env.VITE_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz',
  MONAD_CHAIN_ID: Number(import.meta.env.VITE_MONAD_CHAIN_ID || 10143),
  MONAD_EXPLORER_URL:
    import.meta.env.VITE_MONAD_EXPLORER_URL ||
    (Number(import.meta.env.VITE_MONAD_CHAIN_ID) === 143 || import.meta.env.VITE_MONAD_NETWORK === 'mainnet'
      ? 'https://monadexplorer.com'
      : 'https://testnet.monadvision.com'),
  ESCROW_CONTRACT_ADDRESS: (
    import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS ||
    '0xfD5aE7dC6f46D43A6f216caf681430A6d7dace7A'
  ) as `0x${string}`,
  STABLECOIN_ADDRESS: (
    import.meta.env.VITE_STABLECOIN_ADDRESS ||
    '0x4079e33893Fb59B8aD3C618CBEBa06511D6525DD'
  ) as `0x${string}`,

  // 3. Payment Gateway (Paystack Public Key)
  PAYSTACK_PUBLIC_KEY: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',

  // 4. Privy Embedded Wallets (Web3 Auth)
  PRIVY_APP_ID: import.meta.env.VITE_PRIVY_APP_ID || '',

  // 5. PostHog Analytics
  POSTHOG_KEY: import.meta.env.VITE_POSTHOG_KEY || '',
  POSTHOG_HOST: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',

  // 6. Web Push Notifications (PWA VAPID)
  VAPID_PUBLIC_KEY: import.meta.env.VITE_VAPID_PUBLIC_KEY || '',

  // 7. Growth & Waitlist
  WAITLIST_SHEET_URL: import.meta.env.VITE_WAITLIST_SHEET_URL || '',

  // Environment Flags
  IS_DEV: Boolean(import.meta.env.DEV),
  IS_PROD: Boolean(import.meta.env.PROD),
} as const;

// Convenient named exports for direct importing
export const {
  API_URL,
  SOCKET_URL,
  MONAD_NETWORK,
  MONAD_RPC_URL,
  MONAD_CHAIN_ID,
  MONAD_EXPLORER_URL,
  ESCROW_CONTRACT_ADDRESS,
  STABLECOIN_ADDRESS,
  PAYSTACK_PUBLIC_KEY,
  PRIVY_APP_ID,
  POSTHOG_KEY,
  POSTHOG_HOST,
  VAPID_PUBLIC_KEY,
  WAITLIST_SHEET_URL,
  IS_DEV,
  IS_PROD,
} = ENV;

export default ENV;
