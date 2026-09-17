import { ethers, BrowserProvider, Contract } from 'ethers';

// Declare window.ethereum for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}

export const MONAD_CHAIN_ID = 10143;
export const MONAD_CHAIN_HEX = '0x279f';
export const MONAD_RPC_URL = 'https://testnet-rpc.monad.xyz';
export const MONAD_EXPLORER_URL = 'https://testnet.monadvision.com';

// Deployed addresses on Monad Testnet
export const ESCROW_CONTRACT_ADDRESS = '0xfD5aE7dC6f46D43A6f216caf681430A6d7dace7A';
export const STABLECOIN_ADDRESS = '0x4079e33893Fb59B8aD3C618CBEBa06511D6525DD';
export const USDC_DECIMALS = 6;

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
  'function getEscrow(uint256 escrowId) view returns (tuple(uint256 id, string contractCode, address client, address artisan, uint256 amount, uint256 platformFeeBps, uint8 state, uint256 createdAt, uint256 completedAt))',
  'event EscrowCreated(uint256 indexed escrowId, string contractCode, address indexed client, address indexed artisan, uint256 amount, uint256 feeBps)',
  'event EscrowReleased(uint256 indexed escrowId, address indexed artisan, uint256 artisanAmount, uint256 platformFee)',
];

/**
 * Checks whether an Ethereum wallet provider is available in the browser
 */
export function hasWeb3Provider(): boolean {
  return typeof window !== 'undefined' && Boolean(window.ethereum);
}

/**
 * Requests wallet connection and ensures user is on Monad Testnet
 */
export async function connectWallet() {
  if (!hasWeb3Provider()) {
    throw new Error('No Web3 wallet detected. Please install MetaMask or a compatible browser wallet.');
  }

  const provider = new BrowserProvider(window.ethereum);
  const accounts = await provider.send('eth_requestAccounts', []);
  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts selected in wallet.');
  }

  // Gracefully attempt network switch to Monad Testnet without crashing wallet connection
  try {
    await switchToMonadTestnet();
  } catch (err: any) {
    console.warn('Monad Testnet network switch deferred or skipped by user:', err?.message || err);
  }

  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  return { address, provider, signer };
}

/**
 * Switches the connected wallet to Monad Testnet (Chain ID: 10143) or prompts addition
 */
export async function switchToMonadTestnet(): Promise<void> {
  if (!hasWeb3Provider()) return;

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: MONAD_CHAIN_HEX }],
    });
  } catch (switchError: any) {
    const errorCode = switchError?.code || switchError?.data?.originalError?.code || switchError?.info?.error?.code;
    const errorMsg = String(switchError?.message || '').toLowerCase();

    // 4902 error code indicates that the chain has not been added to MetaMask
    if (errorCode === 4902 || errorCode === -32603 || errorMsg.includes('unrecognized chain') || errorMsg.includes('has not been added')) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: MONAD_CHAIN_HEX,
            chainName: 'Monad Testnet',
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
      throw switchError;
    }
  }
}

/**
 * Fetches USDC balance for a given address
 */
export async function getUsdcBalance(userAddress: string): Promise<string> {
  if (!hasWeb3Provider()) return '0.00';
  try {
    const provider = new BrowserProvider(window.ethereum);
    const token = new Contract(STABLECOIN_ADDRESS, USDC_ABI, provider);
    const balance = await token.balanceOf(userAddress);
    return ethers.formatUnits(balance, USDC_DECIMALS);
  } catch {
    return '0.00';
  }
}

/**
 * Checks the allowance granted to the Escrow contract
 */
export async function getUsdcAllowance(userAddress: string): Promise<string> {
  if (!hasWeb3Provider()) return '0.00';
  try {
    const provider = new BrowserProvider(window.ethereum);
    const token = new Contract(STABLECOIN_ADDRESS, USDC_ABI, provider);
    const allowance = await token.allowance(userAddress, ESCROW_CONTRACT_ADDRESS);
    return ethers.formatUnits(allowance, USDC_DECIMALS);
  } catch {
    return '0.00';
  }
}

/**
 * Approves the Escrow contract to spend USDC on behalf of the client
 */
export async function approveUsdc(amountUsdc: number | string): Promise<string> {
  const { signer } = await connectWallet();
  const token = new Contract(STABLECOIN_ADDRESS, USDC_ABI, signer);
  const amountUnits = ethers.parseUnits(Number(amountUsdc).toFixed(USDC_DECIMALS), USDC_DECIMALS);

  const tx = await token.approve(ESCROW_CONTRACT_ADDRESS, amountUnits);
  const receipt = await tx.wait(1);
  return receipt.hash;
}

/**
 * Testnet faucet: mints test USDC to the user's connected address
 */
export async function mintTestUsdc(amountUsdc: number | string = 100): Promise<string> {
  const { signer, address } = await connectWallet();
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
  feeBps: number = 500
): Promise<{ txHash: string; onChainEscrowId?: number }> {
  const { signer } = await connectWallet();
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
export async function releaseOnChainEscrow(escrowId: number): Promise<string> {
  const { signer } = await connectWallet();
  const escrow = new Contract(ESCROW_CONTRACT_ADDRESS, ESCROW_ABI, signer);

  const tx = await escrow.approveAndRelease(escrowId);
  const receipt = await tx.wait(1);
  return receipt.hash;
}

/**
 * Transfers USDC on Monad to any external EVM address (Exchange, MetaMask, Cold Wallet)
 */
export async function transferUsdc(recipientAddress: string, amountUsdc: number | string): Promise<string> {
  if (!ethers.isAddress(recipientAddress)) {
    throw new Error('Invalid recipient EVM wallet address.');
  }

  const { signer } = await connectWallet();
  const token = new Contract(STABLECOIN_ADDRESS, USDC_ABI, signer);
  const amountUnits = ethers.parseUnits(Number(amountUsdc).toFixed(USDC_DECIMALS), USDC_DECIMALS);

  const tx = await token.transfer(recipientAddress, amountUnits);
  const receipt = await tx.wait(1);
  return receipt.hash;
}

/**
 * Raises a formal dispute on-chain for a funded escrow
 */
export async function raiseDisputeOnChain(escrowId: number, reason: string): Promise<string> {
  const { signer } = await connectWallet();
  const escrow = new Contract(ESCROW_CONTRACT_ADDRESS, ESCROW_ABI, signer);

  const tx = await escrow.raiseDispute(escrowId, reason);
  const receipt = await tx.wait(1);
  return receipt.hash;
}

