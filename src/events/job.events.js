import { getIO } from '../sockets/socket.server.js';

/**
 * JobEventDispatcher:
 * Centralized domain event bus for real-time Job, Proposal, Invitation,
 * and Escrow Contract lifecycles.
 */
export class JobEventDispatcher {
  static emitToUser(userId, event, payload) {
    if (!userId) return;
    try {
      const io = getIO();
      io.to(`user:${userId}`).emit(event, {
        ...payload,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Socket server may not be initialized in test or non-socket contexts
    }
  }

  static onProposalSubmitted(clientId, proposal, job) {
    this.emitToUser(clientId, 'job:proposal_received', {
      jobId: job.id,
      jobTitle: job.title,
      proposalId: proposal.id,
      artisanId: proposal.artisanId,
      bidAmount: Number(proposal.bidAmount || proposal.amount || 0),
      durationDays: proposal.estimatedDays || proposal.durationDays || 1,
    });
  }

  static onProposalStatusChanged(artisanId, proposalId, jobId, status) {
    this.emitToUser(artisanId, 'job:proposal_status_changed', {
      jobId,
      proposalId,
      status,
    });
  }

  static onInvitationSent(artisanId, invitation, job) {
    this.emitToUser(artisanId, 'job:invitation_received', {
      invitationId: invitation.id,
      jobId: job.id,
      jobTitle: job.title,
      clientName:
        job.client?.clientProfile?.firstName ||
        job.client?.clientProfile?.companyName ||
        'Verified Client',
      budget: Number(job.budgetMax || job.budgetMin || 0),
    });
  }

  static onInvitationResponded(clientId, invitation, status) {
    this.emitToUser(clientId, 'job:invitation_responded', {
      invitationId: invitation.id,
      jobId: invitation.jobId,
      status,
    });
  }

  static onContractCreated(clientId, artisanId, contract, job) {
    const payload = {
      contractId: contract.id,
      contractCode: contract.contractCode,
      jobId: job.id,
      jobTitle: job.title,
      totalAmount: Number(contract.totalAmount),
      status: contract.status,
    };
    this.emitToUser(clientId, 'job:contract_created', payload);
    this.emitToUser(artisanId, 'job:contract_created', payload);
  }

  static onJobCancelled(jobId, jobTitle, affectedArtisanIds = []) {
    affectedArtisanIds.forEach((artisanId) => {
      this.emitToUser(artisanId, 'job:cancelled', {
        jobId,
        jobTitle,
        message: `The job "${jobTitle}" was cancelled by the client.`,
      });
    });

    try {
      const io = getIO();
      io.emit('marketplace:job_removed', { jobId });
    } catch {
      // Non-socket context fallback
    }
  }

  static onJobUpdated(jobId, jobTitle, affectedArtisanIds = []) {
    affectedArtisanIds.forEach((artisanId) => {
      this.emitToUser(artisanId, 'job:updated', {
        jobId,
        jobTitle,
        message: `The details or budget for job "${jobTitle}" have been updated by the client.`,
      });
    });
  }
}
