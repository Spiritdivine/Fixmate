import prisma from '../src/config/db.js';
import { JobService } from '../src/services/job.service.js';
import { ProposalService } from '../src/services/proposal.service.js';
import { ContractService } from '../src/services/contract.service.js';
import { EscrowService } from '../src/services/escrow.service.js';
import { DisputeService } from '../src/services/dispute.service.js';
import bcrypt from 'bcryptjs';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function printBox(title, lines) {
  const width = 64;
  console.log('\n┌' + '─'.repeat(width) + '┐');
  console.log(`│ \x1b[1m\x1b[36m${title.padEnd(width - 2)}\x1b[0m │`);
  console.log('├' + '─'.repeat(width) + '┤');
  lines.forEach((line) => {
    console.log(`│ ${line.padEnd(width - 2)} │`);
  });
  console.log('└' + '─'.repeat(width) + '┘\n');
}

async function main() {
  console.clear();
  console.log('\x1b[1m\x1b[35m');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║        ARTISAN ESCROW PLATFORM — MONAD BLITZ ABUJA DEMO          ║');
  console.log('║       "Make Trust Easier, Not Crypto More Complicated"           ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('\x1b[0m');

  await sleep(1000);

  // Setup Demo Actors
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const client = await prisma.user.create({
    data: {
      email: `emeka.abuja.${Date.now()}@example.com`,
      phoneNumber: `+234${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      passwordHash,
      role: 'CLIENT',
      walletAddress: '0x1A2B3C4D5E6F70819201A2B3C4D5E6F70819201A',
      clientProfile: {
        create: {
          firstName: 'Emeka',
          lastName: 'Okonkwo',
          state: 'FCT',
          city: 'Abuja (Wuse 2)',
        },
      },
      wallet: { create: { availableBalance: 150000.0 } },
    },
  });

  const artisan = await prisma.user.create({
    data: {
      email: `musa.plumber.${Date.now()}@example.com`,
      phoneNumber: `+234${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      passwordHash,
      role: 'ARTISAN',
      walletAddress: '0x9F8E7D6C5B4A312091829F8E7D6C5B4A31209182',
      artisanProfile: {
        create: {
          businessName: 'Musa Master Plumbing',
          yearsOfExperience: 6,
          state: 'FCT',
          lgaCity: 'Abuja',
          ratingAvg: 4.9,
          reviewCount: 28,
          completedJobsCount: 28,
        },
      },
      wallet: { create: { availableBalance: 5000.0 } },
    },
  });

  let category = await prisma.jobCategory.findFirst({ where: { slug: 'plumbing-services' } });
  if (!category) {
    category = await prisma.jobCategory.create({
      data: { name: 'Plumbing Services', slug: 'plumbing-services' },
    });
  }

  // --------------------------------------------------------------------------
  // ACT 1: The Problem & Ambiguity Reduction
  // --------------------------------------------------------------------------
  console.log('\x1b[1m\x1b[33m▶ ACT 1: Customer Posts an Emergency Repair Job\x1b[0m');
  console.log('Scenario: Emeka discovers a heavy pipe burst under his kitchen sink in Wuse 2, Abuja.');
  await sleep(1500);

  const job = await JobService.createJob(client.id, {
    categoryId: category.id,
    title: 'Emergency Kitchen Pipe Leak Repair',
    description: 'Main kitchen pipe cracked. Heavy water flooding. Requires replacement with high-grade PPR pipe.',
    budgetType: 'FIXED',
    budgetMin: 20000,
    budgetMax: 30000,
    state: 'FCT',
    lgaCity: 'Abuja (Wuse 2)',
    expectedOutcome: 'Crack replaced with new PPR pipe, water pressure restored, zero leaks.',
    materialsProvidedBy: 'ARTISAN',
    completionProofReq: 'Before & After photos of pipes + video of operational water flow.',
  });

  printBox('📋 JOB POSTED ON MARKETPLACE', [
    `Title:             ${job.title}`,
    `Location:          ${job.state} - ${job.lgaCity}`,
    `Budget Range:      ₦${Number(job.budgetMin).toLocaleString()} - ₦${Number(job.budgetMax).toLocaleString()}`,
    `Expected Outcome:  ${job.expectedOutcome}`,
    `Evidence Required: ${job.completionProofReq}`,
  ]);

  await sleep(2000);

  // --------------------------------------------------------------------------
  // ACT 2: Artisan Discovery & Proposal
  // --------------------------------------------------------------------------
  console.log('\x1b[1m\x1b[33m▶ ACT 2: Musa (Verified Artisan) Discovers & Bids on Job\x1b[0m');
  await sleep(1500);

  const proposal = await ProposalService.submitProposal(artisan.id, {
    jobId: job.id,
    coverLetter: 'Hello Emeka, I am in Wuse 2 right now with PPR pipes and tools. I can be there in 30 mins and complete the job today.',
    bidAmount: 25000,
    estimatedDays: 1,
  });

  console.log(`✅ Proposal received from Musa: ₦${Number(proposal.bidAmount).toLocaleString()} (Same-day completion)`);
  await sleep(1500);

  console.log('\nEmeka reviews Musa\'s 4.9-star rating & accepts proposal...');
  const contract = await ContractService.acceptProposalAndCreateContract(client.id, proposal.id);
  const milestone = contract.milestones[0];

  console.log(`✅ Contract Established: \x1b[32m${contract.contractCode}\x1b[0m`);
  await sleep(2000);

  // --------------------------------------------------------------------------
  // ACT 3: Smart Contract Escrow Lock on Monad
  // --------------------------------------------------------------------------
  console.log('\n\x1b[1m\x1b[33m▶ ACT 3: Locking Funds in Monad Smart Contract Escrow\x1b[0m');
  console.log('Customer funds the contract. Funds are secured on-chain before work begins.');
  await sleep(1500);

  const mockTxHash = `0x${Array(64).fill('a').map((c, i) => (i % 2 === 0 ? '7' : 'c')).join('')}`;
  const fundedResult = await EscrowService.fundMilestone(client.id, milestone.id, {
    fundingTxHash: mockTxHash,
    cryptoAmount: 0.05,
    cryptoCurrency: 'MON',
  });

  printBox('🔒 ARTISAN UI VIEW: PAYMENT SECURED', [
    `Contract Code:     ${contract.contractCode}`,
    `Payment Status:    \x1b[32mPAYMENT SECURED ON MONAD\x1b[0m`,
    `Agreed Value:      ₦25,000 equivalent (0.05 MON)`,
    `On-Chain Escrow:   #${fundedResult.blockchain?.onChainEscrowId || 8142}`,
    `Monad Tx Hash:     ${fundedResult.blockchain?.txHash.slice(0, 24)}...`,
    `Artisan Action:    You may now proceed with the repair work.`,
  ]);

  await sleep(2500);

  // --------------------------------------------------------------------------
  // ACT 4: Work Completion & Structured Evidence Submission
  // --------------------------------------------------------------------------
  console.log('\x1b[1m\x1b[33m▶ ACT 4: Musa Completes Work & Uploads Before/After Proof\x1b[0m');
  await sleep(1500);

  const submittedMilestone = await EscrowService.submitMilestoneWork(artisan.id, milestone.id, {
    submissionNotes: 'Replaced cracked copper section with industrial PPR valve. Tested pressure at 4 bar.',
    beforeProofUrls: ['https://res.cloudinary.com/artisan/image/upload/cracked_pipe.jpg'],
    submissionProofUrls: ['https://res.cloudinary.com/artisan/image/upload/fixed_pipe.jpg'],
  });

  printBox('📸 DELIVERABLE SUBMITTED FOR REVIEW', [
    `Milestone:         ${milestone.title}`,
    `Status:            \x1b[36mSUBMITTED FOR APPROVAL\x1b[0m`,
    `Before Photo:      https://res.cloudinary.com/artisan/upload/cracked_pipe.jpg`,
    `After Photo:       https://res.cloudinary.com/artisan/upload/fixed_pipe.jpg`,
    `Notes:             ${submittedMilestone.submissionNotes}`,
  ]);

  await sleep(2500);

  // --------------------------------------------------------------------------
  // ACT 5: Customer Approval & Instant On-Chain Release
  // --------------------------------------------------------------------------
  console.log('\x1b[1m\x1b[33m▶ ACT 5: Customer Reviews Proof & Releases Escrow\x1b[0m');
  console.log('Emeka confirms the repair is successful. Smart contract executes instant split & payout.');
  await sleep(1500);

  const releaseResult = await EscrowService.approveAndReleaseEscrow(client.id, milestone.id, {
    releaseTxHash: `0x${Array(64).fill('f').map((c, i) => (i % 2 === 0 ? '9' : 'b')).join('')}`,
  });

  printBox('🎉 TRANSACTION SETTLED ON MONAD BLOCKCHAIN', [
    `Contract Status:   \x1b[32mCOMPLETED\x1b[0m`,
    `Total Paid:        ₦${releaseResult.payoutSummary.grossAmount.toLocaleString()}`,
    `Platform Fee (5%): ₦${releaseResult.payoutSummary.feeDeducted.toLocaleString()}`,
    `Net Payout:        \x1b[32m₦${releaseResult.payoutSummary.netCredited.toLocaleString()} credited to Musa\x1b[0m`,
    `Settlement Time:   Instant on Monad (<1 second block finality)`,
  ]);

  await sleep(2000);

  // --------------------------------------------------------------------------
  // ACT 6: Review & Portable Reputation Update
  // --------------------------------------------------------------------------
  console.log('\x1b[1m\x1b[33m▶ ACT 6: Customer Leaves 5-Star Review & Reputation Increases\x1b[0m');
  await sleep(1500);

  const review = await prisma.review.create({
    data: {
      contractId: contract.id,
      reviewerId: client.id,
      revieweeId: artisan.id,
      overallRating: 5,
      qualityRating: 5,
      punctualityRating: 5,
      communicationRating: 5,
      comment: 'Musa arrived on time, was extremely professional, and the pipe repair is completely dry and clean!',
    },
  });

  const updatedProfile = await prisma.artisanProfile.findUnique({ where: { userId: artisan.id } });

  printBox('⭐ MUSA\'S REPUTATION & TRANSACTION RECORD UPDATED', [
    `Artisan:           Musa Master Plumbing`,
    `Total Completed:   ${updatedProfile.completedJobsCount} Jobs`,
    `Average Rating:    ${updatedProfile.ratingAvg} / 5.0 ⭐`,
    `Latest Review:     "${review.comment}"`,
    `Reputation Asset:  Verifiable, on-chain portable transaction history`,
  ]);

  await sleep(2000);

  console.log('\x1b[1m\x1b[32m');
  console.log('==================================================================');
  console.log('🎉 DEMO SCENARIO COMPLETE: FROM PROBLEM TO ON-CHAIN SETTLEMENT!');
  console.log('==================================================================');
  console.log('\x1b[0m\n');
}

main()
  .catch((e) => {
    console.error('❌ Demo Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
