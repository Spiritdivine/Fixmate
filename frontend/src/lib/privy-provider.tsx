import React, { createContext, useContext, useEffect } from 'react';
import {
  PrivyProvider as BasePrivyProvider,
  usePrivy,
  useWallets,
  useCreateWallet,
  useExportWallet,
} from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { apiClient } from './api-client';
import { useAuthStore } from '../stores/authStore';
import {
  setPrivyWeb3Provider,
  getActiveWeb3Provider,
} from './monad-web3';
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

export interface UnifiedWalletContextType {
  address: string | null;
  isConnected: boolean;
  isEmbedded: boolean;
  walletType: 'PRIVY_EMBEDDED' | 'NONE';
  getEthereumProvider: () => Promise<any | null>;
  getSigner: () => Promise<ethers.Signer | null>;
  connect: () => Promise<{ address: string }>;
  disconnect: () => Promise<void>;
  createEmbeddedWallet: () => Promise<string | null>;
  exportWallet: () => Promise<void>;
  unlinkWallet: () => Promise<void>;
  sponsorGas: () => Promise<{ success: boolean; message: string }>;
  checkGas: () => Promise<{ balanceMon: number; isSponsorshipEligible: boolean }>;
}

const UnifiedWalletContext = createContext<UnifiedWalletContextType>({
  address: null,
  isConnected: false,
  isEmbedded: false,
  walletType: 'NONE',
  getEthereumProvider: async () => null,
  getSigner: async () => null,
  connect: async () => ({ address: '' }),
  disconnect: async () => {},
  createEmbeddedWallet: async () => null,
  exportWallet: async () => {},
  unlinkWallet: async () => {},
  sponsorGas: async () => ({ success: false, message: 'Not supported' }),
  checkGas: async () => ({ balanceMon: 0, isSponsorshipEligible: false }),
});

export const useUnifiedWallet = () => useContext(UnifiedWalletContext);

// Active Privy Bridge Component
const ActivePrivyBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const { createWallet } = useCreateWallet();
  const { exportWallet: privyExportWallet } = useExportWallet();
  const { user: appUser, updateUser } = useAuthStore();
  const isAutoSyncingRef = React.useRef(false);

  // Single source of truth: User's permanent embedded EVM wallet address from their profile
  const currentAddress = appUser?.walletAddress || null;
  const isEmbedded = Boolean(currentAddress);
  const walletType = isEmbedded ? 'PRIVY_EMBEDDED' : 'NONE';

  // Automatically register Privy's EIP-1193 provider with monad-web3 for on-chain contract interactions
  useEffect(() => {
    const embedded = wallets?.find((w) => w.walletClientType === 'privy');
    if (embedded && typeof embedded.getEthereumProvider === 'function') {
      embedded
        .getEthereumProvider()
        .then((provider) => {
          setPrivyWeb3Provider(provider);
        })
        .catch((err) => {
          console.warn('[PrivyBridge] Notice registering embedded provider:', err?.message || err);
        });
    }
  }, [wallets]);

  // Auto-sync or provision embedded wallet when user is logged in
  useEffect(() => {
    if (!ready || !appUser || isAutoSyncingRef.current) return;

    // Check if Privy has an embedded wallet ready
    const embedded = wallets?.find((w) => w.walletClientType === 'privy');

    if (embedded?.address && !appUser.walletAddress) {
      isAutoSyncingRef.current = true;
      updateUser({ walletAddress: embedded.address });
      isAutoSyncingRef.current = false;
    } else if (!appUser.walletAddress && authenticated && (!wallets || wallets.length === 0)) {
      // Lazy creation of an embedded wallet via Privy React SDK
      isAutoSyncingRef.current = true;
      createWallet()
        .then((newWallet) => {
          if (newWallet?.address) {
            updateUser({ walletAddress: newWallet.address });
          }
        })
        .catch((err) => {
          console.warn('[PrivyBridge] Lazy createWallet notice:', err?.message || err);
        })
        .finally(() => {
          isAutoSyncingRef.current = false;
        });
    }
  }, [ready, authenticated, wallets, appUser?.walletAddress]);

  const getEthereumProvider = async (): Promise<any | null> => {
    const embedded = wallets?.find((w) => w.walletClientType === 'privy');
    if (embedded && typeof embedded.getEthereumProvider === 'function') {
      try {
        const provider = await embedded.getEthereumProvider();
        setPrivyWeb3Provider(provider);
        return provider;
      } catch (err: any) {
        console.warn('[PrivyBridge] Failed to get embedded provider:', err?.message || err);
      }
    }
    return getActiveWeb3Provider();
  };

  const getSigner = async (): Promise<ethers.Signer | null> => {
    const rawProvider = await getEthereumProvider();
    if (!rawProvider) return null;
    try {
      const browserProvider = new ethers.BrowserProvider(rawProvider);
      return await browserProvider.getSigner();
    } catch (err: any) {
      console.warn('[PrivyBridge] Error creating ethers Signer:', err?.message || err);
      return null;
    }
  };

  const handleConnect = async () => {
    if (currentAddress) {
      return { address: currentAddress };
    }
    if (ready && authenticated) {
      try {
        const newWallet = await createWallet();
        if (newWallet?.address) {
          updateUser({ walletAddress: newWallet.address });
          return { address: newWallet.address };
        }
      } catch (err: any) {
        console.warn('[PrivyBridge] Manual createWallet error:', err?.message || err);
      }
    }
    return { address: currentAddress || '' };
  };

  const createEmbeddedWallet = async (): Promise<string | null> => {
    try {
      const existing = wallets?.find((w) => w.walletClientType === 'privy');
      if (existing?.address) {
        updateUser({ walletAddress: existing.address });
        return existing.address;
      }
      const newWallet = await createWallet();
      if (newWallet?.address) {
        updateUser({ walletAddress: newWallet.address });
        return newWallet.address;
      }
      return currentAddress;
    } catch (err: any) {
      console.warn('[PrivyBridge] createEmbeddedWallet error:', err?.message || err);
      return currentAddress;
    }
  };

  const handleExportWallet = async () => {
    // If the browser session is not yet authenticated in Privy, prompt Privy verification with the user's email
    if (!authenticated) {
      if (typeof login === 'function') {
        login({
          prefill: appUser?.email ? { type: 'email', value: appUser.email } : undefined,
        });
        return;
      }
      throw new Error('Please verify your session to export your private key.');
    }

    if (!privyExportWallet) {
      throw new Error('Wallet export is not available in the current session.');
    }
    try {
      const embedded = wallets?.find((w) => w.walletClientType === 'privy');
      const targetAddress = embedded?.address || currentAddress;
      if (targetAddress) {
        await privyExportWallet({ address: targetAddress });
      } else {
        await privyExportWallet();
      }
    } catch (err: any) {
      console.warn('[PrivyBridge] Export wallet notice:', err?.message || err);
      throw err;
    }
  };

  // Safe no-op disconnect/unlink for backwards compatibility with any remaining caller
  const handleDisconnect = async () => {};
  const handleUnlinkWallet = async () => {};

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
        getEthereumProvider,
        getSigner,
        connect: handleConnect,
        disconnect: handleDisconnect,
        createEmbeddedWallet,
        exportWallet: handleExportWallet,
        unlinkWallet: handleUnlinkWallet,
        sponsorGas,
        checkGas,
      }}
    >
      {children}
    </UnifiedWalletContext.Provider>
  );
};

// Fallback Browser Provider (When Privy App ID is not configured or in offline dev)
const FallbackBrowserBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: appUser } = useAuthStore();
  const address = appUser?.walletAddress || null;

  const getEthereumProvider = async (): Promise<any | null> => {
    return typeof window !== 'undefined' ? window.ethereum : null;
  };

  const getSigner = async (): Promise<ethers.Signer | null> => {
    if (typeof window === 'undefined' || !window.ethereum) return null;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      return await provider.getSigner();
    } catch {
      return null;
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
        isEmbedded: Boolean(address),
        walletType: address ? 'PRIVY_EMBEDDED' : 'NONE',
        getEthereumProvider,
        getSigner,
        connect: async () => ({ address: address || '' }),
        disconnect: async () => {},
        createEmbeddedWallet: async () => address,
        exportWallet: async () => {},
        unlinkWallet: async () => {},
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
          walletList: [], // Pure embedded wallet: external connectors disabled
        },
        loginMethods: ['email', 'google'],
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
