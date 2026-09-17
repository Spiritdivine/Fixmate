import React, { useEffect, useState } from 'react';
import {
  Wallet as WalletIcon,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Building2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Coins,
  Copy,
  ExternalLink,
  Zap,
  Download,
  Send,
  Unlink,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { formatNgn, formatDate, formatDateTime } from '../../lib/formatters';
import { Wallet, BankAccount, Transaction, PayoutRequest } from '../../types';
import { useUnifiedWallet } from '../../lib/privy-provider';
import { getUsdcBalance, mintTestUsdc, transferUsdc, MONAD_EXPLORER_URL } from '../../lib/monad-web3';

export const WalletPage: React.FC = () => {
  const {
    address,
    isConnected,
    isEmbedded,
    walletType,
    connect,
    setManualWalletAddress,
    unlinkWallet,
  } = useUnifiedWallet();

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [ledgerTab, setLedgerTab] = useState<'transactions' | 'payouts'>('transactions');
  const [isCancellingPayout, setIsCancellingPayout] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Web3 & Kotani Rates
  const [usdcBalance, setUsdcBalance] = useState<string>('0.00');
  const [exchangeRate, setExchangeRate] = useState<number>(1465.0);
  const [isMintingUsdc, setIsMintingUsdc] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Link / Manage Monad EVM Wallet Modal State
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isUnlinkModalOpen, setIsUnlinkModalOpen] = useState(false);
  const [inputWalletAddress, setInputWalletAddress] = useState('');
  const [isLinkingWallet, setIsLinkingWallet] = useState(false);
  const [walletModalError, setWalletModalError] = useState<string | null>(null);
  const [walletModalSuccess, setWalletModalSuccess] = useState<string | null>(null);

  // Direct Send USDC Modal State
  const [isSendUsdcModalOpen, setIsSendUsdcModalOpen] = useState(false);
  const [sendRecipientAddress, setSendRecipientAddress] = useState('');
  const [sendUsdcAmount, setSendUsdcAmount] = useState('');
  const [isSendingUsdc, setIsSendingUsdc] = useState(false);
  const [sendUsdcTxHash, setSendUsdcTxHash] = useState<string | null>(null);
  const [sendUsdcError, setSendUsdcError] = useState<string | null>(null);

  // Link Bank Modal State
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [bankName, setBankName] = useState('GTBank');
  const [bankCode, setBankCode] = useState('058');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [isResolvingBank, setIsResolvingBank] = useState(false);
  const [isBankResolved, setIsBankResolved] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);

  // Unified Withdrawal Modal State
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawSource, setWithdrawSource] = useState<'NGN' | 'USDC'>('NGN');
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState<string | null>(null);

  // Dev Top-up
  const [isTopUpLoading, setIsTopUpLoading] = useState(false);

  const nigerianBanks = [
    { value: '058', label: 'Guaranty Trust Bank (GTBank)', name: 'GTBank' },
    { value: '044', label: 'Access Bank', name: 'Access Bank' },
    { value: '057', label: 'Zenith Bank', name: 'Zenith Bank' },
    { value: '011', label: 'First Bank of Nigeria', name: 'First Bank' },
    { value: '033', label: 'United Bank for Africa (UBA)', name: 'UBA' },
    { value: '214', label: 'First City Monument Bank (FCMB)', name: 'FCMB' },
    { value: '035', label: 'Wema Bank', name: 'Wema Bank' },
    { value: '50211', label: 'Kuda Bank (Microfinance)', name: 'Kuda Bank' },
    { value: '999991', label: 'PalmPay', name: 'PalmPay' },
    { value: '999992', label: 'OPay', name: 'OPay' },
  ];

  // Auto-resolve bank account name via Paystack NUBAN when 10 digits are typed
  useEffect(() => {
    let isMounted = true;
    const cleanNum = accountNumber.trim();
    if (cleanNum.length === 10 && bankCode) {
      const resolveAccount = async () => {
        try {
          setIsResolvingBank(true);
          setBankError(null);
          const { data } = await apiClient.get('/wallets/bank-accounts/resolve', {
            params: { accountNumber: cleanNum, bankCode },
          });
          if (isMounted && data?.data?.accountName) {
            setAccountName(data.data.accountName);
            setIsBankResolved(true);
          }
        } catch (err: any) {
          if (isMounted) {
            setIsBankResolved(false);
            setBankError(getErrorMessage(err));
          }
        } finally {
          if (isMounted) setIsResolvingBank(false);
        }
      };
      resolveAccount();
    } else {
      setIsBankResolved(false);
    }
    return () => {
      isMounted = false;
    };
  }, [accountNumber, bankCode]);

  const fetchWalletData = async () => {
    try {
      setIsLoading(true);
      const [walletRes, banksRes, rateRes] = await Promise.all([
        apiClient.get('/wallets/my-wallet'),
        apiClient.get('/wallets/bank-accounts'),
        apiClient.get('/payments/rates?from=USDC&to=NGN').catch(() => ({ data: { data: { rate: 1465.0 } } })),
      ]);

      setWallet(walletRes.data.data);
      setTransactions(walletRes.data.data.transactions || []);
      setPayoutRequests(walletRes.data.data.payoutRequests || []);
      setBankAccounts(banksRes.data.data || []);

      if (rateRes?.data?.data?.rate) {
        setExchangeRate(Number(rateRes.data.data.rate));
      }

      const defaultBank = (banksRes.data.data || []).find((b: BankAccount) => b.isDefault);
      if (defaultBank) {
        setSelectedBankId(defaultBank.id);
      } else if (banksRes.data.data?.length > 0) {
        setSelectedBankId(banksRes.data.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load wallet data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsdcBalance = async () => {
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
    fetchWalletData();
  }, []);

  useEffect(() => {
    fetchUsdcBalance();
  }, [address]);

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
      await fetchUsdcBalance();
      alert('Successfully minted 100 Test USDC on Monad to your wallet!');
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setIsMintingUsdc(false);
    }
  };

  const handleLinkBank = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsAddingBank(true);
      setBankError(null);

      const selectedBankObj = nigerianBanks.find((b) => b.value === bankCode);

      const { data } = await apiClient.post('/wallets/bank-accounts', {
        bankName: selectedBankObj?.name || bankName,
        bankCode,
        accountNumber,
        accountName,
      });

      setBankAccounts((prev) => [data.data, ...prev]);
      if (!selectedBankId) setSelectedBankId(data.data.id);
      setIsBankModalOpen(false);
      setAccountNumber('');
      setAccountName('');
    } catch (err) {
      setBankError(getErrorMessage(err));
    } finally {
      setIsAddingBank(false);
    }
  };

  const handleDeleteBank = async (bankId: string) => {
    if (!window.confirm('Are you sure you want to unlink this bank account?')) return;
    try {
      await apiClient.delete(`/wallets/bank-accounts/${bankId}`);
      setBankAccounts((prev) => prev.filter((b) => b.id !== bankId));
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleSetDefaultBank = async (bankId: string) => {
    try {
      await apiClient.patch(`/wallets/bank-accounts/${bankId}/default`);
      setBankAccounts((prev) =>
        prev.map((b) => ({ ...b, isDefault: b.id === bankId }))
      );
      setSelectedBankId(bankId);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleConnectWeb3 = async () => {
    try {
      setIsLinkingWallet(true);
      setWalletModalError(null);
      setWalletModalSuccess(null);
      const res = await connect();
      setWalletModalSuccess(`Wallet ${res.address.slice(0, 6)}...${res.address.slice(-4)} connected successfully!`);
      await fetchUsdcBalance();
      setTimeout(() => {
        setIsWalletModalOpen(false);
        setWalletModalSuccess(null);
      }, 1500);
    } catch (err: any) {
      setWalletModalError(getErrorMessage(err));
    } finally {
      setIsLinkingWallet(false);
    }
  };

  const handleManualLinkWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLinkingWallet(true);
      setWalletModalError(null);
      setWalletModalSuccess(null);
      await setManualWalletAddress(inputWalletAddress);
      setWalletModalSuccess('Monad EVM wallet address linked successfully!');
      setInputWalletAddress('');
      await fetchUsdcBalance();
      setTimeout(() => {
        setIsWalletModalOpen(false);
        setWalletModalSuccess(null);
      }, 1500);
    } catch (err: any) {
      setWalletModalError(getErrorMessage(err));
    } finally {
      setIsLinkingWallet(false);
    }
  };

  const handleUnlinkWallet = async () => {
    try {
      setIsLinkingWallet(true);
      setWalletModalError(null);
      await unlinkWallet();
      setUsdcBalance('0.00');
      setWalletModalSuccess('Wallet address unlinked successfully.');
      setTimeout(() => {
        setIsUnlinkModalOpen(false);
        setIsWalletModalOpen(false);
        setWalletModalSuccess(null);
      }, 1200);
    } catch (err: any) {
      setWalletModalError(getErrorMessage(err));
    } finally {
      setIsLinkingWallet(false);
    }
  };

  const handleCancelPayout = async (payoutId: string) => {
    if (!window.confirm('Cancel this pending withdrawal request and refund the funds back to your wallet balance?')) return;
    try {
      setIsCancellingPayout(payoutId);
      await apiClient.delete(`/wallets/withdrawals/${payoutId}`);
      await fetchWalletData();
    } catch (err: any) {
      alert(getErrorMessage(err));
    } finally {
      setIsCancellingPayout(null);
    }
  };

  const handleUnifiedWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(withdrawAmount);
    if (!numericAmount || numericAmount <= 0) {
      setWithdrawError('Enter a valid amount');
      return;
    }

    if (!selectedBankId) {
      setWithdrawError('Please select a destination bank account');
      return;
    }

    try {
      setIsWithdrawing(true);
      setWithdrawError(null);
      setWithdrawSuccessMsg(null);

      if (withdrawSource === 'NGN') {
        if (numericAmount < 1000) {
          setWithdrawError('Minimum withdrawal amount is ₦1,000.00');
          return;
        }

        const available = Number(wallet?.availableBalance || 0);
        if (numericAmount > available) {
          setWithdrawError(`Insufficient Naira balance. Available: ${formatNgn(available)}`);
          return;
        }

        await apiClient.post('/wallets/withdraw', {
          bankAccountId: selectedBankId,
          amount: numericAmount,
        });

        setWithdrawSuccessMsg(`Withdrawal of ${formatNgn(numericAmount)} initiated to your bank!`);
      } else {
        if (numericAmount < 2) {
          setWithdrawError('Minimum cash-out amount is $2.00 USDC');
          return;
        }

        // USDC Kotani Pay Off-Ramp
        const availableUsdc = parseFloat(usdcBalance || '0');
        if (numericAmount > availableUsdc) {
          setWithdrawError(`Insufficient USDC balance. Available: $${availableUsdc.toFixed(2)} USDC`);
          return;
        }

        const estNgn = Number((numericAmount * exchangeRate).toFixed(2));

        await apiClient.post('/payments/kotani/off-ramp', {
          amountUsdc: numericAmount,
          bankAccountId: selectedBankId,
        });

        setWithdrawSuccessMsg(
          `Cashed out $${numericAmount.toFixed(2)} USDC (~${formatNgn(estNgn)}) via Kotani Pay! Transfer is en route to your bank.`
        );
        fetchUsdcBalance();
      }

      await fetchWalletData();
      setTimeout(() => {
        setIsWithdrawModalOpen(false);
        setWithdrawAmount('');
        setWithdrawSuccessMsg(null);
      }, 2500);
    } catch (err) {
      setWithdrawError(getErrorMessage(err));
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleSimulateTopUp = async () => {
    try {
      setIsTopUpLoading(true);
      await apiClient.post('/wallets/simulate-deposit', { amount: 50000 });
      await fetchWalletData();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setIsTopUpLoading(false);
    }
  };

  const handleSendUsdc = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(sendUsdcAmount);
    if (!amountNum || amountNum <= 0) {
      setSendUsdcError('Enter a valid USDC amount.');
      return;
    }

    const availableUsdc = parseFloat(usdcBalance || '0');
    if (amountNum > availableUsdc) {
      setSendUsdcError(`Insufficient USDC balance. You have $${availableUsdc.toFixed(2)} USDC.`);
      return;
    }

    if (!sendRecipientAddress.startsWith('0x') || sendRecipientAddress.length !== 42) {
      setSendUsdcError('Please enter a valid 42-character EVM address (0x...).');
      return;
    }

    try {
      setIsSendingUsdc(true);
      setSendUsdcError(null);
      setSendUsdcTxHash(null);

      const txHash = await transferUsdc(sendRecipientAddress, amountNum);
      setSendUsdcTxHash(txHash);
      await fetchUsdcBalance();

      setTimeout(() => {
        setIsSendUsdcModalOpen(false);
        setSendRecipientAddress('');
        setSendUsdcAmount('');
        setSendUsdcTxHash(null);
      }, 3500);
    } catch (err: any) {
      setSendUsdcError(err.message || 'USDC transfer failed.');
    } finally {
      setIsSendingUsdc(false);
    }
  };

  const handleExportCsv = () => {
    if (!transactions.length) {
      alert('No transactions to export.');
      return;
    }
    const headers = ['Date', 'Reference', 'Description', 'Rail', 'Amount (NGN)', 'Status'];
    const rows = transactions.map((t) => [
      formatDate(t.createdAt),
      t.reference,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.description?.includes('Monad') || t.description?.includes('USDC') ? 'Monad USDC' : 'Naira Bank',
      t.amount,
      t.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `artifix_artisan_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const availableNgn = Number(wallet?.availableBalance || 0);
  const lockedNgn = Number(wallet?.escrowLockedBalance || 0);
  const usdcNgnEquivalent = parseFloat(usdcBalance || '0') * exchangeRate;
  const totalPortfolioValue = availableNgn + lockedNgn + usdcNgnEquivalent;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header & Dev Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <WalletIcon className="h-7 w-7 text-indigo-600" />
            Financial Hub
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Unified balances across Nigerian Naira (Bank rail) and Monad USDC (Web3 rail)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchWalletData}
            isLoading={isLoading}
            className="flex items-center gap-1.5 text-xs text-gray-600 border-gray-300"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSimulateTopUp}
            isLoading={isTopUpLoading}
            className="flex items-center gap-1.5 text-xs border-dashed border-indigo-300 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Dev Fund (+₦50k)
          </Button>
        </div>
      </div>

      {/* Aggregated Portfolio Banner */}
      <div className="bg-gradient-to-br from-gray-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-2.5 py-1 rounded-full">
                Total Portfolio Net Worth
              </span>
              <span className="text-xs text-gray-400">
                1 USDC ≈ {formatNgn(exchangeRate)} (Kotani Pay)
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2 text-white">
              {formatNgn(totalPortfolioValue)}
            </div>
            <p className="text-xs text-gray-300 mt-1">
              Combined value of your Naira earnings and Monad stablecoin assets
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => {
                setWithdrawSource('NGN');
                setIsWithdrawModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2"
            >
              <ArrowUpRight className="h-4 w-4" />
              Withdraw Funds
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setWithdrawSource('USDC');
                setIsWithdrawModalOpen(true);
              }}
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-medium px-5 py-2.5 rounded-xl flex items-center gap-2"
            >
              <Coins className="h-4 w-4 text-emerald-400" />
              Cash Out USDC to Bank
            </Button>
          </div>
        </div>
      </div>

      {/* Dual Asset Cards (Fiat vs Monad USDC) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Nigerian Naira (Bank Rail) */}
        <Card className="border border-gray-200/80 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-bold text-emerald-700 text-lg">
                  ₦
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Naira Account</h3>
                  <p className="text-xs text-gray-500">Paystack & Local Bank Settlement</p>
                </div>
              </div>
              <Badge variant="success" className="text-xs px-2 py-0.5">
                Local NGN
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-100">
              <div>
                <span className="text-xs text-gray-500 font-medium">Available to Withdraw</span>
                <div className="text-2xl font-bold text-gray-900 mt-0.5">
                  {formatNgn(availableNgn)}
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                  <Lock className="h-3 w-3 text-amber-500" /> Escrow Locked
                </span>
                <div className="text-2xl font-bold text-amber-600 mt-0.5">
                  {formatNgn(lockedNgn)}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <Button
                variant="outline"
                className="w-full text-xs font-semibold py-2 text-gray-700 border-gray-300"
                onClick={() => {
                  setWithdrawSource('NGN');
                  setIsWithdrawModalOpen(true);
                }}
              >
                Withdraw to Bank
              </Button>
            </div>
          </div>
        </Card>

        {/* Card 2: Monad USDC (Privy Web3 Rail) */}
        <Card className="border border-indigo-200/70 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow bg-gradient-to-b from-indigo-50/30 to-transparent">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  $
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    Monad USDC Account
                    {isEmbedded ? (
                      <Badge className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0 border-0">
                        Privy Embedded
                      </Badge>
                    ) : address ? (
                      <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0 border-0">
                        Connected
                      </Badge>
                    ) : null}
                  </h3>
                  <p className="text-xs text-gray-500">Instant Smart Contract Settlements</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {address && (
                  <button
                    type="button"
                    onClick={() => {
                      setWalletModalError(null);
                      setWalletModalSuccess(null);
                      setIsUnlinkModalOpen(true);
                    }}
                    className="text-xs text-red-600 hover:text-red-700 font-medium px-2.5 py-1 rounded-full border border-red-200 hover:bg-red-50 flex items-center gap-1 cursor-pointer transition-colors"
                    title="Unlink Monad EVM Wallet"
                  >
                    <Unlink className="h-3 w-3" />
                    <span>Unlink Wallet</span>
                  </button>
                )}
                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs px-2 py-0.5">
                  Monad EVM
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-indigo-100/70">
              <div>
                <span className="text-xs text-gray-500 font-medium">Balance</span>
                <div className="text-2xl font-bold text-indigo-950 mt-0.5">
                  ${parseFloat(usdcBalance).toFixed(2)} <span className="text-sm font-normal text-gray-500">USDC</span>
                </div>
                <span className="text-[11px] text-gray-400">≈ {formatNgn(usdcNgnEquivalent)}</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs text-gray-500 font-medium">Linked Wallet</span>
                  {address && (
                    <button
                      type="button"
                      onClick={() => {
                        setWalletModalError(null);
                        setWalletModalSuccess(null);
                        setIsUnlinkModalOpen(true);
                      }}
                      className="text-[10px] font-semibold text-red-600 hover:text-red-800 flex items-center gap-0.5 cursor-pointer sm:hidden"
                      title="Unlink Wallet"
                    >
                      <Unlink className="h-2.5 w-2.5" />
                      Unlink
                    </button>
                  )}
                </div>
                {address ? (
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-700 font-mono bg-white/80 p-1.5 rounded-lg border border-gray-200">
                    <span className="truncate max-w-[110px]">{address}</span>
                    <button
                      onClick={handleCopyAddress}
                      className="p-1 hover:bg-gray-100 rounded text-gray-500"
                      title="Copy Address"
                    >
                      {isCopied ? <CheckCircle className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    </button>
                    <a
                      href={`${MONAD_EXPLORER_URL}/address/${address}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 hover:bg-gray-100 rounded text-gray-500"
                      title="View on Explorer"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setWalletModalError(null);
                        setWalletModalSuccess(null);
                        setIsWalletModalOpen(true);
                      }}
                      className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 px-1 py-0.5 rounded hover:bg-indigo-50"
                    >
                      Manage
                    </button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setWalletModalError(null);
                      setWalletModalSuccess(null);
                      setIsWalletModalOpen(true);
                    }}
                    className="mt-1 text-xs text-indigo-600 border-indigo-300 flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Link Wallet
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center gap-2">
              <Button
                className="w-full sm:flex-1 text-xs font-semibold py-2 bg-indigo-600 hover:bg-indigo-500 text-white"
                onClick={() => {
                  setWithdrawSource('USDC');
                  setIsWithdrawModalOpen(true);
                }}
              >
                Cash Out to Bank (Kotani Pay)
              </Button>

              <Button
                variant="outline"
                className="w-full sm:w-auto text-xs font-semibold py-2 border-indigo-300 text-indigo-700 bg-white hover:bg-indigo-50 flex items-center justify-center gap-1.5"
                onClick={() => setIsSendUsdcModalOpen(true)}
              >
                <Send className="w-3.5 h-3.5" />
                Send USDC
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleMintTestUsdc}
                isLoading={isMintingUsdc}
                className="w-full sm:w-auto text-xs border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50 whitespace-nowrap"
                title="Test Faucet"
              >
                <Zap className="h-3 w-3 text-amber-500 mr-1" />
                +100
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Linked Bank Accounts Section */}
      <Card className="border border-gray-200/80 shadow-sm rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-600" />
              Verified Bank Accounts
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Direct payout destination for both Naira and Kotani Pay USDC conversions
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => setIsBankModalOpen(true)}
            className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Bank
          </Button>
        </CardHeader>

        <div className="p-6 pt-2">
          {bankAccounts.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
              <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">No bank account linked yet</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                Link a Nigerian bank account to withdraw your earnings.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bankAccounts.map((account) => (
                <div
                  key={account.id}
                  className={`p-4 rounded-xl border transition-all ${
                    account.isDefault
                      ? 'border-indigo-500 bg-indigo-50/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">{account.bankName}</span>
                        {account.isDefault && (
                          <Badge variant="success" className="text-[10px] px-1.5 py-0">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-lg font-mono font-medium text-gray-800 tracking-wider mt-1">
                        {account.accountNumber}
                      </p>
                      <p className="text-xs text-gray-500 uppercase mt-0.5">{account.accountName}</p>
                      <div className="flex items-center gap-1 mt-1.5 text-[11px] text-emerald-700 font-medium">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Verified via Paystack NUBAN</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {!account.isDefault && (
                        <button
                          onClick={() => handleSetDefaultBank(account.id)}
                          className="text-xs text-indigo-600 hover:underline px-2 py-1"
                        >
                          Make Default
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteBank(account.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete Bank"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Unified Transaction & Payout History */}
      <Card className="border border-gray-200/80 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-3">
          <div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setLedgerTab('transactions')}
                className={`text-sm sm:text-base font-semibold pb-1.5 transition-all border-b-2 ${
                  ledgerTab === 'transactions'
                    ? 'border-indigo-600 text-gray-900'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                Transaction Activity ({transactions.length})
              </button>
              <button
                type="button"
                onClick={() => setLedgerTab('payouts')}
                className={`text-sm sm:text-base font-semibold pb-1.5 transition-all border-b-2 flex items-center gap-1.5 ${
                  ledgerTab === 'payouts'
                    ? 'border-indigo-600 text-gray-900'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <span>Payout Requests</span>
                {payoutRequests.filter((p) => p.status === 'PENDING').length > 0 && (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {payoutRequests.filter((p) => p.status === 'PENDING').length} pending
                  </span>
                )}
              </button>
            </div>
            <CardDescription className="text-xs text-gray-500 mt-1">
              {ledgerTab === 'transactions'
                ? 'Complete audit trail of milestone escrow locks, releases, and bank payouts'
                : 'Real-time status of your bank and USDC withdrawal disbursements with cancellation support'}
            </CardDescription>
          </div>
          {ledgerTab === 'transactions' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="text-xs border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              Export Statement (CSV)
            </Button>
          )}
        </CardHeader>

        {ledgerTab === 'transactions' ? (
          <div className="overflow-x-auto">
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                No transactions recorded yet
              </div>
            ) : (
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-6">Transaction</th>
                    <th className="py-3 px-6">Reference</th>
                    <th className="py-3 px-6">Rail</th>
                    <th className="py-3 px-6">Amount</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((tx) => {
                    const isCredit = Number(tx.netAmount) > 0;
                    const isKotani = (tx as any).metadata && ((tx as any).metadata as any)?.gateway === 'KOTANI';
                    const isCrypto = tx.description?.includes('USDC') || tx.description?.includes('Monad') || isKotani;
                    const txHash = tx.paymentGatewayRef?.startsWith('0x')
                      ? tx.paymentGatewayRef
                      : (tx.metadata as any)?.txHash;

                    return (
                      <tr key={tx.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${
                                isCredit ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                              }`}
                            >
                              {isCredit ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-xs sm:text-sm">{tx.description}</p>
                              <span className="text-[11px] text-gray-400 font-mono">{tx.type}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-6 font-mono text-xs text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <span>{tx.reference}</span>
                            {txHash && (
                              <a
                                href={`${MONAD_EXPLORER_URL}/tx/${txHash}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-600 hover:text-indigo-800 p-0.5"
                                title="View on Monad Explorer"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-6">
                          {isCrypto ? (
                            <Badge className="bg-indigo-50 text-indigo-700 text-[10px] px-2 py-0.5 border-indigo-200">
                              Monad / Kotani
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 border-emerald-200">
                              Naira Bank
                            </Badge>
                          )}
                        </td>

                        <td className="py-3 px-6 font-semibold">
                          <span className={isCredit ? 'text-emerald-600' : 'text-gray-900'}>
                            {isCredit ? '+' : ''}
                            {formatNgn(Math.abs(Number(tx.amount)))}
                          </span>
                        </td>

                        <td className="py-3 px-6">
                          <Badge
                            variant={
                              tx.status === 'SUCCESS'
                                ? 'success'
                                : tx.status === 'PENDING'
                                ? 'warning'
                                : 'danger'
                            }
                            className="text-[11px] px-2 py-0.5"
                          >
                            {tx.status}
                          </Badge>
                        </td>

                        <td className="py-3 px-6 text-xs text-gray-500 whitespace-nowrap">
                          {formatDateTime(tx.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            {payoutRequests.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                No payout requests recorded yet
              </div>
            ) : (
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-6">Reference</th>
                    <th className="py-3 px-6">Destination</th>
                    <th className="py-3 px-6">Gateway</th>
                    <th className="py-3 px-6">Amount</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6">Requested</th>
                    <th className="py-3 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payoutRequests.map((payout) => {
                    const isPending = payout.status === 'PENDING';
                    const isProcessing = payout.status === 'PROCESSING';
                    const isCompleted = payout.status === 'COMPLETED';

                    return (
                      <tr key={payout.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-6 font-mono text-xs text-gray-700 font-semibold">
                          {payout.reference}
                        </td>
                        <td className="py-3 px-6 text-xs">
                          {payout.bankAccount ? (
                            <div>
                              <p className="font-semibold text-gray-900">{payout.bankAccount.bankName}</p>
                              <p className="font-mono text-gray-500 text-[11px]">
                                {payout.bankAccount.accountNumber} • {payout.bankAccount.accountName}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-400">Linked Bank Account</span>
                          )}
                        </td>
                        <td className="py-3 px-6">
                          <Badge className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 border-slate-200">
                            {(payout as any).gateway || 'PAYSTACK'}
                          </Badge>
                        </td>
                        <td className="py-3 px-6 font-bold text-gray-900">
                          {formatNgn(Number(payout.amount))}
                        </td>
                        <td className="py-3 px-6">
                          <Badge
                            variant={
                              isCompleted
                                ? 'success'
                                : isPending
                                ? 'warning'
                                : isProcessing
                                ? 'default'
                                : 'danger'
                            }
                            className="text-[11px] px-2 py-0.5"
                          >
                            {payout.status}
                          </Badge>
                          {payout.failureReason && (
                            <p className="text-[10px] text-rose-500 mt-0.5 max-w-xs truncate" title={payout.failureReason}>
                              {payout.failureReason}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-6 text-xs text-gray-500 whitespace-nowrap">
                          {formatDateTime(payout.createdAt)}
                        </td>
                        <td className="py-3 px-6 text-right">
                          {isPending && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelPayout(payout.id)}
                              isLoading={isCancellingPayout === payout.id}
                              className="text-[11px] py-1 px-2.5 text-rose-600 border-rose-200 hover:bg-rose-50"
                            >
                              Cancel
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </Card>

      {/* Unified Withdrawal Modal */}
      <Modal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        title="Withdraw / Cash Out Earnings"
      >
        <form onSubmit={handleUnifiedWithdrawal} className="space-y-4">
          {/* Source Rail Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setWithdrawSource('NGN');
                setWithdrawError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                withdrawSource === 'NGN'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              🇳🇬 Naira Balance ({formatNgn(availableNgn)})
            </button>

            <button
              type="button"
              onClick={() => {
                setWithdrawSource('USDC');
                setWithdrawError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                withdrawSource === 'USDC'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              🟣 Monad USDC (${parseFloat(usdcBalance).toFixed(2)})
            </button>
          </div>

          {/* KYC Tier & 24h Daily Limit Indicator */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
            <div className="flex items-center justify-between font-medium">
              <span className="flex items-center gap-1.5 text-slate-700">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                {wallet?.tierLimits?.isKycVerified ? 'Tier 2 (KYC Verified)' : 'Tier 1 (Standard)'}
              </span>
              <span className="text-slate-600 font-semibold">
                Daily Limit: {withdrawSource === 'NGN' ? (wallet?.tierLimits?.isKycVerified ? '₦1,000,000' : '₦50,000') : (wallet?.tierLimits?.isKycVerified ? '$1,000 USDC' : '$50 USDC')}
              </span>
            </div>
            {withdrawSource === 'NGN' && wallet?.tierLimits && (
              <p className="text-[11px] text-slate-500">
                Remaining 24h allowance: <span className="font-semibold text-indigo-600">{formatNgn(wallet.tierLimits.remainingLimitNgn)}</span>
                {!wallet.tierLimits.isKycVerified && (
                  <span className="text-amber-600 block sm:inline sm:ml-1">• Complete KYC to unlock ₦1M daily</span>
                )}
              </p>
            )}
          </div>

          {withdrawSource === 'USDC' && (
            <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-900 space-y-1">
              <div className="flex justify-between font-medium">
                <span>Kotani Pay Exchange Rate:</span>
                <span className="font-semibold text-indigo-700">1 USDC ≈ {formatNgn(exchangeRate)}</span>
              </div>
              <p className="text-[11px] text-indigo-600">
                USDC is converted and transferred straight to your local Nigerian bank via NIBSS instant settlement.
              </p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-700">
                {withdrawSource === 'NGN' ? 'Amount to Withdraw (₦)' : 'Amount in USDC ($)'}
              </label>
              <span className="text-[11px] text-gray-400">
                {withdrawSource === 'NGN' ? 'Min: ₦1,000.00' : 'Min: $2.00 USDC'}
              </span>
            </div>
            <div className="relative">
              <Input
                type="number"
                step={withdrawSource === 'USDC' ? '0.01' : '100'}
                min={withdrawSource === 'NGN' ? '1000' : '2'}
                placeholder={withdrawSource === 'NGN' ? 'e.g. 25000' : 'e.g. 50.00'}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() =>
                  setWithdrawAmount(
                    withdrawSource === 'NGN'
                      ? availableNgn.toString()
                      : parseFloat(usdcBalance).toString()
                  )
                }
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-indigo-600 font-semibold px-2 py-0.5 rounded hover:bg-indigo-50"
              >
                Max
              </button>
            </div>

            {withdrawSource === 'USDC' && parseFloat(withdrawAmount) > 0 && (
              <p className="text-xs text-emerald-700 font-medium mt-1.5 flex items-center justify-between">
                <span>Estimated Bank Deposit:</span>
                <span className="font-bold text-sm">
                  {formatNgn(parseFloat(withdrawAmount) * exchangeRate)}
                </span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Destination Bank Account
            </label>
            <select
              value={selectedBankId}
              onChange={(e) => setSelectedBankId(e.target.value)}
              className="w-full text-xs sm:text-sm py-2 px-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            >
              <option value="">Select linked bank...</option>
              {bankAccounts.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bankName} - {b.accountNumber} ({b.accountName})
                </option>
              ))}
            </select>
          </div>

          {withdrawError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{withdrawError}</span>
            </div>
          )}

          {withdrawSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{withdrawSuccessMsg}</span>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsWithdrawModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isWithdrawing}
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              {withdrawSource === 'NGN' ? 'Confirm Withdrawal' : 'Cash Out to Bank'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Bank Modal with Live Paystack NUBAN Resolution */}
      <Modal
        isOpen={isBankModalOpen}
        onClose={() => {
          setIsBankModalOpen(false);
          setIsBankResolved(false);
          setBankError(null);
        }}
        title="Link Bank Account"
      >
        <form onSubmit={handleLinkBank} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Select Bank</label>
            <select
              value={bankCode}
              onChange={(e) => {
                setBankCode(e.target.value);
                const bank = nigerianBanks.find((b) => b.value === e.target.value);
                if (bank) setBankName(bank.name);
              }}
              className="w-full text-xs sm:text-sm py-2 px-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {nigerianBanks.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Account Number (10 digits)</label>
            <div className="relative">
              <Input
                type="text"
                maxLength={10}
                placeholder="0123456789"
                value={accountNumber}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, '');
                  setAccountNumber(clean);
                }}
                required
              />
              {isResolvingBank && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-indigo-600">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Verifying...</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-700">Account Name</label>
              {isBankResolved && (
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-emerald-600" />
                  Verified via Paystack NUBAN
                </span>
              )}
            </div>
            <Input
              type="text"
              placeholder={isResolvingBank ? 'Resolving registered account name...' : 'Account name as registered with bank'}
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              required
            />
          </div>

          {bankError && (
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{bankError}</p>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBankModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isAddingBank}
              disabled={isResolvingBank}
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              Save Bank
            </Button>
          </div>
        </form>
      </Modal>

      {/* Link / Manage Monad EVM Wallet Modal */}
      <Modal
        isOpen={isWalletModalOpen}
        onClose={() => {
          setIsWalletModalOpen(false);
          setWalletModalError(null);
          setWalletModalSuccess(null);
        }}
        title="Manage Monad EVM Wallet"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-indigo-50/80 border border-indigo-100 rounded-xl text-xs text-indigo-950 space-y-1.5">
            <p className="font-semibold flex items-center gap-1.5 text-indigo-900">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Direct Smart Contract Settlement Address
            </p>
            <p className="text-[11px] text-indigo-700 leading-relaxed">
              Your Monad EVM address receives on-chain milestone escrow deposits, USDC earnings, and direct contract payouts.
            </p>
          </div>

          {address ? (
            <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">Currently Linked Address:</span>
                <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0 border-0">
                  {walletType === 'EXTERNAL_METAMASK' ? 'MetaMask' : 'Linked EVM'}
                </Badge>
              </div>
              <div className="font-mono text-xs text-gray-800 break-all p-2.5 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between gap-2">
                <span>{address}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={handleCopyAddress} className="p-1 hover:bg-gray-200 rounded text-gray-500" title="Copy Address">
                    {isCopied ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <a href={`${MONAD_EXPLORER_URL}/address/${address}`} target="_blank" rel="noreferrer" className="p-1 hover:bg-gray-200 rounded text-gray-500" title="View on Explorer">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setWalletModalError(null);
                  setWalletModalSuccess(null);
                  setIsUnlinkModalOpen(true);
                }}
                isLoading={isLinkingWallet}
                className="w-full text-xs text-red-600 border-red-200 hover:bg-red-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Unlink className="w-3.5 h-3.5" />
                Unlink This Address
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                onClick={handleConnectWeb3}
                isLoading={isLinkingWallet}
                className="w-full text-xs font-semibold py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2"
              >
                <WalletIcon className="w-4 h-4" />
                Connect via MetaMask / Browser Wallet
              </Button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-3 text-gray-400 text-xs uppercase font-medium">Or paste manually</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <form onSubmit={handleManualLinkWallet} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Monad EVM Address (0x...)
                  </label>
                  <Input
                    type="text"
                    placeholder="0x71C...3a9B (42 characters)"
                    value={inputWalletAddress}
                    onChange={(e) => setInputWalletAddress(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  isLoading={isLinkingWallet}
                  variant="outline"
                  className="w-full text-xs font-semibold py-2 text-indigo-700 border-indigo-300 hover:bg-indigo-50"
                >
                  Save & Bind Wallet Address
                </Button>
              </form>
            </div>
          )}

          {walletModalError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{walletModalError}</span>
            </div>
          )}

          {walletModalSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{walletModalSuccess}</span>
            </div>
          )}
        </div>
      </Modal>

      {/* Unlink Wallet Confirmation Modal */}
      <Modal
        isOpen={isUnlinkModalOpen}
        onClose={() => !isLinkingWallet && setIsUnlinkModalOpen(false)}
        title="Unlink Web3 Wallet"
        description="Disconnect and unbind your Monad EVM address from your Fixmate profile."
        maxWidth="md"
      >
        <div className="space-y-4">
          {walletModalError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between">
              <span>{walletModalError}</span>
              <button onClick={() => setWalletModalError(null)} className="font-bold ml-2">×</button>
            </div>
          )}

          {walletModalSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{walletModalSuccess}</span>
            </div>
          )}

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Currently Linked:</span>
              <span className="font-semibold text-gray-700">
                {isEmbedded ? 'Privy Embedded' : walletType === 'EXTERNAL_METAMASK' ? 'MetaMask' : 'Linked EVM'}
              </span>
            </div>
            <div className="font-mono text-xs text-gray-800 break-all p-2.5 bg-white rounded-lg border border-gray-200">
              {address}
            </div>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed">
            Unlinking removes this wallet address from your Fixmate profile. You will not receive automatic on-chain milestone escrow payouts to this wallet until you connect or link an address again. Already completed or pending bank withdrawals are unaffected.
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsUnlinkModalOpen(false)}
              disabled={isLinkingWallet}
              className="rounded-xl text-xs font-semibold px-4 py-2 border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUnlinkWallet}
              isLoading={isLinkingWallet}
              className="rounded-xl text-xs font-semibold px-4 py-2 bg-red-600 hover:bg-red-500 text-white flex items-center gap-1.5 cursor-pointer"
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>Confirm Unlink</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Direct Send USDC Modal */}
      <Modal
        isOpen={isSendUsdcModalOpen}
        onClose={() => {
          setIsSendUsdcModalOpen(false);
          setSendUsdcError(null);
          setSendUsdcTxHash(null);
        }}
        title="Send USDC to External Wallet"
      >
        <form onSubmit={handleSendUsdc} className="space-y-4">
          <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900">
            <p className="font-semibold flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-indigo-600" />
              On-Chain Monad Token Transfer
            </p>
            <p className="mt-1 text-slate-600 text-[11px] leading-relaxed">
              Send your Monad ERC-20 USDC to any external wallet (e.g. Binance, Bybit, MetaMask, hardware cold storage).
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Recipient EVM Address (0x...)
            </label>
            <Input
              type="text"
              placeholder="0x..."
              value={sendRecipientAddress}
              onChange={(e) => setSendRecipientAddress(e.target.value)}
              required
              className="font-mono text-xs"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-700">Amount to Send</label>
              <span className="text-[11px] text-gray-500">
                Available: <strong className="text-gray-900">${parseFloat(usdcBalance).toFixed(2)} USDC</strong>
              </span>
            </div>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                min="0.5"
                placeholder="0.00"
                value={sendUsdcAmount}
                onChange={(e) => setSendUsdcAmount(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setSendUsdcAmount(parseFloat(usdcBalance).toString())}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-indigo-600 font-semibold px-2 py-0.5 rounded hover:bg-indigo-50"
              >
                Max
              </button>
            </div>
          </div>

          {sendUsdcError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{sendUsdcError}</span>
            </div>
          )}

          {sendUsdcTxHash && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>USDC Transfer Successful!</span>
              </div>
              <p className="text-[11px] text-emerald-700 font-mono truncate">Tx: {sendUsdcTxHash}</p>
              <a
                href={`${MONAD_EXPLORER_URL}/tx/${sendUsdcTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-emerald-800 font-bold underline mt-1 text-[11px]"
              >
                <span>View on Monad Explorer</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSendUsdcModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSendingUsdc}
              disabled={isSendingUsdc}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
            >
              Confirm Transfer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WalletPage;
