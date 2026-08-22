import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import prisma from '../src/config/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const artifactPath = path.resolve(__dirname, '../src/config/contracts/ArtisanEscrow.json');

async function main() {
  console.log('\n============================================================');
  console.log('⚡ Artisan Escrow — Live Monad Testnet Verification Tool');
  console.log('============================================================\n');

  const rpcUrl = process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz';
  const chainId = process.env.MONAD_CHAIN_ID || 10143;
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  let contractAddress = process.env.ESCROW_CONTRACT_ADDRESS;

  console.log(`🌐 Monad RPC URL:       ${rpcUrl}`);
  console.log(`⛓️  Expected Chain ID:   ${chainId}`);

  // 1. Check RPC & Network Connectivity
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  let network, blockNumber;
  try {
    network = await provider.getNetwork();
    blockNumber = await provider.getBlockNumber();
    console.log(`✅ Connected to Monad Network! Chain ID: ${network.chainId.toString()}, Current Block: #${blockNumber}`);
  } catch (err) {
    console.error(`❌ Failed to connect to Monad RPC at ${rpcUrl}`);
    console.error(`   Error: ${err.message}`);
    process.exit(1);
  }

  // 2. Check Wallet
  if (!privateKey || privateKey.length < 32 || privateKey.includes('your_private_key')) {
    console.log('\n⚠️  No DEPLOYER_PRIVATE_KEY found in .env.');
    console.log('👉 To run live on-chain transactions on Monad Testnet:');
    console.log('   1. Get testnet MON from the faucet (https://faucet.monad.xyz)');
    console.log('   2. Set DEPLOYER_PRIVATE_KEY="0x..." in your .env file');
    console.log('   3. Run `npm run deploy:escrow` to deploy ArtisanEscrow.sol');
    console.log('   4. Re-run `npm run test:live-monad`\n');
    return;
  }

  const wallet = new ethers.Wallet(privateKey, provider);
  console.log(`👤 Deployer/Funder Address: ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  const monBalance = ethers.formatEther(balance);
  console.log(`💰 Account Balance:        ${monBalance} MON`);

  if (balance === 0n) {
    console.log('\n⚠️  Wallet balance is 0 MON.');
    console.log(`👉 Please fund address ${wallet.address} via the Monad Testnet Faucet (https://faucet.monad.xyz)`);
    return;
  }

  // 3. Check / Verify Contract
  if (!contractAddress || !ethers.isAddress(contractAddress) || contractAddress.includes('88888888')) {
    console.log('\n⏳ Contract not yet deployed to Monad Testnet. Deploying now...');
    if (!fs.existsSync(artifactPath)) {
      console.log('🔨 Compiling ArtisanEscrow.sol...');
      const { execSync } = await import('child_process');
      execSync('node scripts/compile-contract.js', { stdio: 'inherit' });
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    const contract = await factory.deploy(wallet.address, wallet.address);
    console.log(`📤 Deployment Tx Sent: ${contract.deploymentTransaction()?.hash}`);
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
    console.log(`🎉 Contract deployed to Monad at: ${contractAddress}\n`);
  } else {
    console.log(`📦 Escrow Contract Address: ${contractAddress}`);
  }

  // 4. Live On-Chain Test Flow
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const contract = new ethers.Contract(contractAddress, artifact.abi, wallet);

  console.log('\n🧪 Executing Live On-Chain Escrow Lifecycle on Monad...');
  
  // Random artisan wallet for test
  const testArtisanWallet = ethers.Wallet.createRandom();
  const testContractCode = `CTR-LIVE-${Date.now()}`;
  const testAmount = ethers.parseEther('0.001'); // 0.001 MON
  const feeBps = 500n; // 5.00%

  console.log(`1️⃣ Calling createAndFundEscrow() with 0.001 MON...`);
  const fundTx = await contract.createAndFundEscrow(testContractCode, testArtisanWallet.address, feeBps, {
    value: testAmount,
  });
  console.log(`   Tx Hash: ${fundTx.hash}`);
  console.log(`   Waiting for confirmation on Monad...`);
  const fundReceipt = await fundTx.wait(1);
  console.log(`✅ Escrow created in block #${fundReceipt.blockNumber}!`);

  const escrowId = await contract.codeToEscrowId(testContractCode);
  console.log(`   On-Chain Escrow ID: #${escrowId.toString()}`);

  const onChainData = await contract.getEscrow(escrowId);
  console.log(`   State: FUNDED (Amount: ${ethers.formatEther(onChainData.amount)} MON, Artisan: ${onChainData.artisan})`);

  console.log(`\n2️⃣ Calling submitWork() from artisan wallet...`);
  // Fund artisan wallet with 0.15 MON to comfortably cover Monad peak gas price (200+ Gwei mempool buffer)
  console.log(`   Funding test artisan (${testArtisanWallet.address}) with 0.15 MON for gas...`);
  const artisanFunderTx = await wallet.sendTransaction({
    to: testArtisanWallet.address,
    value: ethers.parseEther('0.15'),
  });
  await artisanFunderTx.wait(1);
  console.log(`   Artisan funded. Tx: ${artisanFunderTx.hash}`);

  // Small delay for RPC balance cache
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const artisanSigner = testArtisanWallet.connect(provider);
  const submitTx = await contract.connect(artisanSigner).submitWork(escrowId);
  console.log(`   Tx Hash: ${submitTx.hash}`);
  const submitReceipt = await submitTx.wait(1);
  console.log(`✅ Work submitted on-chain in block #${submitReceipt.blockNumber}!`);

  console.log(`\n3️⃣ Calling approveAndRelease() by Client...`);
  const releaseTx = await contract.approveAndRelease(escrowId);
  console.log(`   Tx Hash: ${releaseTx.hash}`);
  const releaseReceipt = await releaseTx.wait(1);
  console.log(`✅ Funds released in block #${releaseReceipt.blockNumber}!`);

  const artisanFinalBalance = await provider.getBalance(testArtisanWallet.address);
  console.log(`💰 Artisan Final Balance on Monad: ${ethers.formatEther(artisanFinalBalance)} MON (Earned 95% of Escrow + Gas remainder)`);

  console.log('\n============================================================');
  console.log('🎉 MONAD TESTNET LIVE VERIFICATION COMPLETED SUCCESSFULLY!');
  console.log('============================================================\n');
}

main().catch((err) => {
  console.error('\n❌ Live Monad Test error:', err);
  process.exit(1);
});
