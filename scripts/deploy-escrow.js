import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env');
const artifactPath = path.resolve(__dirname, '../src/config/contracts/ArtisanEscrow.json');
const usdcArtifactPath = path.resolve(__dirname, '../src/config/contracts/MockUSDC.json');
const deploymentPath = path.resolve(__dirname, '../src/config/contracts/deployment.json');

/**
 * Updates the ESCROW_CONTRACT_ADDRESS and STABLECOIN_CONTRACT_ADDRESS in the .env file
 */
function updateEnvAddresses(newEscrowAddress, newStablecoinAddress) {
  if (!fs.existsSync(envPath)) return;
  let envContent = fs.readFileSync(envPath, 'utf8');

  if (envContent.includes('ESCROW_CONTRACT_ADDRESS=')) {
    envContent = envContent.replace(/ESCROW_CONTRACT_ADDRESS=.*$/m, `ESCROW_CONTRACT_ADDRESS="${newEscrowAddress}"`);
  } else {
    envContent += `\nESCROW_CONTRACT_ADDRESS="${newEscrowAddress}"`;
  }

  if (newStablecoinAddress) {
    if (envContent.includes('STABLECOIN_CONTRACT_ADDRESS=')) {
      envContent = envContent.replace(/STABLECOIN_CONTRACT_ADDRESS=.*$/m, `STABLECOIN_CONTRACT_ADDRESS="${newStablecoinAddress}"`);
    } else {
      envContent += `\nSTABLECOIN_CONTRACT_ADDRESS="${newStablecoinAddress}"`;
    }
  }

  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log(`📝 Updated .env with ESCROW_CONTRACT_ADDRESS and STABLECOIN_CONTRACT_ADDRESS`);
}

async function main() {
  console.log('\n============================================================');
  console.log('🚀 ArtisanEscrow (Stablecoin USDC) Deployment Tool — Monad');
  console.log('============================================================\n');

  if (!fs.existsSync(artifactPath) || !fs.existsSync(usdcArtifactPath)) {
    console.error('❌ Compiled artifacts not found. Running compilation first...');
    const { execSync } = await import('child_process');
    execSync('node scripts/compile-contract.js', { stdio: 'inherit' });
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const usdcArtifact = JSON.parse(fs.readFileSync(usdcArtifactPath, 'utf8'));
  const rpcUrl = process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz';
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY || process.env.ARBITER_PRIVATE_KEY;

  console.log(`🌐 Monad RPC URL: ${rpcUrl}`);

  // Test provider connection
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  let network;
  try {
    network = await provider.getNetwork();
    console.log(`🔗 Connected to Network: Chain ID ${network.chainId.toString()}`);
  } catch (err) {
    console.warn(`⚠️ Could not reach live Monad RPC at ${rpcUrl}. (${err.message})`);
  }

  if (!privateKey || privateKey === '0x_your_private_key_here' || privateKey.length < 32) {
    console.log('\n⚠️  No funded DEPLOYER_PRIVATE_KEY found in .env.');
    console.log('⚙️  Generating a simulation deployment record for local development...\n');

    const mockDeployer = ethers.Wallet.createRandom();
    const mockEscrowAddr = '0x' + Array(40).fill('8').join('');
    const mockUsdcAddr = '0x' + Array(40).fill('7').join('');

    const deploymentRecord = {
      network: 'monad-testnet',
      chainId: network ? Number(network.chainId) : 10143,
      contractAddress: mockEscrowAddr,
      paymentTokenAddress: mockUsdcAddr,
      tokenSymbol: 'USDC',
      tokenDecimals: 6,
      deployerAddress: mockDeployer.address,
      arbiterAddress: mockDeployer.address,
      feeRecipient: mockDeployer.address,
      deployedAt: new Date().toISOString(),
      simulated: true,
      notes: 'Set DEPLOYER_PRIVATE_KEY in .env to deploy live to Monad Testnet.',
    };

    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentRecord, null, 2));
    updateEnvAddresses(mockEscrowAddr, mockUsdcAddr);

    console.log(`✅ Simulation deployment saved at: ${deploymentPath}`);
    console.log(`📦 Simulated Escrow Address:     ${mockEscrowAddr}`);
    console.log(`💵 Simulated Stablecoin Address: ${mockUsdcAddr}\n`);
    return;
  }

  const wallet = new ethers.Wallet(privateKey, provider);
  console.log(`👤 Deployer Wallet Address: ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Account Native Balance:  ${ethers.formatEther(balance)} MON`);

  if (balance === 0n) {
    console.error('❌ Deployer account balance is 0 MON. Please fund your wallet via the Monad Testnet Faucet.');
    process.exit(1);
  }

  // 1. Deploy or resolve MockUSDC
  let usdcAddress = process.env.STABLECOIN_CONTRACT_ADDRESS;
  if (!usdcAddress || !ethers.isAddress(usdcAddress)) {
    console.log(`\n⏳ Deploying MockUSDC Stablecoin contract...`);
    const usdcFactory = new ethers.ContractFactory(usdcArtifact.abi, usdcArtifact.bytecode, wallet);
    const usdcContract = await usdcFactory.deploy();
    await usdcContract.waitForDeployment();
    usdcAddress = await usdcContract.getAddress();
    console.log(`🎉 MockUSDC deployed at: ${usdcAddress}`);
  } else {
    console.log(`💵 Using existing Stablecoin at: ${usdcAddress}`);
  }

  // 2. Resolve Arbiter and Fee Recipient
  const arbiterAddress = process.env.ESCROW_ARBITER_ADDRESS && ethers.isAddress(process.env.ESCROW_ARBITER_ADDRESS)
    ? process.env.ESCROW_ARBITER_ADDRESS
    : wallet.address;

  const feeRecipientAddress = process.env.ESCROW_FEE_RECIPIENT && ethers.isAddress(process.env.ESCROW_FEE_RECIPIENT)
    ? process.env.ESCROW_FEE_RECIPIENT
    : wallet.address;

  console.log(`🏛️ Arbiter Address:       ${arbiterAddress}`);
  console.log(`💳 Fee Collector Address: ${feeRecipientAddress}`);

  // 3. Deploy ArtisanEscrow
  console.log(`\n⏳ Deploying ArtisanEscrow contract (with Stablecoin paymentToken)...`);
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy(arbiterAddress, feeRecipientAddress, usdcAddress);

  console.log(`📤 Deployment Tx Sent: ${contract.deploymentTransaction()?.hash}`);
  console.log(`⏳ Waiting for block confirmation on Monad...`);
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log(`\n🎉 SUCCESS! ArtisanEscrow deployed at: ${contractAddress}`);

  const deploymentInfo = {
    network: 'monad-testnet',
    chainId: Number(network?.chainId || 10143),
    rpcUrl,
    contractAddress,
    paymentTokenAddress: usdcAddress,
    tokenSymbol: 'USDC',
    tokenDecimals: 6,
    deployerAddress: wallet.address,
    arbiterAddress,
    feeRecipient: feeRecipientAddress,
    transactionHash: contract.deploymentTransaction()?.hash,
    deployedAt: new Date().toISOString(),
    simulated: false,
  };

  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  updateEnvAddresses(contractAddress, usdcAddress);

  console.log(`📄 Deployment receipt saved to: ${deploymentPath}\n`);
}

main().catch((error) => {
  console.error('❌ Deployment error:', error);
  process.exit(1);
});
