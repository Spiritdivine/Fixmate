import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  PrivyProvider as BasePrivyProvider,
  usePrivy,
  useWallets,
  useCreateWallet,
} from '@privy-io/react-auth';
import { connectWallet, switchToMonadTestnet, hasWeb3Provider } from './monad-web3';
import { apiClient } from './api-client';
import { useAuthStore } from '../stores/authStore';
import {
  MONAD_CHAIN_ID,
  MONAD_RPC_URL,
  MONAD_EXPLORER_URL,
  MONAD_NETWORK,
  PRIVY_APP_ID,
} from '../config/env';

// Monad Active Chain Definition (dynamically adapts to Mainnet or Testnet)
export const isMainnet = MONAD_CHAIN_ID === 143 || MONAD_NETWORK === 'mainnet';

export const activeMonadChain = {
  id: MONAD_CHAIN_ID,
  name: isMainnet ? 'Monad Mainnet' : 'Monad Testnet',
  network: isMainnet ? 'monad-mainnet' : 'monad-testnet',
  nativeCurrency: {
    name: 'Monad',
    symbol: 'MON',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [MONAD_RPC_URL],
    },
    public: {
      http: [MONAD_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: isMainnet ? 'MonadExplorer' : 'MonadVision',
      url: MONAD_EXPLORER_URL,
    },
  },
  testnet: !isMainnet,
};

export const monadTestnet = activeMonadChain;

const WALLET_UNLINKED_KEYS = ['artifix_wallet_unlinked', 'Artifix_wallet_unlinked', 'fixmate_wallet_unlinked'];

const isWalletExplicitlyUnlinked = (): boolean => {
  if (typeof window === 'undefined') return false;
  return WALLET_UNLINKED_KEYS.some((key) => localStorage.getItem(key) === 'true');
};

const setWalletExplicitlyUnlinked = (unlinked: boolean): void => {
  if (typeof window === 'undefined') return;
  WALLET_UNLINKED_KEYS.forEach((key) => {
    if (unlinked) {
      localStorage.setItem(key, 'true');
    } else {
      localStorage.removeItem(key);
    }
  });
};

interface UnifiedWalletContextType {
  address: string | null;
  isConnected: boolean;
  isEmbedded: boolean;
  walletType: 'PRIVY_EMBEDDED' | 'EXTERNAL_METAMASK' | 'MANUAL_LINK' | 'NONE';
  connect: () => Promise<{ address: string }>;
  disconnect: () => Promise<void>;
  syncWithBackend: (address: string | null) => Promise<void>;
  createEmbeddedWallet: () => Promise<string | null>;
  setManualWalletAddress: (address: string) => Promise<void>;
  unlinkWallet: () => Promise<void>;
  sponsorGas: () => Promise<{ success: boolean; message: string }>;
  checkGas: () => Promise<{ balanceMon: number; isSponsorshipEligible: boolean }>;
}

const UnifiedWalletContext = createContext<UnifiedWalletContextType>({
  address: null,
  isConnected: false,
  isEmbedded: false,
  walletType: 'NONE',
  connect: async () => ({ address: '' }),
  disconnect: async () => {},
  syncWithBackend: async () => {},
  createEmbeddedWallet: async () => null,
  setManualWalletAddress: async () => {},
  unlinkWallet: async () => {},
  sponsorGas: async () => ({ success: false, message: 'Not supported' }),
  checkGas: async () => ({ balanceMon: 0, isSponsorshipEligible: false }),
});

export const useUnifiedWallet = () => useContext(UnifiedWalletContext);

// Active Privy Bridge Component
const ActivePrivyBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: privyUser, authenticated, login, logout, ready } = usePrivy();
  const { wallets } = useWallets();
  const { createWallet } = useCreateWallet();
  const { user: appUser, updateUser } = useAuthStore();
  const isConnectingRef = React.useRef(false);
  const isAutoSyncingRef = React.useRef(false);

  // The single source of truth for the user's linked wallet is their Artifix profile
  const isExplicitlyUnlinked = isWalletExplicitlyUnlinked();
  const currentAddress = isExplicitlyUnlinked ? null : (appUser?.walletAddress || null);

  const embeddedWallet = wallets?.find(
    (w) => w.walletClientType === 'privy' && (!currentAddress || w.address?.toLowerCase() === currentAddress.toLowerCase())
  );
  const isEmbedded = Boolean(
    currentAddress && embeddedWallet && embeddedWallet.address?.toLowerCase() === currentAddress.toLowerCase()
  );

  const walletType = !currentAddress
    ? 'NONE'
    : isEmbedded
    ? 'PRIVY_EMBEDDED'
    : hasWeb3Provider()
    ? 'EXTERNAL_METAMASK'
    : 'MANUAL_LINK';

  const syncWithBackend = async (addr: string | null) => {
    try {
      await apiClient.patch('/profiles/wallet-address', { walletAddress: addr });
      updateUser({ walletAddress: addr || undefined });
      if (addr) {
        setWalletExplicitlyUnlinked(false);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to sync wallet address';
      throw new Error(msg);
    }
  };

  const createEmbeddedWallet = async (): Promise<string | null> => {
    try {
      const existing = wallets?.find((w) => w.walletClientType === 'privy');
      if (existing?.address) {
        await syncWithBackend(existing.address);
        return existing.address;
      }
      const newWallet = await createWallet();
      if (newWallet?.address) {
        await syncWithBackend(newWallet.address);
        return newWallet.address;
      }
      return null;
    } catch (err: any) {
      console.warn('[PrivyBridge] createEmbeddedWallet error:', err?.message || err);
      return null;
    }
  };

  // Auto-sync or provision embedded wallet when user is logged in
  useEffect(() => {
    if (!ready || !authenticated || !appUser || isExplicitlyUnlinked || isAutoSyncingRef.current) return;

    const embedded = wallets?.find((w) => w.walletClientType === 'privy');
    const primary = embedded || wallets?.[0];

    // If an embedded or primary wallet already exists, auto-sync to backend
    if (primary?.address && (!appUser.walletAddress || isConnectingRef.current)) {
      isConnectingRef.current = false;
      isAutoSyncingRef.current = true;
      syncWithBackend(primary.address)
        .catch((err) => {
          console.warn('[PrivyBridge] Auto-sync embedded wallet error:', err);
        })
        .finally(() => {
          isAutoSyncingRef.current = false;
        });
    } else if (!appUser.walletAddress && (!wallets || wallets.length === 0)) {
      // If user has no wallet yet, attempt lazy creation of an embedded wallet
      isAutoSyncingRef.current = true;
      createEmbeddedWallet().finally(() => {
        isAutoSyncingRef.current = false;
      });
    }
  }, [ready, authenticated, wallets, appUser?.walletAddress, isExplicitlyUnlinked]);

  const handleConnect = async () => {
    setWalletExplicitlyUnlinked(false);
    if (ready && !authenticated) {
      isConnectingRef.current = true;
      login();
      return { address: '' };
    }
    const res = await connectWallet();
    if (res.address) {
      await syncWithBackend(res.address);
    }
    return { address: res.address };
  };

  const handleDisconnect = async () => {
    await unlinkWallet();
  };

  const setManualWalletAddress = async (addr: string) => {
    setWalletExplicitlyUnlinked(false);
    const trimmed = addr.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
      throw new Error('Invalid EVM address format. Address must start with 0x followed by 40 hex characters.');
    }
    await syncWithBackend(trimmed);
  };

  const unlinkWallet = async () => {
    setWalletExplicitlyUnlinked(true);
    isConnectingRef.current = false;

    try {
      if (wallets && wallets.length > 0) {
        for (const w of wallets) {
          try {
            await (w as any).disconnect?.();
          } catch {
            // ignore disconnect error
          }
        }
      }
      if (authenticated) {
        await logout();
      }
    } catch (e) {
      console.warn('Privy disconnect/logout warning during unlink:', e);
    }

    try {
      await apiClient.patch('/profiles/wallet-address', { walletAddress: null });
      updateUser({ walletAddress: undefined });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to unlink wallet address';
      throw new Error(msg);
    }
  };

  const sponsorGas = async () => {
    try {
      const res = await apiClient.post('/wallets/sponsor-gas', { walletAddress: currentAddress });
      return { success: res.data?.data?.success ?? true, message: res.data?.message || 'Gas sponsored' };
    } catch (err: any) {
      return { success: false, message: err?.response?.data?.message || err?.message || 'Gas sponsorship unavailable' };
    }
  };

  const checkGas = async () => {
    try {
      const res = await apiClient.get('/wallets/gas-balance', { params: { address: currentAddress } });
      return res.data?.data || { balanceMon: 0, isSponsorshipEligible: true };
    } catch {
      return { balanceMon: 0, isSponsorshipEligible: false };
    }
  };

  return (
    <UnifiedWalletContext.Provider
      value={{
        address: currentAddress,
        isConnected: Boolean(currentAddress),
        isEmbedded,
        walletType,
        connect: handleConnect,
        disconnect: handleDisconnect,
        syncWithBackend,
        createEmbeddedWallet,
        setManualWalletAddress,
        unlinkWallet,
        sponsorGas,
        checkGas,
      }}
    >
      {children}
    </UnifiedWalletContext.Provider>
  );
};

// Fallback Browser Provider (When Privy App ID is not configured or in dev)
const FallbackBrowserBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: appUser, updateUser } = useAuthStore();
  const address = appUser?.walletAddress || null;

  const syncWithBackend = async (addr: string | null) => {
    try {
      await apiClient.patch('/profiles/wallet-address', { walletAddress: addr });
      updateUser({ walletAddress: addr || undefined });
      if (addr) {
        setWalletExplicitlyUnlinked(false);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update wallet address';
      throw new Error(msg);
    }
  };

  const handleConnect = async () => {
    if (!hasWeb3Provider()) {
      throw new Error('No Web3 wallet extension detected in your browser. You can manually enter or paste your EVM address below.');
    }

    const res = await connectWallet();
    if (res.address) {
      await syncWithBackend(res.address);
    }
    return { address: res.address };
  };

  const handleDisconnect = async () => {
    await unlinkWallet();
  };

  const setManualWalletAddress = async (addr: string) => {
    const trimmed = addr.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
      throw new Error('Invalid EVM address format. Address must start with 0x followed by 40 hex characters.');
    }
    await syncWithBackend(trimmed);
  };

  const unlinkWallet = async () => {
    setWalletExplicitlyUnlinked(true);
    try {
      await apiClient.patch('/profiles/wallet-address', { walletAddress: null });
      updateUser({ walletAddress: undefined });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to unlink wallet address';
      throw new Error(msg);
    }
  };

  const sponsorGas = async () => {
    try {
      const res = await apiClient.post('/wallets/sponsor-gas', { walletAddress: address });
      return { success: res.data?.data?.success ?? true, message: res.data?.message || 'Gas sponsored' };
    } catch (err: any) {
      return { success: false, message: err?.response?.data?.message || err?.message || 'Gas sponsorship unavailable' };
    }
  };

  const checkGas = async () => {
    try {
      const res = await apiClient.get('/wallets/gas-balance', { params: { address } });
      return res.data?.data || { balanceMon: 0, isSponsorshipEligible: true };
    } catch {
      return { balanceMon: 0, isSponsorshipEligible: false };
    }
  };

  return (
    <UnifiedWalletContext.Provider
      value={{
        address,
        isConnected: Boolean(address),
        isEmbedded: false,
        walletType: address ? (hasWeb3Provider() ? 'EXTERNAL_METAMASK' : 'MANUAL_LINK') : 'NONE',
        connect: handleConnect,
        disconnect: handleDisconnect,
        syncWithBackend,
        createEmbeddedWallet: async () => null,
        setManualWalletAddress,
        unlinkWallet,
        sponsorGas,
        checkGas,
      }}
    >
      {children}
    </UnifiedWalletContext.Provider>
  );
};

export const PrivyProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const privyAppId = PRIVY_APP_ID;
  const isPrivyConfigured = Boolean(
    privyAppId &&
    typeof privyAppId === 'string' &&
    privyAppId.length > 5 &&
    !privyAppId.includes('your-privy-app-id')
  );

  if (!isPrivyConfigured) {
    return <FallbackBrowserBridge>{children}</FallbackBrowserBridge>;
  }

  return (
    <BasePrivyProvider
      appId={privyAppId}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#186644',
          logo: '/brand/artifix-icon-transparent.png',
          showWalletLoginFirst: false,
          walletList: ['metamask', 'detected_wallets', 'rainbow', 'wallet_connect'],
        },
        loginMethods: ['email', 'google', 'wallet'],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'all-users',
          },
        },
        defaultChain: monadTestnet,
        supportedChains: [monadTestnet],
      }}
    >
      <ActivePrivyBridge>{children}</ActivePrivyBridge>
    </BasePrivyProvider>
  );
};

export default PrivyProviderWrapper;
