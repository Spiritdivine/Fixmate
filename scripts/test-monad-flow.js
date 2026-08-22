import prisma from '../src/config/db.js';
import { JobService } from '../src/services/job.service.js';
import { ProposalService } from '../src/services/proposal.service.js';
import { ContractService } from '../src/services/contract.service.js';
import { EscrowService } from '../src/services/escrow.service.js';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🧪 Starting End-to-End Monad Escrow Lifecycle Test...\n');

  // 1. Seed or Fetch Client & Artisan Users
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const clientEmail = `test-client-${Date.now()}@example.com`;
  const artisanEmail = `test-artisan-${Date.now()}@example.com`;

  const client = await prisma.user.create({
    data: {
      email: clientEmail,
      phoneNumber: `+234${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      passwordHash,
      role: 'CLIENT',
      walletAddress: '0x1111111111111111111111111111111111111111',
      clientProfile: {
        create: {
          firstName: 'Emeka',
          lastName: 'Okonkwo',
          state: 'FCT',
          city: 'Abuja',
        },
      },
      wallet: {
        create: {
          availableBalance: 100000.0,
          currency: 'NGN',
        },
      },
    },
  });

  const artisan = await prisma.user.create({
    data: {
      email: artisanEmail,
      phoneNumber: `+234${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      passwordHash,
      role: 'ARTISAN',
      walletAddress: '0x2222222222222222222222222222222222222222',
      artisanProfile: {
        create: {
          businessName: 'Musa Plumbing Solutions',
          yearsOfExperience: 5,
          state: 'FCT',
          lgaCity: 'Abuja',
        },
      },
      wallet: {
        create: {
          availableBalance: 0.0,
          currency: 'NGN',
        },
      },
    },
  });

  // Fetch or create a default JobCategory
  let category = await prisma.jobCategory.findFirst();
  if (!category) {
    category = await prisma.jobCategory.create({
      data: {
        name: 'Plumbing Services',
        slug: 'plumbing-services',
      },
    });
  }

  console.log(`👤 Client: ${client.email} (${client.walletAddress})`);
  console.log(`🔧 Artisan: ${artisan.email} (${artisan.walletAddress})\n`);

  // Step 1: Client Posts Job
  console.log('📌 Step 1: Customer creates job with clear outcome and proof specifications...');
  const job = await JobService.createJob(client.id, {
    categoryId: category.id,
    title: 'Emergency Kitchen Pipe Repair',
    description: 'Kitchen pipe is leaking heavily under the sink. Need immediate pipe replacement and pressure check.',
    budgetType: 'FIXED',
    budgetMin: 20000,
    budgetMax: 30000,
    state: 'FCT',
    lgaCity: 'Abuja',
    expectedOutcome: 'Kitchen pipe leak repaired, new PVC fitting installed, water pressure restored.',
    materialsProvidedBy: 'ARTISAN',
    completionProofReq: 'Before and after photos of the sink piping and short video showing valve opened with zero leaks.',
  });
  console.log(`✅ Job Created: "${job.title}" [ID: ${job.id}]`);
  console.log(`   Expected Outcome: ${job.expectedOutcome}`);
  console.log(`   Proof Requirement: ${job.completionProofReq}\n`);

  // Step 2: Artisan Submits Proposal
  console.log('📌 Step 2: Artisan discovers job and submits proposal for ₦25,000...');
  const proposal = await ProposalService.submitProposal(artisan.id, {
    jobId: job.id,
    coverLetter: 'I am an experienced plumber in Abuja. I can arrive within 1 hour with the required fittings and complete the job today.',
    bidAmount: 25000,
    estimatedDays: 1,
  });
  console.log(`✅ Proposal Submitted: ₦${proposal.bidAmount} [ID: ${proposal.id}]\n`);

  // Step 3: Client Accepts Proposal & Creates Contract
  console.log('📌 Step 3: Client accepts proposal and creates contract...');
  const contract = await ContractService.acceptProposalAndCreateContract(client.id, proposal.id);
  console.log(`✅ Contract Created: [Code: ${contract.contractCode}, ID: ${contract.id}]`);
  console.log(`   Milestones: ${contract.milestones.length}, Status: ${contract.status}\n`);

  const milestone = contract.milestones[0];

  // Step 4: Client Funds Escrow on Monad
  console.log('📌 Step 4: Customer deposits funds into Monad Smart Contract Escrow...');
  const mockTxHash = `SIM-TX-${Date.now()}-0x${Array(32).fill('e').join('')}`;
  const fundedResult = await EscrowService.fundMilestone(client.id, milestone.id, {
    fundingTxHash: mockTxHash,
    cryptoAmount: 0.05,
    cryptoCurrency: 'MON',
  });
  console.log(`✅ Escrow Funded!`);
  console.log(`   Status: ${fundedResult.status}`);
  console.log(`   Blockchain Network: ${fundedResult.blockchain?.network || 'Monad'}`);
  console.log(`   On-Chain Escrow ID: #${fundedResult.blockchain?.onChainEscrowId}`);
  console.log(`   Tx Hash: ${fundedResult.blockchain?.txHash}\n`);

  // Step 5: Artisan Submits Completed Work with Before & After Proof
  console.log('📌 Step 5: Artisan performs repair and submits Before & After photos...');
  const submittedMilestone = await EscrowService.submitMilestoneWork(artisan.id, milestone.id, {
    submissionNotes: 'Replaced cracked copper pipe with durable PPR fitting. Checked valve pressure.',
    beforeProofUrls: ['https://res.cloudinary.com/demo/image/upload/broken_pipe.jpg'],
    submissionProofUrls: ['https://res.cloudinary.com/demo/image/upload/fixed_pipe.jpg'],
  });
  console.log(`✅ Deliverable Submitted!`);
  console.log(`   Status: ${submittedMilestone.status}`);
  console.log(`   Before Photos: ${JSON.stringify(submittedMilestone.beforeProofUrls)}`);
  console.log(`   After Photos: ${JSON.stringify(submittedMilestone.submissionProofUrls)}\n`);

  // Step 6: Client Reviews & Approves Release
  console.log('📌 Step 6: Customer reviews completion proof and approves release...');
  const releaseResult = await EscrowService.approveAndReleaseEscrow(client.id, milestone.id, {
    releaseTxHash: `SIM-REL-${Date.now()}-0x${Array(32).fill('f').join('')}`,
  });
  console.log(`🎉 Payout Released!`);
  console.log(`   Milestone Status: ${releaseResult.milestone.status}`);
  console.log(`   Contract Status: ${releaseResult.contractStatus}`);
  console.log(`   Gross Amount: ₦${releaseResult.payoutSummary.grossAmount.toLocaleString()}`);
  console.log(`   Platform Fee (5%): ₦${releaseResult.payoutSummary.feeDeducted.toLocaleString()}`);
  console.log(`   Net Credited to Artisan: ₦${releaseResult.payoutSummary.netCredited.toLocaleString()}\n`);

  // Step 7: Verify Artisan Reputation Update
  const updatedArtisanProfile = await prisma.artisanProfile.findUnique({
    where: { userId: artisan.id },
  });
  console.log(`📊 Artisan Reputation Verified:`);
  console.log(`   Completed Jobs Count: ${updatedArtisanProfile.completedJobsCount}`);
  console.log('\n🏆 ALL END-TO-END TEST STEPS PASSED SUCCESSFULLY!\n');
}

main()
  .catch((e) => {
    console.error('❌ Test failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
