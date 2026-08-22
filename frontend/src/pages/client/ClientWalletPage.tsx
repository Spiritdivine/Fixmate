import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wallet as WalletIcon,
  CreditCard,
  PlusCircle,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  Sparkles,
  Receipt,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { Wallet, Transaction, SavedPaymentMethod, ApiResponse } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

export const ClientWalletPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('50000');
  const [depositMethod, setDepositMethod] = useState<'PAYSTACK' | 'SIMULATE'>('PAYSTACK');
  const [selectedTxType, setSelectedTxType] = useState('ALL');
  const [searchRef, setSearchRef] = useState('');
  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Fetch Client's Wallet
  const { data: wallet, isLoading: loadingWallet } = useQuery<Wallet>({
    queryKey: ['client-wallet-page'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Wallet | { wallet: Wallet }>>('/wallets/my-wallet');
      return (data.data as any)?.availableBalance !== undefined ? (data.data as Wallet) : (data.data as any)?.wallet;
    },
  });

  // 2. Fetch Saved Cards
  const { data: savedCards = [] } = useQuery<SavedPaymentMethod[]>({
    queryKey: ['client-saved-cards'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<SavedPaymentMethod[] | { savedCards: SavedPaymentMethod[] }>>('/wallets/saved-cards');
      return (Array.isArray(data.data) ? data.data : (data.data as any)?.savedCards) || [];
    },
  });

  // 3. Deposit Funds Mutation
  const depositMutation = useMutation({
    mutationFn: async () => {
      setErrorMessage('');
      const amountNum = Number(depositAmount);
      if (!amountNum || amountNum < 500) {
        throw new Error('Minimum deposit amount is ₦500.');
      }

      if (depositMethod === 'SIMULATE') {
        await apiClient.post('/wallets/simulate-deposit', { amount: amountNum });
      } else {
        const { data } = await apiClient.post<ApiResponse<{ authorizationUrl: string; reference: string }>>(
          '/payments/initialize',
          { amount: amountNum }
        );
        if (data.data.authorizationUrl) {
          window.location.href = data.data.authorizationUrl;
          return;
        }
      }
    },
    onSuccess: () => {
      if (depositMethod === 'SIMULATE') {
        setDepositModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ['client-wallet-page'] });
        alert('Test deposit credited successfully!');
      }
    },
    onError: (err) => {
      setErrorMessage(getErrorMessage(err));
    },
  });

  // 4. Set Default Card Mutation
  const setDefaultCardMutation = useMutation({
    mutationFn: async (cardId: string) => {
      await apiClient.patch(`/wallets/saved-cards/${cardId}/default`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-saved-cards'] });
    },
  });

  // 5. Delete Saved Card Mutation
  const deleteCardMutation = useMutation({
    mutationFn: async (cardId: string) => {
      await apiClient.delete(`/wallets/saved-cards/${cardId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-saved-cards'] });
    },
  });

  const availableBalance = Number(wallet?.availableBalance || 0);
  const escrowLocked = Number(wallet?.escrowLockedBalance || 0);
  const totalBalance = availableBalance + escrowLocked;

  const rawTxs = wallet?.transactions || [];
  const filteredTxs = rawTxs.filter((tx) => {
    if (selectedTxType !== 'ALL' && tx.type !== selectedTxType) return false;
    if (searchRef && !tx.reference.toLowerCase().includes(searchRef.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Wallet &amp; Payments Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Deposit funds, review escrow locks and releases, and manage saved debit/credit cards.
          </p>
        </div>

        <button
          onClick={() => setDepositModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/20 transition-all active:scale-95 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Deposit Funds</span>
        </button>
      </div>

      {/* Financial Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Available Balance */}
        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Available Balance</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <WalletIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(availableBalance)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Ready for milestone funding or withdrawals
            </p>
          </div>
        </Card>

        {/* Escrow Locked */}
        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Escrow Locked Funds</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              {formatCurrency(escrowLocked)}
            </div>
            <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 font-medium mt-1">
              Secured in active milestone contracts
            </p>
          </div>
        </Card>

        {/* Total Portfolio Value */}
        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Portfolio Value</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {formatCurrency(totalBalance)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Available + Escrow Locked
            </p>
          </div>
        </Card>
      </div>

      {/* Saved Payment Methods Section */}
      <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-sky-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Saved Payment Cards
            </h2>
          </div>
          <button
            onClick={() => setDepositModalOpen(true)}
            className="text-xs font-semibold text-sky-600 hover:text-sky-500"
          >
            + Add New Card
          </button>
        </div>

        {(!savedCards || savedCards.length === 0) ? (
          <p className="text-xs text-slate-500 py-3">
            No saved cards yet. Make a deposit via Paystack to securely tokenize and save your card for 1-click milestone funding.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {savedCards.map((card) => (
              <div
                key={card.id}
                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                  card.isDefault
                    ? 'border-sky-500 bg-sky-50/40 dark:bg-sky-950/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase">
                      {card.cardBrand} •••• {card.last4}
                    </span>
                    {card.isDefault && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-sky-600 text-white">
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Expires {card.expMonth}/{card.expYear}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {!card.isDefault && (
                    <button
                      onClick={() => setDefaultCardMutation.mutate(card.id)}
                      disabled={setDefaultCardMutation.isPending}
                      className="text-[10px] text-sky-600 hover:underline font-bold mr-2"
                    >
                      Make Default
                    </button>
                  )}
                  <button
                    onClick={() => deleteCardMutation.mutate(card.id)}
                    disabled={deleteCardMutation.isPending}
                    className="text-slate-400 hover:text-rose-600 p-1"
                    title="Delete card"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Transaction Ledger */}
      <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-sky-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Transaction History
            </h2>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {['ALL', 'WALLET_DEPOSIT', 'ESCROW_LOCK', 'ESCROW_RELEASE', 'ESCROW_REFUND'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedTxType(type)}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  selectedTxType === type
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchRef}
            onChange={(e) => setSearchRef(e.target.value)}
            placeholder="Search by reference code..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Ledger Table */}
        {loadingWallet ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading ledger...</div>
        ) : filteredTxs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">No transactions found.</div>
        ) : (
          <div className="space-y-2">
            {filteredTxs.map((tx) => {
              const isCredit = tx.type === 'WALLET_DEPOSIT' || tx.type === 'ESCROW_REFUND' || tx.type === 'BONUS';
              return (
                <div
                  key={tx.id}
                  onClick={() => setReceiptTx(tx)}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/40 cursor-pointer flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        isCredit
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-sky-500/10 text-sky-600'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-900 dark:text-slate-100">
                        {tx.description}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {tx.reference} • {formatDate(tx.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-black text-sm ${
                        isCredit
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                    <p className="text-[10px] text-slate-400 font-semibold">{tx.status}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* DEPOSIT FUNDS MODAL */}
      {depositModalOpen && (
        <Modal
          isOpen={depositModalOpen}
          onClose={() => setDepositModalOpen(false)}
          title="Deposit Funds to Fixmate Wallet"
        >
          <div className="space-y-5 text-xs">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300">
                {errorMessage}
              </div>
            )}

            <div className="space-y-2">
              <label className="font-bold text-slate-700 dark:text-slate-300">Deposit Amount (NGN)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">₦</span>
                <input
                  type="number"
                  min="500"
                  step="1000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Quick amount chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {['10000', '25000', '50000', '100000', '250000'].map((amt) => (
                  <button
                    type="button"
                    key={amt}
                    onClick={() => setDepositAmount(amt)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-[11px] font-semibold text-slate-700 dark:text-slate-300"
                  >
                    +{formatCurrency(amt)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-bold text-slate-700 dark:text-slate-300">Deposit Channel</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDepositMethod('PAYSTACK')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    depositMethod === 'PAYSTACK'
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 ring-1 ring-sky-500 text-sky-950 dark:text-sky-100'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <p className="font-bold text-xs">Paystack Gateway</p>
                  <p className="text-[10px] text-slate-500">Card, Bank Transfer, USSD</p>
                </button>

                <button
                  type="button"
                  onClick={() => setDepositMethod('SIMULATE')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    depositMethod === 'SIMULATE'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 ring-1 ring-purple-500 text-purple-950 dark:text-purple-100'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <p className="font-bold text-xs">Sandbox / Instant Test</p>
                  <p className="text-[10px] text-slate-500">Simulate immediate credit</p>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setDepositModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={depositMutation.isPending}
                onClick={() => depositMutation.mutate()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                {depositMutation.isPending ? 'Processing...' : `Deposit ${formatCurrency(depositAmount || 0)}`}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* RECEIPT DETAIL MODAL */}
      {receiptTx && (
        <Modal
          isOpen={!!receiptTx}
          onClose={() => setReceiptTx(null)}
          title="Transaction Receipt"
        >
          <div className="space-y-4 text-xs">
            <div className="text-center py-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400">Total Amount</span>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {formatCurrency(receiptTx.amount)}
              </p>
              <Badge variant={receiptTx.status === 'SUCCESS' ? 'emerald' : 'amber'}>
                {receiptTx.status}
              </Badge>
            </div>

            <div className="space-y-2 text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Description:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{receiptTx.description}</span>
              </div>
              <div className="flex justify-between">
                <span>Reference:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{receiptTx.reference}</span>
              </div>
              <div className="flex justify-between">
                <span>Type:</span>
                <span>{receiptTx.type}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{formatDate(receiptTx.createdAt)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setReceiptTx(null)} className="w-full">
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
