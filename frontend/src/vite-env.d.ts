/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SOCKET_URL?: string;
  readonly VITE_MONAD_RPC_URL?: string;
  readonly VITE_MONAD_CHAIN_ID?: string;
  readonly VITE_ESCROW_CONTRACT_ADDRESS?: string;
  readonly VITE_STABLECOIN_ADDRESS?: string;
  readonly VITE_PAYSTACK_PUBLIC_KEY?: string;
  readonly VITE_PRIVY_APP_ID?: string;
  readonly VITE_POSTHOG_KEY?: string;
  readonly VITE_POSTHOG_HOST?: string;
  readonly VITE_VAPID_PUBLIC_KEY?: string;
  readonly VITE_WAITLIST_SHEET_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
