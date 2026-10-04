import { ethers, BrowserProvider, Contract } from 'ethers';
import {
  MONAD_CHAIN_ID as ENV_CHAIN_ID,
  MONAD_RPC_URL as ENV_RPC_URL,
  MONAD_NETWORK as ENV_NETWORK,
  MONAD_EXPLORER_URL as ENV_EXPLORER_URL,
  ESCROW_CONTRACT_ADDRESS as ENV_ESCROW,
  STABLECOIN_ADDRESS as ENV_STABLECOIN,
  TREASURY_ADDRESS as ENV_TREASURY,
} from '../config/env';

// Declare window.ethereum for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}

export const MONAD_CHAIN_ID = ENV_CHAIN_ID;
export const MONAD_CHAIN_HEX = `0x${ENV_CHAIN_ID.toString(16)}`;
export const MONAD_RPC_URL = ENV_RPC_URL;
export const MONAD_EXPLORER_URL = ENV_EXPLORER_URL;
export const IS_MONAD_MAINNET = MONAD_CHAIN_ID === 143 || ENV_NETWORK === 'mainnet';
export const MONAD_CHAIN_NAME = IS_MONAD_MAINNET ? 'Monad Mainnet' : 'Monad Testnet';

// Deployed addresses on Monad
export const ESCROW_CONTRACT_ADDRESS = ENV_ESCROW;
export const STABLECOIN_ADDRESS = ENV_STABLECOIN;
export const TREASURY_ADDRESS = ENV_TREASURY;
export const USDC_DECIMALS = 6;

export function getExplorerTxUrl(txHash: string): string {
  return `${MONAD_EXPLORER_URL}/tx/${txHash}`;
}

export function getExplorerAddressUrl(address: string): string {
  return `${MONAD_EXPLORER_URL}/address/${address}`;
}

export const USDC_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function mint(address to, uint256 amount) returns ()',
  'function decimals() view returns (uint8)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

export const ESCROW_ABI = [
  'function createAndFundEscrow(string contractCode, address artisan, uint256 amount, uint256 feeBps) returns (uint256)',
  'function submitWork(uint256 escrowId)',
  'function approveAndRelease(uint256 escrowId)',
  'function raiseDispute(uint256 escrowId, string reason)',
  'function refundClient(uint256 escrowId)',
  'function claimInactivityRefund(uint256 escrowId)',
  'function getEscrow(uint256 escrowId) view returns (tuple(uint256 id, string contractCode, address client, address artisan, uint256 amount, uint256 platformFeeBps, uint8 state, uint256 createdAt, uint256 completedAt))',
  'event EscrowCreated(uint256 indexed escrowId, string contractCode, address indexed client, address indexed artisan, uint256 amount, uint256 feeBps)',
  'event EscrowReleased(uint256 indexed escrowId, address indexed artisan, uint256 artisanAmount, uint256 platformFee)',
];

// Active EIP-1193 provider registered from Privy embedded wallet
let activeEip1193Provider: any = null;

/**
 * Registers an active EIP-1193 provider from Privy embedded wallet
 */
export function setPrivyWeb3Provider(provider: any | null): void {
  activeEip1193Provider = provider;
}

/**
 * Resolves the currently active Web3 provider:
 * 1. Privy embedded wallet EIP-1193 provider (highest priority)
 * 2. Injected window.ethereum provider (fallback)
 */
export function getActiveWeb3Provider(): any | null {
  return activeEip1193Provider || (typeof window !== 'undefined' ? window.ethereum : null);
}

/**
 * Checks whether an Ethereum wallet provider is available in the browser (Privy embedded or injected)
 */
export function hasWeb3Provider(): boolean {
  return Boolean(getActiveWeb3Provider());
}

/**
 * Returns a robust read-only JsonRpcProvider connected to Monad
 */
export function getReadOnlyProvider(): ethers.Provider {
  return new ethers.JsonRpcProvider(MONAD_RPC_URL);
}

/**
 * Requests wallet connection and ensures user is on Monad (Mainnet or Testnet).
 * Seamlessly prioritizes Privy embedded wallet before falling back to browser injected wallets.
 */
export async function connectWallet(customProvider?: any) {
  const rawProvider = customProvider || getActiveWeb3Provider();
  if (!rawProvider) {
    throw new Error('No Web3 wallet available. Please initialize your Privy embedded wallet or connect a compatible browser wallet.');
  }

  const provider = new BrowserProvider(rawProvider);
  
  // Attempt accounts unlocking if the provider supports eth_requestAccounts
  try {
    if (typeof rawProvider.request === 'function') {
      await rawProvider.request({ method: 'eth_requestAccounts' });
    }
  } catch (accountsErr: any) {
    console.warn('[monad-web3] eth_requestAccounts notice:', accountsErr?.message || accountsErr);
  }

  // Gracefully attempt network switch to configured Monad network without crashing wallet connection
  try {
    await switchToMonadNetwork(rawProvider);
  } catch (err: any) {
    console.warn('[monad-web3] Monad network switch deferred or skipped:', err?.message || err);
  }

  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  return { address, provider, signer };
}

/**
 * Switches the connected wallet to the configured Monad Network (Mainnet or Testnet)
 */
export async function switchToMonadNetwork(customProvider?: any): Promise<void> {
  const rawProvider = customProvider || getActiveWeb3Provider();
  if (!rawProvider || typeof rawProvider.request !== 'function') return;

  try {
    await rawProvider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: MONAD_CHAIN_HEX }],
    });
  } catch (switchError: any) {
    const errorCode = switchError?.code || switchError?.data?.originalError?.code || switchError?.info?.error?.code;
    const errorMsg = String(switchError?.message || '').toLowerCase();

    // 4902 error code indicates that the chain has not been added to wallet
    if (errorCode === 4902 || errorCode === -32603 || errorMsg.includes('unrecognized chain') || errorMsg.includes('has not been added')) {
      await rawProvider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: MONAD_CHAIN_HEX,
            chainName: MONAD_CHAIN_NAME,
            nativeCurrency: {
              name: 'Monad',
              symbol: 'MON',
              decimals: 18,
            },
            rpcUrls: [MONAD_RPC_URL],
            blockExplorerUrls: [MONAD_EXPLORER_URL],
          },
        ],
      });
    } else {
      console.warn('[monad-web3] Network switch notice:', switchError?.message || switchError);
    }
  }
}

/**
 * Backward compatibility alias for switchToMonadNetwork
 */
export async function switchToMonadTestnet(customProvider?: any): Promise<void> {
  return switchToMonadNetwork(customProvider);
}

/**
 * Fetches USDC balance for a given address using reliable read-only Monad RPC
 */
export async function getUsdcBalance(userAddress: string): Promise<string> {
  if (!userAddress || !ethers.isAddress(userAddress)) return '0.00';
  try {
    const provider = getReadOnlyProvider();
    const token = new Contract(STABLECOIN_ADDRESS, USDC_ABI, provider);
    const balance = await token.balanceOf(userAddress);
    return ethers.formatUnits(balance, USDC_DECIMALS);
  } catch (err: any) {
    console.warn('[monad-web3] Error fetching USDC balance:', err?.message || err);
    return '0.00';
  }
}

/**
 * Checks the allowance granted to the Escrow contract using reliable read-only Monad RPC
 */
export async function getUsdcAllowance(userAddress: string): Promise<string> {
  if (!userAddress || !ethers.isAddress(userAddress)) return '0.00';
  try {
    const provider = getReadOnlyProvider();
    const token = new Contract(STABLECOIN_ADDRESS, USDC_ABI, provider);
    const allowance = await token.allowance(userAddress, ESCROW_CONTRACT_ADDRESS);
    return ethers.formatUnits(allowance, USDC_DECIMALS);
  } catch (err: any) {
    console.warn('[monad-web3] Error fetching USDC allowance:', err?.message || err);
    return '0.00';
  }
}

/**
 * Approves the Escrow contract to spend USDC on behalf of the client
 */
export async function approveUsdc(amountUsdc: number | string, customSigner?: ethers.Signer): Promise<string> {
  const signer = customSigner || (await connectWallet()).signer;
  const address = await signer.getAddress();
  const token = new Contract(STABLECOIN_ADDRESS, USDC_ABI, signer);
  const amountUnits = ethers.parseUnits(Number(amountUsdc).toFixed(USDC_DECIMALS), USDC_DECIMALS);

  // Skip approval transaction if existing allowance already suffices
  try {
    const allowance = await token.allowance(address, ESCROW_CONTRACT_ADDRESS);
    if (BigInt(allowance) >= BigInt(amountUnits)) {
      return 'ALREADY_APPROVED';
    }
  } catch {
    // continue with approval
  }

  const tx = await token.approve(ESCROW_CONTRACT_ADDRESS, amountUnits);
  const receipt = await tx.wait(1);
  return receipt.hash;
}

/**
 * Testnet faucet: mints test USDC to the user's connected address
 */
export async function mintTestUsdc(amountUsdc: number | string = 100, customSigner?: ethers.Signer): Promise<string> {
  const signer = customSigner || (await connectWallet()).signer;
  const address = await signer.getAddress();
  const token = new Contract(STABLECOIN_ADDRESS, USDC_ABI, signer);
  const amountUnits = ethers.parseUnits(Number(amountUsdc).toFixed(USDC_DECIMALS), USDC_DECIMALS);

  const tx = await token.mint(address, amountUnits);
  const receipt = await tx.wait(1);
  return receipt.hash;
}

/**
 * Deposits USDC and creates an Escrow on Monad smart contract
 */
export async function fundOnChainEscrow(
  contractCode: string,
  artisanAddress: string,
  amountUsdc: number | string,
  feeBps: number = 500,
  customSigner?: ethers.Signer
): Promise<{ txHash: string; onChainEscrowId?: number }> {
  const signer = customSigner || (await connectWallet()).signer;
  const escrow = new Contract(ESCROW_CONTRACT_ADDRESS, ESCROW_ABI, signer);
  const amountUnits = ethers.parseUnits(Number(amountUsdc).toFixed(USDC_DECIMALS), USDC_DECIMALS);

  const tx = await escrow.createAndFundEscrow(
    contractCode,
    artisanAddress,
    amountUnits,
    feeBps
  );
  const receipt = await tx.wait(1);

  // Extract escrow ID from logs if possible
  let onChainEscrowId: number | undefined;
  try {
    const iface = new ethers.Interface(ESCROW_ABI);
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed && parsed.name === 'EscrowCreated') {
          onChainEscrowId = Number(parsed.args.escrowId);
          break;
        }
      } catch {
        // ignore log from other contracts
      }
    }
  } catch {
    // fallback
  }

  return {
    txHash: receipt.hash,
    onChainEscrowId,
  };
}

/**
 * Approves deliverable and releases funds to the artisan on-chain
 */
export async function releaseOnChainEscrow(escrowId: number, customSigner?: ethers.Signer): Promise<string> {
  const signer = customSigner || (await connectWallet()).signer;
  const escrow = new Contract(ESCROW_CONTRACT_ADDRESS, ESCROW_ABI, signer);

  const tx = await escrow.approveAndRelease(escrowId);
  const receipt = await tx.wait(1);
  return receipt.hash;
}

/**
 * Transfers USDC on Monad to any external EVM address (Exchange, MetaMask, Cold Wallet)
 */
export async function transferUsdc(
  recipientAddress: string,
  amountUsdc: number | string,
  customSigner?: ethers.Signer
): Promise<string> {
  if (!ethers.isAddress(recipientAddress)) {
    throw new Error('Invalid recipient EVM wallet address.');
  }

  const signer = customSigner || (await connectWallet()).signer;
  const token = new Contract(STABLECOIN_ADDRESS, USDC_ABI, signer);
  const amountUnits = ethers.parseUnits(Number(amountUsdc).toFixed(USDC_DECIMALS), USDC_DECIMALS);

  const tx = await token.transfer(recipientAddress, amountUnits);
  const receipt = await tx.wait(1);
  return receipt.hash;
}

/**
 * Raises a formal dispute on-chain for a funded escrow
 */
export async function raiseDisputeOnChain(
  escrowId: number,
  reason: string,
  customSigner?: ethers.Signer
): Promise<string> {
  const signer = customSigner || (await connectWallet()).signer;
  const escrow = new Contract(ESCROW_CONTRACT_ADDRESS, ESCROW_ABI, signer);

  const tx = await escrow.raiseDispute(escrowId, reason);
  const receipt = await tx.wait(1);
  return receipt.hash;
}

/**
 * Artisan submits completed work on-chain for the funded escrow
 */
export async function submitWorkOnChain(
  escrowId: number,
  customSigner?: ethers.Signer
): Promise<string> {
  const signer = customSigner || (await connectWallet()).signer;
  const escrow = new Contract(ESCROW_CONTRACT_ADDRESS, ESCROW_ABI, signer);

  const tx = await escrow.submitWork(escrowId);
  const receipt = await tx.wait(1);
  return receipt.hash;
}

/**
 * Client reclaims escrowed funds on-chain if 30 days elapse with zero work submitted
 */
export async function claimInactivityRefundOnChain(
  escrowId: number,
  customSigner?: ethers.Signer
): Promise<string> {
  const signer = customSigner || (await connectWallet()).signer;
  const escrow = new Contract(ESCROW_CONTRACT_ADDRESS, ESCROW_ABI, signer);

  const tx = await escrow.claimInactivityRefund(escrowId);
  const receipt = await tx.wait(1);
  return receipt.hash;
}


