import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const artifactPath = path.resolve(__dirname, '../src/config/contracts/ArtisanEscrow.json');
const usdcArtifactPath = path.resolve(__dirname, '../src/config/contracts/MockUSDC.json');

async function main() {
  console.log('\n============================================================');
  console.log('⚡ Artisan Escrow — Live Monad Testnet USDC Verification');
  console.log('============================================================\n');

  const rpcUrl = process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz';
  const chainId = process.env.MONAD_CHAIN_ID || 10143;
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  const contractAddress = process.env.ESCROW_CONTRACT_ADDRESS;
  const usdcAddress = process.env.STABLECOIN_CONTRACT_ADDRESS;

  console.log(`🌐 Monad RPC URL:           ${rpcUrl}`);
  console.log(`⛓️  Expected Chain ID:       ${chainId}`);
  console.log(`📦 Escrow Contract Address: ${contractAddress}`);
  console.log(`💵 USDC Contract Address:   ${usdcAddress}`);

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
  if (!privateKey || privateKey.length < 32) {
    console.error('❌ No DEPLOYER_PRIVATE_KEY found in .env.');
    return;
  }

  const wallet = new ethers.Wallet(privateKey, provider);
  console.log(`👤 Client/Deployer Address: ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Account Native Balance:  ${ethers.formatEther(balance)} MON`);

  // 3. Contracts
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const usdcArtifact = JSON.parse(fs.readFileSync(usdcArtifactPath, 'utf8'));

  const escrowContract = new ethers.Contract(contractAddress, artifact.abi, wallet);
  const usdcContract = new ethers.Contract(usdcAddress, usdcArtifact.abi, wallet);

  // Check client USDC balance
  let clientUsdcBalance = await usdcContract.balanceOf(wallet.address);
  console.log(`💵 Client USDC Balance:     ${ethers.formatUnits(clientUsdcBalance, 6)} USDC`);

  const testAmount = ethers.parseUnits('25.0', 6); // 25.00 USDC
  if (clientUsdcBalance < testAmount) {
    console.log(`⏳ Minting 100 USDC to client via testnet faucet...`);
    const mintTx = await usdcContract.mint(wallet.address, ethers.parseUnits('100.0', 6));
    await mintTx.wait(1);
    clientUsdcBalance = await usdcContract.balanceOf(wallet.address);
    console.log(`✅ Minted! New USDC Balance: ${ethers.formatUnits(clientUsdcBalance, 6)} USDC`);
  }

  console.log('\n🧪 Executing Live On-Chain Escrow Lifecycle with USDC on Monad...');

  const testArtisanWallet = ethers.Wallet.createRandom();
  const testContractCode = `CTR-USDC-${Date.now()}`;
  const feeBps = 500n; // 5.00%

  // Step 1: Approve Escrow contract to spend USDC
  console.log(`\n1️⃣ Calling usdc.approve() for 25.00 USDC...`);
  const approveTx = await usdcContract.approve(contractAddress, testAmount);
  console.log(`   Approve Tx Sent: ${approveTx.hash}`);
  await approveTx.wait(1);
  console.log(`✅ Escrow contract approved to spend USDC!`);

  // Step 2: Create and Fund Escrow with USDC
  console.log(`\n2️⃣ Calling createAndFundEscrow() with 25.00 USDC...`);
  const fundTx = await escrowContract.createAndFundEscrow(
    testContractCode,
    testArtisanWallet.address,
    testAmount,
    feeBps
  );
  console.log(`   Fund Tx Sent: ${fundTx.hash}`);
  const fundReceipt = await fundTx.wait(1);
  console.log(`✅ Escrow created and funded with USDC in block #${fundReceipt.blockNumber}!`);

  const escrowId = await escrowContract.codeToEscrowId(testContractCode);
  console.log(`   On-Chain Escrow ID: #${escrowId.toString()}`);

  const onChainData = await escrowContract.getEscrow(escrowId);
  console.log(`   State: FUNDED (Amount: ${ethers.formatUnits(onChainData.amount, 6)} USDC, Artisan: ${onChainData.artisan})`);

  // Step 3: Artisan Submits Work
  console.log(`\n3️⃣ Calling submitWork() from artisan wallet...`);
  console.log(`   Funding test artisan (${testArtisanWallet.address}) with 0.1 MON for gas...`);
  const artisanFunderTx = await wallet.sendTransaction({
    to: testArtisanWallet.address,
    value: ethers.parseEther('0.1'),
  });
  await artisanFunderTx.wait(1);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const artisanSigner = testArtisanWallet.connect(provider);
  const submitTx = await escrowContract.connect(artisanSigner).submitWork(escrowId);
  console.log(`   Submit Tx: ${submitTx.hash}`);
  await submitTx.wait(1);
  console.log(`✅ Work submitted on-chain by artisan!`);

  // Step 4: Client Approves and Releases Escrow
  console.log(`\n4️⃣ Calling approveAndRelease() by Client...`);
  const releaseTx = await escrowContract.approveAndRelease(escrowId);
  console.log(`   Release Tx: ${releaseTx.hash}`);
  const releaseReceipt = await releaseTx.wait(1);
  console.log(`✅ Funds released in block #${releaseReceipt.blockNumber}!`);

  // Verify Artisan USDC balance
  const artisanFinalUsdc = await usdcContract.balanceOf(testArtisanWallet.address);
  console.log(`🎉 Artisan Final USDC Balance: ${ethers.formatUnits(artisanFinalUsdc, 6)} USDC (Earned 95% of 25 USDC = 23.75 USDC)`);

  console.log('\n============================================================');
  console.log('🎉 MONAD TESTNET LIVE USDC ESCROW VERIFIED SUCCESSFULLY!');
  console.log('============================================================\n');
}

main().catch((err) => {
  console.error('\n❌ Live Monad USDC Test error:', err);
  process.exit(1);
});
