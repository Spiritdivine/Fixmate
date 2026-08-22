import { Router } from 'express';
import { WalletController } from '../controllers/wallet.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  simulateDepositSchema,
  addBankAccountSchema,
  requestWithdrawalSchema,
  bankAccountParamSchema,
  cardParamSchema,
  payoutParamSchema,
} from '../validators/wallet.validator.js';

const router = Router();

// Wallet & Test Deposit
router.get('/my-wallet', authenticate, WalletController.getMyWallet);
router.post('/simulate-deposit', authenticate, validate(simulateDepositSchema), WalletController.simulateDeposit);

// Bank Accounts
router.post('/bank-accounts', authenticate, validate(addBankAccountSchema), WalletController.addBank);
router.get('/bank-accounts', authenticate, WalletController.getBanks);
router.delete('/bank-accounts/:id', authenticate, validate(bankAccountParamSchema), WalletController.deleteBank);
router.patch('/bank-accounts/:id/default', authenticate, validate(bankAccountParamSchema), WalletController.setDefaultBank);

// Withdrawals
router.post('/withdraw', authenticate, validate(requestWithdrawalSchema), WalletController.requestWithdrawal);
router.delete('/withdrawals/:id', authenticate, validate(payoutParamSchema), WalletController.cancelWithdrawal);
router.patch('/withdrawals/:id/cancel', authenticate, validate(payoutParamSchema), WalletController.cancelWithdrawal);

// Saved Cards
router.get('/saved-cards', authenticate, WalletController.getCards);
router.patch('/saved-cards/:id/default', authenticate, validate(cardParamSchema), WalletController.setDefaultCard);
router.delete('/saved-cards/:id', authenticate, validate(cardParamSchema), WalletController.deleteCard);

export default router;
