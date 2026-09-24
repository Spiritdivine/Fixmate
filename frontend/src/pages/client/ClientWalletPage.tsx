import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
  Trash2,
  
  Receipt,
  Copy,
  ExternalLink,
  Coins,
  Zap,
  Download,
  Unlink,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { Wallet, Transaction, SavedPaymentMethod, ApiResponse } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useUnifiedWallet } from '../../lib/privy-provider';
import { getUsdcBalance, mintTestUsdc, MONAD_EXPLORER_URL } from '../../lib/monad-web3';
import { trackEvent } from '../../lib/posthog';

export const ClientWalletPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { address, isConnected, isEmbedded, connect, unlinkWallet } = useUnifiedWallet();

  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('50000');
  const [depositMethod, setDepositMethod] = useState<'PAYSTACK' | 'SIMULATE'>('PAYSTACK');
  const [selectedTxType, setSelectedTxType] = useState('ALL');
  const [searchRef, setSearchRef] = useState('');
  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Unlink Wallet State
  const [isUnlinkModalOpen, setIsUnlinkModalOpen] = useState(false);
  const [isUnlinkingWallet, setIsUnlinkingWallet] = useState(false);
  const [unlinkError, setUnlinkError] = useState<string | null>(null);
  const [unlinkSuccess, setUnlinkSuccess] = useState<string | null>(null);

  // Kotani On-Ramp
  const [onRampModalOpen, setOnRampModalOpen] = useState(false);
  const [onRampAmountNgn, setOnRampAmountNgn] = useState('20000');
  const [isOnRamping, setIsOnRamping] = useState(false);

  // Web3 & Rates
  const [usdcBalance, setUsdcBalance] = useState<string>('0.00');
  const [exchangeRate, setExchangeRate] = useState<number>(1465.0);
  const [isMintingUsdc, setIsMintingUsdc] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleUnlinkWallet = async () => {
    try {
      setIsUnlinkingWallet(true);
      setUnlinkError(null);
      await unlinkWallet();
      setUsdcBalance('0.00');
      setUnlinkSuccess('Wallet address unlinked successfully.');
      setTimeout(() => {
        setIsUnlinkModalOpen(false);
        setUnlinkSuccess(null);
      }, 1200);
    } catch (err: any) {
      setUnlinkError(getErrorMessage(err));
    } finally {
      setIsUnlinkingWallet(false);
    }
  };

  // 1. Fetch Client's Wallet
  const { data: wallet, isLoading: loadingWallet } = useQuery<Wallet>({
    queryKey: ['client-wallet-page'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Wallet | { wallet: Wallet }>>('/wallets/my-wallet');
      return (data.data as any)?.availableBalance !== undefined ? (data.data as Wallet) : (data.data as any)?.wallet;
    },
  });

  // 2. Fetch Live Rates
  useEffect(() => {
    apiClient
      .get('/payments/rates?from=USDC&to=NGN')
      .then((res) => {
        if (res?.data?.data?.rate) setExchangeRate(Number(res.data.data.rate));
      })
      .catch(() => {});
  }, []);

  // 3. Fetch USDC Balance
  const fetchUsdc = async () => {
    if (address) {
      try {
        const bal = await getUsdcBalance(address);
        setUsdcBalance(bal);
      } catch {
        setUsdcBalance('0.00');
      }
    }
  };

  useEffect(() => {
    fetchUsdc();
  }, [address]);

  // 4. Fetch Saved Cards
  const { data: savedCards = [] } = useQuery<SavedPaymentMethod[]>({
    queryKey: ['client-saved-cards'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<SavedPaymentMethod[] | { savedCards: SavedPaymentMethod[] }>>('/wallets/saved-cards');
      return (Array.isArray(data.data) ? data.data : (data.data as any)?.savedCards) || [];
    },
  });

  // 5. Deposit Funds Mutation
  const depositMutation = useMutation({
    mutationFn: async () => {
      setErrorMessage('');
      const amountNum = Number(depositAmount);
      if (!amountNum || amountNum < 500) {
        throw new Error('Minimum deposit amount is ₦500.');
      }

      if (depositMethod === 'SIMULATE') {
        await apiClient.post('/wallets/simulate-deposit', { amount: amountNum });
        trackEvent('wallet_deposit_initiated', { amount: amountNum, method: depositMethod });
      } else {
        const { data } = await apiClient.post<ApiResponse<{ authorizationUrl: string; reference: string }>>(
          '/payments/initialize',
          { amount: amountNum }
        );
        if (data.data.authorizationUrl) {
          trackEvent('wallet_deposit_initiated', { amount: amountNum, method: depositMethod });
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

  // 6. Set Default Card Mutation
  const setDefaultCardMutation = useMutation({
    mutationFn: async (cardId: string) => {
      await apiClient.patch(`/wallets/saved-cards/${cardId}/default`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-saved-cards'] });
    },
  });

  // 7. Delete Saved Card Mutation
  const deleteCardMutation = useMutation({
    mutationFn: async (cardId: string) => {
      await apiClient.delete(`/wallets/saved-cards/${cardId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-saved-cards'] });
    },
  });

  const handleCopyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleMintTestUsdc = async () => {
    if (!address) {
      await connect();
      return;
    }
    try {
      setIsMintingUsdc(true);
      await mintTestUsdc(100);
      await fetchUsdc();
      alert('Successfully minted 100 Test USDC on Monad to your wallet!');
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setIsMintingUsdc(false);
    }
  };

  const handleKotaniOnRamp = async () => {
    if (!address) {
      await connect();
      return;
    }
    const amountNum = Number(onRampAmountNgn);
    if (!amountNum || amountNum < 1000) {
      alert('Minimum on-ramp deposit is ₦1,000');
      return;
    }

    try {
      setIsOnRamping(true);
      const { data } = await apiClient.post<ApiResponse<any>>('/payments/kotani/on-ramp', {
        amountNgn: amountNum,
        destinationWalletAddress: address,
      });

      if (data.data?.checkoutUrl && !data.data?.isSimulated) {
        window.location.href = data.data.checkoutUrl;
      } else {
        setOnRampModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ['client-wallet-page'] });
        await fetchUsdc();
        alert(
          `On-Ramp Initiated! ₦${amountNum.toLocaleString()} converted to ~${data.data?.estimatedUsdc} USDC for wallet ${address.slice(0, 6)}...${address.slice(-4)}`
        );
      }
    } catch (err: any) {
      alert(`On-ramp failed: ${getErrorMessage(err)}`);
    } finally {
      setIsOnRamping(false);
    }
  };

  const handleExportCsv = () => {
    if (!filteredTxs.length) {
      alert('No transactions to export.');
      return;
    }
    const headers = ['Date', 'Reference', 'Description', 'Rail', 'Amount (NGN)', 'Status'];
    const rows = filteredTxs.map((t) => [
      formatDate(t.createdAt),
      t.reference,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.description?.includes('Monad') || t.description?.includes('USDC') ? 'Monad USDC' : 'Paystack NGN',
      t.amount,
      t.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `artifix_client_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const availableBalance = Number(wallet?.availableBalance || 0);
  const escrowLocked = Number(wallet?.escrowLockedBalance || 0);
  const usdcNgnEquivalent = parseFloat(usdcBalance || '0') * exchangeRate;
  const totalBalance = availableBalance + escrowLocked + usdcNgnEquivalent;

  const rawTxs = wallet?.transactions || [];
  const filteredTxs = rawTxs.filter((tx) => {
    if (selectedTxType !== 'ALL' && tx.type !== selectedTxType) return false;
    if (searchRef && !tx.reference.toLowerCase().includes(searchRef.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-dashboard">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-dashboard flex items-center gap-3">
            Client Wallet &amp; Escrow
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your project funds across Nigerian Naira and Monad USDC escrow settlements
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setDepositModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-full px-5 py-2.5 shadow-sm text-sm font-semibold cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Deposit Naira</span>
          </Button>

          <Button
            variant="outline"
            onClick={handleMintTestUsdc}
            isLoading={isMintingUsdc}
            className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold border-slate-200 text-slate-700 bg-white hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <Zap className="h-4 w-4 text-amber-500" />
            <span>Test USDC (+100)</span>
          </Button>
        </div>
      </div>

      {/* Aggregated Total Portfolio Card */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 rounded-[28px] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-900/50">
        {/* Decorative background shapes */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full">
                Total Portfolio Net Worth
              </span>
              <span className="text-xs text-slate-300">
                1 USDC ≈ {formatCurrency(exchangeRate)} (Kotani Pay)
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-3 text-white">
              {formatCurrency(totalBalance)}
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Combined balance available for milestone funding across fiat and crypto rails
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setDepositModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2.5 rounded-full shadow-md flex items-center gap-2 text-sm cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Deposit Funds</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Dual Currency Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Naira Account */}
        <div className="p-6 border border-slate-100 bg-white rounded-[24px] shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-bold text-emerald-800 text-lg">
                ₦
              </div>
              <div>
                <h3 className="font-bold text-slate-900 font-dashboard">Naira Balance (Paystack)</h3>
                <p className="text-xs text-slate-500">In-App Debit Card &amp; Bank Funding</p>
              </div>
            </div>
            <Badge variant="success" className="text-xs px-2.5 py-0.5 rounded-full">
              Local NGN
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-100">
            <div>
              <span className="text-xs text-slate-500 font-medium">Available to Fund</span>
              <div className="text-2xl font-black text-emerald-700 mt-0.5">
                {formatCurrency(availableBalance)}
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Lock className="h-3 w-3 text-amber-500" /> Escrow Locked
              </span>
              <div className="text-2xl font-black text-amber-600 mt-0.5">
                {formatCurrency(escrowLocked)}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <Button
              onClick={() => setDepositModalOpen(true)}
              className="w-full text-xs font-semibold py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-full transition-colors cursor-pointer shadow-xs"
            >
              Top Up with Paystack
            </Button>
          </div>
        </div>

        {/* Card 2: Monad USDC Account */}
        <div className="p-6 border border-slate-100 bg-white rounded-[24px] shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                $
              </div>
              <div>
                <h3 className="font-bold text-slate-900 font-dashboard flex items-center gap-2">
                  Monad USDC Account
                  {isEmbedded ? (
                    <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      Privy Embedded
                    </span>
                  ) : address ? (
                    <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      Connected
                    </span>
                  ) : null}
                </h3>
                <p className="text-xs text-slate-500">Monad EVM Smart Contract Escrow</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {address && (
                <button
                  type="button"
                  onClick={() => {
                    setUnlinkError(null);
                    setUnlinkSuccess(null);
                    setIsUnlinkModalOpen(true);
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2.5 py-1 rounded-full border border-rose-200 hover:bg-rose-50 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Unlink Web3 Wallet"
                >
                  <Unlink className="h-3 w-3" />
                  <span>Unlink Wallet</span>
                </button>
              )}
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                Monad EVM
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-100">
            <div>
              <span className="text-xs text-slate-500 font-medium">Balance</span>
              <div className="text-2xl font-black text-slate-900 mt-0.5">
                ${parseFloat(usdcBalance).toFixed(2)} <span className="text-sm font-normal text-slate-500">USDC</span>
              </div>
              <span className="text-[11px] text-slate-400">≈ {formatCurrency(usdcNgnEquivalent)}</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs text-slate-500 font-medium">Linked Wallet</span>
                {address && (
                  <button
                    type="button"
                    onClick={() => {
                      setUnlinkError(null);
                      setUnlinkSuccess(null);
                      setIsUnlinkModalOpen(true);
                    }}
                    className="text-[10px] font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-0.5 cursor-pointer sm:hidden"
                    title="Unlink Wallet"
                  >
                    <Unlink className="h-2.5 w-2.5" />
                    Unlink
                  </button>
                )}
              </div>
              {address ? (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-700 font-mono bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <span className="truncate max-w-[110px]">{address}</span>
                  <button
                    onClick={handleCopyAddress}
                    className="p-1 hover:bg-white rounded text-slate-500 cursor-pointer"
                    title="Copy Address"
                  >
                    {isCopied ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  </button>
                  <a
                    href={`${MONAD_EXPLORER_URL}/address/${address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 hover:bg-white rounded text-slate-500 cursor-pointer"
                    title="View on Explorer"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => connect()}
                  className="mt-1 text-xs text-emerald-800 border-emerald-200 hover:bg-emerald-50 rounded-full cursor-pointer"
                >
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              onClick={() => setOnRampModalOpen(true)}
              className="w-full text-xs font-semibold py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Coins className="h-3.5 w-3.5" />
              <span>Buy USDC (Kotani)</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleMintTestUsdc}
              isLoading={isMintingUsdc}
              className="w-full text-xs font-semibold py-2.5 border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-full flex items-center justify-center gap-1 cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>Test Faucet (+100)</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Saved Payment Cards */}
      <div className="p-6 border border-slate-100 bg-white rounded-[24px] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-bold text-slate-900 font-dashboard">
              Saved Payment Cards
            </h2>
          </div>
          <button
            onClick={() => setDepositModalOpen(true)}
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-700 cursor-pointer"
          >
            + Add New Card
          </button>
        </div>

        {!savedCards || savedCards.length === 0 ? (
          <p className="text-xs text-slate-500 py-3">
            No saved cards yet. Make a deposit via Paystack to securely tokenize and save your card for 1-click milestone funding.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {savedCards.map((card) => (
              <div
                key={card.id}
                className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                  card.isDefault ? 'border-emerald-600 bg-emerald-50/40' : 'border-slate-200'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 uppercase font-dashboard">
                      {card.cardBrand} •••• {card.last4}
                    </span>
                    {card.isDefault && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-700 text-white">
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
                      className="text-[10px] text-emerald-800 hover:underline font-bold mr-2 cursor-pointer"
                    >
                      Make Default
                    </button>
                  )}
                  <button
                    onClick={() => deleteCardMutation.mutate(card.id)}
                    disabled={deleteCardMutation.isPending}
                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    title="Delete card"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction Ledger */}
      <div className="p-6 border border-slate-100 bg-white rounded-[24px] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-bold text-slate-900 font-dashboard">
              Transaction History
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by ref..."
                value={searchRef}
                onChange={(e) => setSearchRef(e.target.value)}
                className="pl-8 pr-3 py-2 text-xs rounded-full border border-slate-200 w-40 sm:w-48 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <select
              value={selectedTxType}
              onChange={(e) => setSelectedTxType(e.target.value)}
              className="text-xs py-2 px-3 rounded-full border border-slate-200 bg-white cursor-pointer font-medium"
            >
              <option value="ALL">All Types</option>
              <option value="WALLET_DEPOSIT">Deposits</option>
              <option value="ESCROW_LOCK">Escrow Locks</option>
              <option value="ESCROW_RELEASE">Escrow Releases</option>
              <option value="ESCROW_REFUND">Refunds</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="text-xs py-2 px-4 rounded-full border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 font-semibold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredTxs.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-10">No transactions found</p>
          ) : (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3">Rail</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTxs.map((tx) => {
                  const isCredit = Number(tx.netAmount) > 0;
                  const isCrypto = tx.description?.includes('Monad') || tx.description?.includes('USDC');
                  const txHash = tx.paymentGatewayRef?.startsWith('0x')
                    ? tx.paymentGatewayRef
                    : (tx.metadata as any)?.txHash;

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {tx.description}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                        <div className="flex items-center gap-1">
                          <span>{tx.reference}</span>
                          {txHash && (
                            <a
                              href={`${MONAD_EXPLORER_URL}/tx/${txHash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 p-0.5"
                              title="View on Monad Explorer"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        {isCrypto ? (
                          <Badge className="bg-indigo-50 text-indigo-700 text-[10px] px-2 py-0.5 border-indigo-200">
                            Monad USDC
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 border-emerald-200">
                            Naira Bank
                          </Badge>
                        )}
                      </td>
                      <td className={`py-2.5 px-3 font-bold ${isCredit ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {isCredit ? '+' : ''}
                        {formatCurrency(Math.abs(Number(tx.amount)))}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant={tx.status === 'SUCCESS' ? 'success' : tx.status === 'PENDING' ? 'warning' : 'danger'}
                          className="text-[10px] px-1.5 py-0.2"
                        >
                          {tx.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                        {formatDate(tx.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Deposit Modal */}
      <Modal isOpen={depositModalOpen} onClose={() => setDepositModalOpen(false)} title="Fund Your Wallet">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Deposit Amount (₦)
            </label>
            <input
              type="number"
              min="500"
              step="100"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full text-sm py-2 px-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. 50000"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Payment Gateway
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDepositMethod('PAYSTACK')}
                className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                  depositMethod === 'PAYSTACK'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-4 h-4 text-emerald-600 mb-1" />
                Paystack Checkout
                <span className="block text-[10px] font-normal text-slate-400">Cards, Transfer, USSD</span>
              </button>

              <button
                type="button"
                onClick={() => setDepositMethod('SIMULATE')}
                className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                  depositMethod === 'SIMULATE'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                
                Sandbox Simulated Top-Up
                <span className="block text-[10px] font-normal text-slate-400">Instant test fund</span>
              </button>
            </div>
          </div>

          {errorMessage && (
            <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
              {errorMessage}
            </p>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDepositModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => depositMutation.mutate()}
              isLoading={depositMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              Proceed to Deposit
            </Button>
          </div>
        </div>
      </Modal>

      {/* Kotani Pay On-Ramp Modal */}
      <Modal isOpen={onRampModalOpen} onClose={() => setOnRampModalOpen(false)} title="Buy USDC with Naira (Kotani Pay)">
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-900 text-xs">
            <p className="font-semibold flex items-center gap-1.5">
              
              Direct Naira to Monad USDC On-Ramp
            </p>
            <p className="mt-1 text-slate-600 text-[11px] leading-relaxed">
              Convert Naira instantly into ERC-20 USDC deposited directly into your linked Monad wallet address.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Deposit Amount (₦ NGN)
            </label>
            <input
              type="number"
              min="1000"
              step="500"
              value={onRampAmountNgn}
              onChange={(e) => setOnRampAmountNgn(e.target.value)}
              className="w-full text-sm py-2 px-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. 25000"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span>Exchange Rate:</span>
              <span className="font-medium text-slate-700">1 USDC = {formatCurrency(exchangeRate)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Destination Wallet:</span>
              <span className="font-mono text-slate-800 font-bold">
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not Connected'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-700">Estimated Output:</span>
              <span className="font-black text-indigo-600 text-base">
                ~{(Number(onRampAmountNgn || 0) / exchangeRate).toFixed(2)} USDC
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setOnRampModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleKotaniOnRamp}
              isLoading={isOnRamping}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
            >
              Proceed with Kotani Pay
            </Button>
          </div>
        </div>
      </Modal>

      {/* Unlink Wallet Confirmation Modal */}
      <Modal
        isOpen={isUnlinkModalOpen}
        onClose={() => !isUnlinkingWallet && setIsUnlinkModalOpen(false)}
        title="Unlink Web3 Wallet"
        description="Disconnect and unbind your Monad EVM address from your Fixmate profile."
        maxWidth="md"
      >
        <div className="space-y-4">
          {unlinkError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
              <span>{unlinkError}</span>
              <button onClick={() => setUnlinkError(null)} className="font-bold ml-2">×</button>
            </div>
          )}

          {unlinkSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium">
              {unlinkSuccess}
            </div>
          )}

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Active Address:</span>
              <span className="font-semibold text-slate-700">{isEmbedded ? 'Privy Embedded' : 'External Wallet'}</span>
            </div>
            <div className="font-mono text-xs text-slate-800 break-all p-2.5 bg-white rounded-lg border border-slate-200">
              {address}
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Unlinking removes this wallet address from your Fixmate profile and disconnects the Web3 session. You can reconnect or link a new wallet anytime. Any funds held in already-funded smart contract escrows remain secure on-chain.
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsUnlinkModalOpen(false)}
              disabled={isUnlinkingWallet}
              className="rounded-full text-xs font-semibold px-4 py-2 border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUnlinkWallet}
              isLoading={isUnlinkingWallet}
              className="rounded-full text-xs font-semibold px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 cursor-pointer"
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>Confirm Unlink</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ClientWalletPage;
