import { ContractService } from '../services/contract.service.js';
import { ApiResponse } from '../utils/api-response.js';

export class ContractController {
  static async acceptProposal(req, res, next) {
    try {
      const result = await ContractService.acceptProposalAndCreateContract(req.user.id, req.params.proposalId);
      res.status(201).json(new ApiResponse(201, result, 'Proposal accepted and contract established'));
    } catch (error) {
      next(error);
    }
  }

  static async getMyContracts(req, res, next) {
    try {
      const result = await ContractService.getContractsForUser(req.user.id, req.user.role);
      res.status(200).json(new ApiResponse(200, result, 'Contracts fetched successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const result = await ContractService.getContractById(req.user.id, req.params.id);
      res.status(200).json(new ApiResponse(200, result, 'Contract details fetched'));
    } catch (error) {
      next(error);
    }
  }

  static async updateMilestone(req, res, next) {
    try {
      const result = await ContractService.updateMilestoneSchedule(req.user.id, req.params.id, req.params.milestoneId, req.body);
      res.status(200).json(new ApiResponse(200, result, 'Milestone schedule updated'));
    } catch (error) {
      next(error);
    }
  }

  static async deleteMilestone(req, res, next) {
    try {
      await ContractService.deleteMilestone(req.user.id, req.params.id, req.params.milestoneId);
      res.status(200).json(new ApiResponse(200, null, 'Milestone deleted from draft contract'));
    } catch (error) {
      next(error);
    }
  }

  static async cancelContract(req, res, next) {
    try {
      const result = await ContractService.cancelContract(req.user.id, req.params.id);
      res.status(200).json(new ApiResponse(200, result, 'Contract cancelled successfully'));
    } catch (error) {
      next(error);
    }
  }
}

export default ContractController;
