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
const deploymentPath = path.resolve(__dirname, '../src/config/contracts/deployment.json');

/**
 * Updates the ESCROW_CONTRACT_ADDRESS in the .env file
 */
function updateEnvContractAddress(newAddress) {
  if (!fs.existsSync(envPath)) return;
  let envContent = fs.readFileSync(envPath, 'utf8');

  if (envContent.includes('ESCROW_CONTRACT_ADDRESS=')) {
    envContent = envContent.replace(/ESCROW_CONTRACT_ADDRESS=.*$/m, `ESCROW_CONTRACT_ADDRESS="${newAddress}"`);
  } else {
    envContent += `\nESCROW_CONTRACT_ADDRESS="${newAddress}"`;
  }

  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log(`📝 Updated .env with ESCROW_CONTRACT_ADDRESS="${newAddress}"`);
}

async function main() {
  console.log('\n============================================================');
  console.log('🚀 ArtisanEscrow Deployment Tool — Monad Network');
  console.log('============================================================\n');

  if (!fs.existsSync(artifactPath)) {
    console.error('❌ Compiled artifact not found. Running compilation first...');
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
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
    const mockContractAddr = '0x' + Array(40).fill('8').join('');

    const deploymentRecord = {
      network: 'monad-testnet',
      chainId: network ? Number(network.chainId) : 10143,
      contractAddress: mockContractAddr,
      deployerAddress: mockDeployer.address,
      arbiterAddress: mockDeployer.address,
      feeRecipient: mockDeployer.address,
      deployedAt: new Date().toISOString(),
      simulated: true,
      notes: 'Set DEPLOYER_PRIVATE_KEY in .env to deploy live to Monad Testnet.',
    };

    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentRecord, null, 2));
    updateEnvContractAddress(mockContractAddr);

    console.log(`✅ Simulation deployment saved at: ${deploymentPath}`);
    console.log(`📦 Simulated Contract Address: ${mockContractAddr}\n`);
    return;
  }

  const wallet = new ethers.Wallet(privateKey, provider);
  console.log(`👤 Deployer Wallet Address: ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Account Balance: ${ethers.formatEther(balance)} MON`);

  if (balance === 0n) {
    console.error('❌ Deployer account balance is 0 MON. Please fund your wallet via the Monad Testnet Faucet.');
    process.exit(1);
  }

  const arbiterAddress = process.env.ESCROW_ARBITER_ADDRESS && ethers.isAddress(process.env.ESCROW_ARBITER_ADDRESS)
    ? process.env.ESCROW_ARBITER_ADDRESS
    : wallet.address;

  const feeRecipientAddress = process.env.ESCROW_FEE_RECIPIENT && ethers.isAddress(process.env.ESCROW_FEE_RECIPIENT)
    ? process.env.ESCROW_FEE_RECIPIENT
    : wallet.address;

  console.log(`🏛️ Arbiter Address: ${arbiterAddress}`);
  console.log(`💳 Fee Collector Address: ${feeRecipientAddress}`);

  console.log(`⏳ Deploying ArtisanEscrow contract...`);
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy(arbiterAddress, feeRecipientAddress);

  console.log(`📤 Deployment Tx Sent: ${contract.deploymentTransaction()?.hash}`);
  console.log(`⏳ Waiting for block confirmation on Monad...`);
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log(`\n🎉 SUCCESS! ArtisanEscrow deployed at: ${contractAddress}`);

  const deploymentInfo = {
    network: 'monad-testnet',
    chainId: Number(network.chainId),
    rpcUrl,
    contractAddress,
    deployerAddress: wallet.address,
    arbiterAddress,
    feeRecipient: feeRecipientAddress,
    transactionHash: contract.deploymentTransaction()?.hash,
    deployedAt: new Date().toISOString(),
    simulated: false,
  };

  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  updateEnvContractAddress(contractAddress);

  console.log(`📄 Deployment receipt saved to: ${deploymentPath}\n`);
}

main().catch((error) => {
  console.error('❌ Deployment error:', error);
  process.exit(1);
});
