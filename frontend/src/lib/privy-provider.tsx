import React, { createContext, useContext, useState, useEffect } from 'react';
import { PrivyProvider as BasePrivyProvider, usePrivy, useWallets } from '@privy-io/react-auth';
import { connectWallet, switchToMonadTestnet, hasWeb3Provider } from './monad-web3';
import { apiClient } from './api-client';
import { useAuthStore } from '../stores/authStore';

// Monad Testnet Chain Definition
export const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    name: 'Monad',
    symbol: 'MON',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
    public: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'MonadVision',
      url: 'https://testnet.monadvision.com',
    },
  },
  testnet: true,
};

interface UnifiedWalletContextType {
  address: string | null;
  isConnected: boolean;
  isEmbedded: boolean;
  walletType: 'PRIVY_EMBEDDED' | 'EXTERNAL_METAMASK' | 'MANUAL_LINK' | 'NONE';
  connect: () => Promise<{ address: string }>;
  disconnect: () => Promise<void>;
  syncWithBackend: (address: string | null) => Promise<void>;
  setManualWalletAddress: (address: string) => Promise<void>;
  unlinkWallet: () => Promise<void>;
}

const UnifiedWalletContext = createContext<UnifiedWalletContextType>({
  address: null,
  isConnected: false,
  isEmbedded: false,
  walletType: 'NONE',
  connect: async () => ({ address: '' }),
  disconnect: async () => {},
  syncWithBackend: async () => {},
  setManualWalletAddress: async () => {},
  unlinkWallet: async () => {},
});

export const useUnifiedWallet = () => useContext(UnifiedWalletContext);

// Active Privy Bridge Component
const ActivePrivyBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: privyUser, authenticated, login, logout, ready } = usePrivy();
  const { wallets } = useWallets();
  const { user: appUser, updateUser } = useAuthStore();
  const isConnectingRef = React.useRef(false);

  // The single source of truth for the user's linked wallet is their Fixmate profile
  const isExplicitlyUnlinked = typeof window !== 'undefined' && localStorage.getItem('fixmate_wallet_unlinked') === 'true';
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
        localStorage.removeItem('fixmate_wallet_unlinked');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to sync wallet address';
      throw new Error(msg);
    }
  };

  // Only bind wallet if the user explicitly clicked Connect Wallet and completed Privy login
  useEffect(() => {
    if (!ready || !authenticated) return;
    if (!isConnectingRef.current) return;

    const embedded = wallets?.find((w) => w.walletClientType === 'privy');
    const primary = embedded || wallets?.[0];
    if (primary?.address) {
      isConnectingRef.current = false;
      syncWithBackend(primary.address).catch((err) => {
        console.warn('Failed to bind authenticated Privy wallet:', err);
      });
    }
  }, [ready, authenticated, wallets]);

  const handleConnect = async () => {
    localStorage.removeItem('fixmate_wallet_unlinked');
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
    localStorage.removeItem('fixmate_wallet_unlinked');
    const trimmed = addr.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
      throw new Error('Invalid EVM address format. Address must start with 0x followed by 40 hex characters.');
    }
    await syncWithBackend(trimmed);
  };

  const unlinkWallet = async () => {
    localStorage.setItem('fixmate_wallet_unlinked', 'true');
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
        setManualWalletAddress,
        unlinkWallet,
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
        localStorage.removeItem('fixmate_wallet_unlinked');
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
    localStorage.setItem('fixmate_wallet_unlinked', 'true');
    try {
      await apiClient.patch('/profiles/wallet-address', { walletAddress: null });
      updateUser({ walletAddress: undefined });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to unlink wallet address';
      throw new Error(msg);
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
        setManualWalletAddress,
        unlinkWallet,
      }}
    >
      {children}
    </UnifiedWalletContext.Provider>
  );
};

export const PrivyProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;
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
