import { EscrowService } from '../services/escrow.service.js';
import { ApiResponse } from '../utils/api-response.js';

export class EscrowController {
  static async fundMilestone(req, res, next) {
    try {
      const result = await EscrowService.fundMilestone(req.user.id, req.params.milestoneId, req.body);
      res.status(200).json(new ApiResponse(200, result, 'Milestone funded and locked in escrow'));
    } catch (error) {
      next(error);
    }
  }

  static async submitWork(req, res, next) {
    try {
      const result = await EscrowService.submitMilestoneWork(req.user.id, req.params.milestoneId, req.body);
      res.status(200).json(new ApiResponse(200, result, 'Milestone work submitted for review'));
    } catch (error) {
      next(error);
    }
  }

  static async requestRevision(req, res, next) {
    try {
      const result = await EscrowService.requestMilestoneRevision(req.user.id, req.params.milestoneId, req.body.revisionNotes);
      res.status(200).json(new ApiResponse(200, result, 'Deliverable revision requested'));
    } catch (error) {
      next(error);
    }
  }

  static async approveRelease(req, res, next) {
    try {
      const result = await EscrowService.approveAndReleaseEscrow(req.user.id, req.params.milestoneId, req.body);
      res.status(200).json(new ApiResponse(200, result, 'Milestone approved and escrow payout released'));
    } catch (error) {
      next(error);
    }
  }

  static async refundMilestone(req, res, next) {
    try {
      const result = await EscrowService.refundMilestoneToClient(req.user.id, req.params.milestoneId, req.body.refundReason);
      res.status(200).json(new ApiResponse(200, result, 'Milestone voluntarily refunded to client'));
    } catch (error) {
      next(error);
    }
  }

  static async syncOnChain(req, res, next) {
    try {
      const result = await EscrowService.reconcileOnChainState(req.params.contractId);
      res.status(200).json(new ApiResponse(200, result, 'On-chain state reconciled'));
    } catch (error) {
      next(error);
    }
  }
}

export default EscrowController;
