import { PaystackService } from '../services/paystack.service.js';
import { ApiResponse } from '../utils/api-response.js';

export class PaymentController {
  static async initializeDeposit(req, res, next) {
    try {
      const result = await PaystackService.initializeDeposit(req.user.id, req.body.amount);
      res.status(200).json(new ApiResponse(200, result, 'Deposit session initialized'));
    } catch (error) {
      next(error);
    }
  }

  static async verifyDeposit(req, res, next) {
    try {
      const result = await PaystackService.verifyDeposit(req.user.id, req.params.reference);
      res.status(200).json(new ApiResponse(200, result, 'Deposit verified and wallet credited'));
    } catch (error) {
      next(error);
    }
  }

  static async handleWebhook(req, res, next) {
    try {
      const signature = req.headers['x-paystack-signature'];
      const result = await PaystackService.handleWebhook(signature, req.rawBody, req.body);
      res.status(200).json(new ApiResponse(200, result, 'Webhook processed'));
    } catch (error) {
      next(error);
    }
  }
}

export default PaymentController;

