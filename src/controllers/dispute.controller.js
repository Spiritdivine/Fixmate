import { DisputeService } from '../services/dispute.service.js';
import { ApiResponse } from '../utils/api-response.js';

export class DisputeController {
  static async file(req, res, next) {
    try {
      const result = await DisputeService.fileDispute(req.user.id, req.body);
      res.status(201).json(new ApiResponse(201, result, 'Dispute filed successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async resolve(req, res, next) {
    try {
      const result = await DisputeService.resolveDispute(req.user.id, req.params.id, req.body);
      res.status(200).json(new ApiResponse(200, result, 'Dispute resolved and balances settled'));
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req, res, next) {
    try {
      const result = await DisputeService.cancelDispute(req.user.id, req.params.id);
      res.status(200).json(new ApiResponse(200, result, 'Dispute cancelled/withdrawn'));
    } catch (error) {
      next(error);
    }
  }

  static async getForContract(req, res, next) {
    try {
      const result = await DisputeService.getDisputesForContract(req.user.id, req.params.contractId);
      res.status(200).json(new ApiResponse(200, result, 'Disputes fetched'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Dispute Messaging
   */
  static async getMessages(req, res, next) {
    try {
      const result = await DisputeService.getDisputeMessages(req.user.id, req.params.id);
      res.status(200).json(new ApiResponse(200, result, 'Dispute messages fetched'));
    } catch (error) {
      next(error);
    }
  }

  static async sendMessage(req, res, next) {
    try {
      const result = await DisputeService.sendDisputeMessage(req.user.id, req.params.id, req.body);
      res.status(201).json(new ApiResponse(201, result, 'Dispute message sent'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supplementary Evidence
   */
  static async addEvidence(req, res, next) {
    try {
      const result = await DisputeService.addDisputeEvidence(req.user.id, req.params.id, req.body);
      res.status(201).json(new ApiResponse(201, result, 'Supplementary evidence attached'));
    } catch (error) {
      next(error);
    }
  }

  static async deleteEvidence(req, res, next) {
    try {
      await DisputeService.deleteDisputeEvidence(req.user.id, req.params.evidenceId);
      res.status(200).json(new ApiResponse(200, null, 'Dispute evidence removed'));
    } catch (error) {
      next(error);
    }
  }
}

export default DisputeController;
