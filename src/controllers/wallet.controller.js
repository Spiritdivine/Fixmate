import { WalletService } from '../services/wallet.service.js';
import { ApiResponse } from '../utils/api-response.js';

export class WalletController {
  static async getMyWallet(req, res, next) {
    try {
      const result = await WalletService.getWallet(req.user.id);
      res.status(200).json(new ApiResponse(200, result, 'Wallet overview fetched'));
    } catch (error) {
      next(error);
    }
  }

  static async simulateDeposit(req, res, next) {
    try {
      const { amount } = req.body;
      const result = await WalletService.simulateDeposit(req.user.id, Number(amount));
      res.status(200).json(new ApiResponse(200, result, 'Funds deposited to test wallet'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bank Accounts
   */
  static async addBank(req, res, next) {
    try {
      const result = await WalletService.addBankAccount(req.user.id, req.body);
      res.status(201).json(new ApiResponse(201, result, 'Bank account linked successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getBanks(req, res, next) {
    try {
      const result = await WalletService.getBankAccounts(req.user.id);
      res.status(200).json(new ApiResponse(200, result, 'Bank accounts list'));
    } catch (error) {
      next(error);
    }
  }

  static async deleteBank(req, res, next) {
    try {
      await WalletService.deleteBankAccount(req.user.id, req.params.id);
      res.status(200).json(new ApiResponse(200, null, 'Bank account removed'));
    } catch (error) {
      next(error);
    }
  }

  static async setDefaultBank(req, res, next) {
    try {
      const result = await WalletService.setDefaultBankAccount(req.user.id, req.params.id);
      res.status(200).json(new ApiResponse(200, result, 'Default bank account updated'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Withdrawals
   */
  static async requestWithdrawal(req, res, next) {
    try {
      const result = await WalletService.requestPayout(req.user.id, req.body);
      res.status(201).json(new ApiResponse(201, result, 'Withdrawal request created'));
    } catch (error) {
      next(error);
    }
  }

  static async cancelWithdrawal(req, res, next) {
    try {
      const result = await WalletService.cancelPayoutRequest(req.user.id, req.params.id);
      res.status(200).json(new ApiResponse(200, result, 'Withdrawal request cancelled'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Saved Cards / Payment Methods
   */
  static async getCards(req, res, next) {
    try {
      const result = await WalletService.getSavedPaymentMethods(req.user.id);
      res.status(200).json(new ApiResponse(200, result, 'Saved payment methods fetched'));
    } catch (error) {
      next(error);
    }
  }

  static async setDefaultCard(req, res, next) {
    try {
      const result = await WalletService.setDefaultPaymentMethod(req.user.id, req.params.id);
      res.status(200).json(new ApiResponse(200, result, 'Default payment card updated'));
    } catch (error) {
      next(error);
    }
  }

  static async deleteCard(req, res, next) {
    try {
      await WalletService.deletePaymentMethod(req.user.id, req.params.id);
      res.status(200).json(new ApiResponse(200, null, 'Payment card removed'));
    } catch (error) {
      next(error);
    }
  }
}

export default WalletController;
