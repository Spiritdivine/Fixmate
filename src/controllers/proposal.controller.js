import { ProposalService } from '../services/proposal.service.js';
import { ApiResponse } from '../utils/api-response.js';

export class ProposalController {
  static async submit(req, res, next) {
    try {
      const result = await ProposalService.submitProposal(req.user.id, req.body);
      res.status(201).json(new ApiResponse(201, result, 'Proposal submitted successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const result = await ProposalService.updateProposal(req.user.id, req.params.id, req.body);
      res.status(200).json(new ApiResponse(200, result, 'Proposal updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const result = await ProposalService.updateProposalStatus(req.user.id, req.params.id, req.body.status);
      res.status(200).json(new ApiResponse(200, result, 'Proposal status updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async withdraw(req, res, next) {
    try {
      const result = await ProposalService.withdrawProposal(req.user.id, req.params.id);
      res.status(200).json(new ApiResponse(200, result, 'Proposal withdrawn successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const result = await ProposalService.getProposalById(req.user.id, req.params.id);
      res.status(200).json(new ApiResponse(200, result, 'Proposal details fetched'));
    } catch (error) {
      next(error);
    }
  }

  static async getJobProposals(req, res, next) {
    try {
      const result = await ProposalService.getJobProposals(req.user.id, req.params.jobId);
      res.status(200).json(new ApiResponse(200, result, 'Proposals fetched'));
    } catch (error) {
      next(error);
    }
  }

  static async getMyProposals(req, res, next) {
    try {
      const result = await ProposalService.getArtisanProposals(req.user.id);
      res.status(200).json(new ApiResponse(200, result, 'Artisan proposals fetched'));
    } catch (error) {
      next(error);
    }
  }
}

export default ProposalController;
