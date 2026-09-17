import { PaystackService } from '../services/paystack.service.js';
import { KotaniService } from '../services/kotani.service.js';
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

  static async getExchangeRate(req, res, next) {
    try {
      const from = req.query.from || 'USDC';
      const to = req.query.to || 'NGN';
      const result = await KotaniService.getExchangeRate(from, to);
      res.status(200).json(new ApiResponse(200, result, 'Exchange rate fetched'));
    } catch (error) {
      next(error);
    }
  }

  static async initiateKotaniOffRamp(req, res, next) {
    try {
      const { amountUsdc, bankAccountId, onChainTxHash } = req.body;
      const result = await KotaniService.initiateOffRamp(req.user.id, {
        amountUsdc,
        bankAccountId,
        onChainTxHash,
      });
      res.status(200).json(new ApiResponse(200, result, 'Kotani Pay off-ramp payout initiated'));
    } catch (error) {
      next(error);
    }
  }

  static async initiateKotaniOnRamp(req, res, next) {
    try {
      const { amountNgn, destinationWalletAddress } = req.body;
      const result = await KotaniService.initiateOnRamp(req.user.id, {
        amountNgn,
        destinationWalletAddress,
      });
      res.status(200).json(new ApiResponse(200, result, 'Kotani Pay on-ramp initiated'));
    } catch (error) {
      next(error);
    }
  }

  static async handleKotaniWebhook(req, res, next) {
    try {
      const signature = req.headers['kotani-signature'] || req.headers['x-kotani-signature'];
      const result = await KotaniService.handleWebhook(signature, req.rawBody, req.body);
      res.status(200).json(new ApiResponse(200, result, 'Kotani webhook processed'));
    } catch (error) {
      next(error);
    }
  }
}

export default PaymentController;

