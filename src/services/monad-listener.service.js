import { ethers } from 'ethers';
import prisma from '../config/db.js';
import { MonadEscrowService } from './monad-escrow.service.js';
import { getIO } from '../sockets/socket.server.js';

/**
 * Service responsible for listening to real-time events emitted by the
 * ArtisanEscrow smart contract on Monad and synchronizing state to PostgreSQL & WebSockets.
 * Uses robust block-polling (eth_getLogs) compatible with all public EVM and Monad RPCs.
 */
export class MonadListenerService {
  static isListening = false;
  static isPolling = false;
  static contract = null;
  static pollInterval = null;
  static lastCheckedBlock = null;

  /**
   * Starts listening to Monad on-chain contract events via block polling
   */
  static async startListening(intervalMs = 6000) {
    if (this.isListening) {
      return;
    }

    try {
      const contract = MonadEscrowService.getContract();
      this.contract = contract;
      const contractAddress = await contract.getAddress();
      const provider = MonadEscrowService.getProvider();

      // Check if last checked block is stored in database
      const dbSetting = await prisma.systemSetting.findUnique({
        where: { key: 'MONAD_LISTENER_LAST_BLOCK' },
      });

      if (dbSetting && dbSetting.value) {
        this.lastCheckedBlock = parseInt(dbSetting.value, 10);
      } else {
        try {
          const currentBlock = await provider.getBlockNumber();
          this.lastCheckedBlock = Math.max(0, currentBlock - 5);
        } catch {
          this.lastCheckedBlock = 0;
        }
      }

      console.log(`📡 Monad Event Listener active for [${contractAddress}] (Polling from block #${this.lastCheckedBlock})`);
      this.isListening = true;

      // Start periodic polling
      this.pollInterval = setInterval(async () => {
        await this.pollEvents();
      }, intervalMs);

    } catch (error) {
      console.warn(`⚠️ Could not initialize Monad Event Listener: ${error.message}`);
    }
  }

  /**
   * Polls new blocks for events using queryFilter (eth_getLogs)
   */
  static async pollEvents() {
    if (!this.contract || !this.isListening || this.isPolling) return;

    this.isPolling = true;
    try {
      const provider = MonadEscrowService.getProvider();
      const latestBlock = await provider.getBlockNumber();

      if (latestBlock < this.lastCheckedBlock) {
        this.isPolling = false;
        return;
      }

      // Scan new blocks
      const events = await this.contract.queryFilter('*', this.lastCheckedBlock, latestBlock);

      for (const event of events) {
        await this.handleParsedEvent(event);
      }

      this.lastCheckedBlock = latestBlock + 1;

      // Persist latest processed block in PostgreSQL
      await prisma.systemSetting.upsert({
        where: { key: 'MONAD_LISTENER_LAST_BLOCK' },
        update: { value: latestBlock.toString(), updatedAt: new Date() },
        create: {
          key: 'MONAD_LISTENER_LAST_BLOCK',
          value: latestBlock.toString(),
          description: 'Tracks the last verified block height processed by MonadListenerService',
        },
      });
    } catch {
      // RPC network hiccups are caught gracefully without crashing
    } finally {
      this.isPolling = false;
    }
  }

  /**
   * Dispatches and processes an on-chain event log
   */
  static async handleParsedEvent(event) {
    const eventName = event.fragment?.name || event.eventName;
    const args = event.args;
    const txHash = event.transactionHash;

    if (!eventName || !args) return;

    try {
      if (eventName === 'EscrowCreated') {
        const [escrowId, contractCode, client, artisan, amount] = args;
        const escrowIdNum = Number(escrowId);
        const amountMon = ethers.formatEther(amount);

        console.log(`🔔 [Monad Event] EscrowCreated: #${escrowIdNum} (${contractCode}, ${amountMon} MON)`);

        const contractRecord = await prisma.contract.findUnique({
          where: { contractCode },
          include: { milestones: { orderBy: { stepOrder: 'asc' } } },
        });

        if (contractRecord && contractRecord.status === 'PENDING_FUNDING') {
          await prisma.$transaction(async (tx) => {
            await tx.contract.update({
              where: { id: contractRecord.id },
              data: {
                status: 'ACTIVE',
                onChainEscrowId: escrowIdNum,
                fundingTxHash: txHash,
                cryptoAmount: parseFloat(amountMon),
                cryptoCurrency: 'MON',
                startedAt: contractRecord.startedAt || new Date(),
              },
            });

            if (contractRecord.milestones.length > 0) {
              await tx.milestone.update({
                where: { id: contractRecord.milestones[0].id },
                data: { status: 'FUNDED', fundedAt: new Date() },
              });
            }
          });

          this.safeEmitSocket(contractRecord.clientId, 'escrow:funded', {
            contractId: contractRecord.id,
            contractCode,
            onChainEscrowId: escrowIdNum,
            amountMon,
            txHash,
          });
          this.safeEmitSocket(contractRecord.artisanId, 'escrow:funded', {
            contractId: contractRecord.id,
            contractCode,
            onChainEscrowId: escrowIdNum,
            amountMon,
            txHash,
          });
        }
      } else if (eventName === 'WorkSubmitted') {
        const [escrowId, artisan] = args;
        const escrowIdNum = Number(escrowId);

        console.log(`🔔 [Monad Event] WorkSubmitted: #${escrowIdNum} by ${artisan}`);

        const contractRecord = await prisma.contract.findFirst({
          where: { onChainEscrowId: escrowIdNum },
          include: { milestones: true },
        });

        if (contractRecord && contractRecord.milestones.length > 0) {
          const milestone = contractRecord.milestones[0];
          if (milestone.status !== 'SUBMITTED' && milestone.status !== 'RELEASED') {
            await prisma.milestone.update({
              where: { id: milestone.id },
              data: { status: 'SUBMITTED', submittedAt: new Date() },
            });
          }

          this.safeEmitSocket(contractRecord.clientId, 'work:submitted', {
            contractId: contractRecord.id,
            onChainEscrowId: escrowIdNum,
          });
        }
      } else if (eventName === 'EscrowReleased') {
        const [escrowId, artisan, artisanAmount, platformFee] = args;
        const escrowIdNum = Number(escrowId);
        const netMon = ethers.formatEther(artisanAmount);
        const feeMon = ethers.formatEther(platformFee);

        console.log(`🔔 [Monad Event] EscrowReleased: #${escrowIdNum} -> Artisan: ${netMon} MON, Platform Fee: ${feeMon} MON`);

        const contractRecord = await prisma.contract.findFirst({
          where: { onChainEscrowId: escrowIdNum },
          include: { milestones: true },
        });

        if (contractRecord && contractRecord.status !== 'COMPLETED') {
          await prisma.$transaction(async (tx) => {
            await tx.contract.update({
              where: { id: contractRecord.id },
              data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                releaseTxHash: txHash,
              },
            });

            if (contractRecord.milestones.length > 0) {
              await tx.milestone.update({
                where: { id: contractRecord.milestones[0].id },
                data: {
                  status: 'RELEASED',
                  approvedAt: new Date(),
                  releasedAt: new Date(),
                },
              });
            }

            await tx.job.update({
              where: { id: contractRecord.jobId },
              data: { status: 'COMPLETED' },
            });

            await tx.artisanProfile.update({
              where: { userId: contractRecord.artisanId },
              data: { completedJobsCount: { increment: 1 } },
            });
          });

          this.safeEmitSocket(contractRecord.clientId, 'escrow:released', {
            contractId: contractRecord.id,
            onChainEscrowId: escrowIdNum,
            netMon,
            txHash,
          });
          this.safeEmitSocket(contractRecord.artisanId, 'escrow:released', {
            contractId: contractRecord.id,
            onChainEscrowId: escrowIdNum,
            netMon,
            txHash,
          });
        }
      } else if (eventName === 'DisputeRaised') {
        const [escrowId, raisedBy, reason] = args;
        const escrowIdNum = Number(escrowId);

        console.log(`🔔 [Monad Event] DisputeRaised: #${escrowIdNum} (Reason: ${reason})`);

        const contractRecord = await prisma.contract.findFirst({
          where: { onChainEscrowId: escrowIdNum },
        });

        if (contractRecord && contractRecord.status !== 'DISPUTED') {
          await prisma.contract.update({
            where: { id: contractRecord.id },
            data: { status: 'DISPUTED' },
          });
        }
      }
    } catch (err) {
      console.error(`❌ Error processing event ${eventName}:`, err.message);
    }
  }

  /**
   * Helper to safely emit Socket.IO events to user rooms if Socket.IO is initialized
   */
  static safeEmitSocket(userId, eventName, payload) {
    try {
      const io = getIO();
      if (io && userId) {
        io.to(`user:${userId}`).emit(eventName, payload);
      }
    } catch {
      // Sockets may not be active in CLI/testing environments
    }
  }

  /**
   * Stops listening to events and clears the polling interval
   */
  static stopListening() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isListening = false;
    console.log('🛑 Monad Blockchain Event Listener stopped.');
  }
}

export default MonadListenerService;
