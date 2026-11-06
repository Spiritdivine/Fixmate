import { PeerService } from '../services/peer.service.js';
import { ApiResponse } from '../utils/api-response.js';

export class PeerController {
  static async getPeerDirectory(req, res, next) {
    try {
      const result = await PeerService.getPeerDirectory(req.user.id, req.query);
      res.status(200).json(new ApiResponse(200, result, 'Peer directory fetched successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async createSubcontract(req, res, next) {
    try {
      const result = await PeerService.createSubcontract(req.user.id, req.body);
      res.status(201).json(new ApiResponse(201, result, 'Subcontract proposal created successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getMySubcontracts(req, res, next) {
    try {
      const result = await PeerService.getMySubcontracts(req.user.id);
      res.status(200).json(new ApiResponse(200, result, 'Subcontracts retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async updateSubcontractStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, completionNotes } = req.body;
      const result = await PeerService.updateSubcontractStatus(req.user.id, id, status, completionNotes);
      res.status(200).json(new ApiResponse(200, result, 'Subcontract status updated'));
    } catch (error) {
      next(error);
    }
  }
}
