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
 Download,
 AlertCircle,
 Clock,
 Sparkles,
 ShieldCheck,
 RefreshCw,
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

export const WalletPage: React.FC = () => {
 const [wallet, setWallet] = useState<Wallet | null>(null);
 const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
 const [transactions, setTransactions] = useState<Transaction[]>([]);
 const [isLoading, setIsLoading] = useState(true);

 // Link Bank Modal State
 const [isBankModalOpen, setIsBankModalOpen] = useState(false);
 const [bankName, setBankName] = useState('GTBank');
 const [bankCode, setBankCode] = useState('058');
 const [accountNumber, setAccountNumber] = useState('');
 const [accountName, setAccountName] = useState('');
 const [isAddingBank, setIsAddingBank] = useState(false);
 const [bankError, setBankError] = useState<string | null>(null);

 // Withdrawal Modal State
 const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
 const [selectedBankId, setSelectedBankId] = useState<string>('');
 const [withdrawAmount, setWithdrawAmount] = useState('');
 const [isWithdrawing, setIsWithdrawing] = useState(false);
 const [withdrawError, setWithdrawError] = useState<string | null>(null);

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

 const fetchWalletData = async () => {
 try {
 setIsLoading(true);
 const [walletRes, banksRes] = await Promise.all([
 apiClient.get('/wallets/my-wallet'),
 apiClient.get('/wallets/bank-accounts'),
 ]);

 setWallet(walletRes.data.data);
 setTransactions(walletRes.data.data.transactions || []);
 setBankAccounts(banksRes.data.data || []);

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

 useEffect(() => {
 fetchWalletData();
 }, []);

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

 const handleRequestWithdrawal = async (e: React.FormEvent) => {
 e.preventDefault();
 const numericAmount = parseFloat(withdrawAmount);
 if (!numericAmount || numericAmount <= 0) {
 setWithdrawError('Enter a valid withdrawal amount');
 return;
 }

 if (!selectedBankId) {
 setWithdrawError('Please select or link a bank account for payout');
 return;
 }

 try {
 setIsWithdrawing(true);
 setWithdrawError(null);

 await apiClient.post('/wallets/withdraw', {
 bankAccountId: selectedBankId,
 amount: numericAmount,
 });

 setIsWithdrawModalOpen(false);
 setWithdrawAmount('');
 await fetchWalletData();
 } catch (err) {
 setWithdrawError(getErrorMessage(err));
 } finally {
 setIsWithdrawing(false);
 }
 };

 const handleSimulateDeposit = async () => {
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

 const exportStatementCSV = () => {
 const headers = ['Reference', 'Date', 'Type', 'Amount (NGN)', 'Net (NGN)', 'Status', 'Description'];
 const rows = transactions.map((tx) => [
 tx.reference,
 formatDateTime(tx.createdAt),
 tx.type,
 tx.amount,
 tx.netAmount,
 tx.status,
 `"${tx.description.replace(/"/g, '""')}"`,
 ]);

 const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
 const encodedUri = encodeURI(csvContent);
 const link = document.createElement('a');
 link.setAttribute('href', encodedUri);
 link.setAttribute('download', `Fixmate_Artisan_Statement_${new Date().toISOString().slice(0, 10)}.csv`);
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 };

 return (
 <div className="space-y-6">
 {/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
 <div>
 <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
 Artisan Wallet & Payout Center
 </h1>
 <p className="text-sm text-slate-500 mt-1">
 View cleared balances, manage Nigerian bank payout destinations, and audit your financial statements.
 </p>
 </div>
 <div className="flex items-center gap-3">
 <button
 onClick={handleSimulateDeposit}
 disabled={isTopUpLoading}
 className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-full text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
 >
 <Plus className="w-4 h-4" />
 <span>Dev Test Funds (+₦50k)</span>
 </button>
 <button
 onClick={() => setIsWithdrawModalOpen(true)}
 className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-full text-sm font-semibold transition-colors shadow-sm"
 >
 <ArrowUpRight className="w-4 h-4" />
 <span>Withdraw to Bank</span>
 </button>
 </div>
 </div>

 {/* Balances Grid */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <Card className="flex flex-col justify-between">
 <div className="flex items-center justify-between text-slate-500 mb-2">
 <span className="text-xs font-semibold uppercase tracking-wider">Available for Payout</span>
 <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
 <WalletIcon className="w-4 h-4" />
 </div>
 </div>
 <div>
 <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
 {formatNgn(wallet?.availableBalance)}
 </div>
 <p className="text-xs text-slate-400 mt-1">Ready for 24/7 bank transfer</p>
 </div>
 </Card>

 <Card className="flex flex-col justify-between">
 <div className="flex items-center justify-between text-slate-500 mb-2">
 <span className="text-xs font-semibold uppercase tracking-wider">Locked in Active Escrow</span>
 <div className="p-2 rounded-xl bg-[#186644]/10 text-emerald-600">
 <Lock className="w-4 h-4" />
 </div>
 </div>
 <div>
 <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
 {formatNgn(wallet?.escrowLockedBalance)}
 </div>
 <p className="text-xs text-slate-400 mt-1">Releases upon client milestone approval</p>
 </div>
 </Card>

 <Card className="flex flex-col justify-between">
 <div className="flex items-center justify-between text-slate-500 mb-2">
 <span className="text-xs font-semibold uppercase tracking-wider">Settlement Currency</span>
 <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
 <ShieldCheck className="w-4 h-4" />
 </div>
 </div>
 <div>
 <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
 NGN (₦) / Monad
 </div>
 <p className="text-xs text-slate-400 mt-1">Automatic 0% withdrawal processing fee</p>
 </div>
 </Card>
 </div>

 {/* Linked Bank Accounts Card */}
 <Card>
 <CardHeader>
 <div>
 <CardTitle>Linked Bank Accounts ({bankAccounts.length})</CardTitle>
 <CardDescription>
 Direct bank accounts used to receive instant payout withdrawals.
 </CardDescription>
 </div>
 <Button
 size="sm"
 variant="outline"
 onClick={() => setIsBankModalOpen(true)}
 leftIcon={<Plus className="w-4 h-4" />}
 >
 Add Bank Account
 </Button>
 </CardHeader>

 {bankAccounts.length === 0 ? (
 <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-[24px] border border-dashed border-slate-200 ">
 <Building2 className="w-8 h-8 mx-auto text-slate-400 mb-2" />
 <p className="font-semibold text-slate-700 dark:text-slate-300">No bank account linked</p>
 <p className="text-slate-400 mt-1">Link your Nigerian bank account to withdraw earnings.</p>
 <Button
 size="sm"
 variant="secondary"
 className="mt-3"
 onClick={() => setIsBankModalOpen(true)}
 >
 Link Account Now
 </Button>
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
 {bankAccounts.map((bank) => (
 <div
 key={bank.id}
 className={`p-4 rounded-[24px] border transition-all ${
 bank.isDefault
 ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-600/40 shadow-xs'
 : 'bg-white border-slate-200 '
 }`}
 >
 <div className="flex items-start justify-between">
 <div className="space-y-0.5">
 <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{bank.bankName}</p>
 <p className="text-xs font-mono text-slate-500">{bank.accountNumber}</p>
 <p className="text-xs font-medium text-slate-700 dark:text-slate-300 pt-1">
 {bank.accountName}
 </p>
 </div>
 <button
 onClick={() => handleDeleteBank(bank.id)}
 className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
 title="Remove bank"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>

 <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
 {bank.isDefault ? (
 <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
 <CheckCircle className="w-3.5 h-3.5" /> Primary Payout
 </span>
 ) : (
 <button
 onClick={() => handleSetDefaultBank(bank.id)}
 className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 underline font-medium"
 >
 Set as Default
 </button>
 )}
 <Badge variant="emerald">Verified</Badge>
 </div>
 </div>
 ))}
 </div>
 )}
 </Card>

 {/* Transaction Statement Table */}
 <Card>
 <CardHeader>
 <div>
 <CardTitle>Financial Audit Statement & Ledger</CardTitle>
 <CardDescription>Detailed history of milestone releases, withdrawals, and fee deductions.</CardDescription>
 </div>
 <Button
 variant="outline"
 size="sm"
 onClick={exportStatementCSV}
 leftIcon={<Download className="w-4 h-4" />}
 >
 Export CSV
 </Button>
 </CardHeader>

 {transactions.length === 0 ? (
 <p className="text-xs text-slate-400 text-center py-8">
 No transactions recorded yet. Completed contract payouts will appear here.
 </p>
 ) : (
 <div className="space-y-3 mt-4">
 {transactions.map((tx) => {
 const isCredit = Number(tx.netAmount) > 0;

 return (
 <div key={tx.id} className="flex items-center justify-between p-4 rounded-[20px] bg-slate-50 hover:bg-slate-100 transition-colors">
 <div className="flex items-center gap-4 min-w-0">
 <div className={`p-3 rounded-2xl shrink-0 ${isCredit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
 {isCredit ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
 </div>
 <div className="min-w-0">
 <h4 className="text-sm font-bold text-slate-900 truncate">
 {tx.type.replace('_', ' ')}
 </h4>
 <p className="text-xs text-slate-500 truncate mt-0.5">
 {tx.description} • {formatDateTime(tx.createdAt)}
 </p>
 </div>
 </div>
 
 <div className="text-right shrink-0">
 <div className={`text-base font-extrabold ${isCredit ? 'text-emerald-600' : 'text-slate-900'}`}>
 {isCredit ? '+' : ''}{formatNgn(tx.netAmount)}
 </div>
 <div className="mt-1">
 <Badge status={tx.status}>{tx.status}</Badge>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </Card>

 {/* Link Bank Account Modal */}
 <Modal
 isOpen={isBankModalOpen}
 onClose={() => setIsBankModalOpen(false)}
 title="Link Nigerian Bank Account"
 description="Add a verified account for fast direct withdrawals."
 >
 <form onSubmit={handleLinkBank} className="space-y-4">
 {bankError && (
 <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
 {bankError}
 </div>
 )}

 <Select
 label="Select Bank"
 options={nigerianBanks.map((b) => ({ value: b.value, label: b.label }))}
 value={bankCode}
 onChange={(e) => setBankCode(e.target.value)}
 />

 <Input
 label="10-Digit Account Number"
 type="text"
 maxLength={10}
 placeholder="0123456789"
 value={accountNumber}
 onChange={(e) => setAccountNumber(e.target.value)}
 required
 />

 <Input
 label="Account Name (As Registered with Bank)"
 type="text"
 placeholder="e.g. Johnathan Doe"
 value={accountName}
 onChange={(e) => setAccountName(e.target.value)}
 required
 />

 <div className="flex justify-end gap-2 pt-2">
 <Button type="button" variant="secondary" onClick={() => setIsBankModalOpen(false)}>
 Cancel
 </Button>
 <Button type="submit" isLoading={isAddingBank}>
 Save Bank Account
 </Button>
 </div>
 </form>
 </Modal>

 {/* Request Payout Withdrawal Modal */}
 <Modal
 isOpen={isWithdrawModalOpen}
 onClose={() => setIsWithdrawModalOpen(false)}
 title="Withdraw Funds to Bank"
 description="Transfer your cleared available balance directly to your bank account."
 >
 <form onSubmit={handleRequestWithdrawal} className="space-y-4">
 {withdrawError && (
 <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
 {withdrawError}
 </div>
 )}

 <div className="p-3.5 rounded-[24px] bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between">
 <span className="text-slate-600 dark:text-slate-300">Available Balance:</span>
 <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
 {formatNgn(wallet?.availableBalance)}
 </span>
 </div>

 <Select
 label="Destination Bank Account"
 options={bankAccounts.map((b) => ({
 value: b.id,
 label: `${b.bankName} - ${b.accountNumber} (${b.accountName})`,
 }))}
 value={selectedBankId}
 onChange={(e) => setSelectedBankId(e.target.value)}
 />

 <div className="space-y-1.5">
 <div className="flex items-center justify-between">
 <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
 Withdrawal Amount (₦)
 </label>
 <button
 type="button"
 onClick={() => setWithdrawAmount(String(wallet?.availableBalance || '0'))}
 className="text-xs text-emerald-600 font-bold hover:underline"
 >
 Max Amount
 </button>
 </div>
 <Input
 type="number"
 placeholder="e.g. 50000"
 value={withdrawAmount}
 onChange={(e) => setWithdrawAmount(e.target.value)}
 required
 />
 </div>

 <div className="p-3 rounded-xl bg-slate-50 text-xs space-y-1 text-slate-500">
 <div className="flex justify-between">
 <span>Withdrawal Processing Fee:</span>
 <span className="font-semibold text-emerald-500">₦0.00 (Free)</span>
 </div>
 <div className="flex justify-between">
 <span>Estimated Settlement:</span>
 <span className="font-semibold text-slate-700 dark:text-slate-300">Within 15 minutes</span>
 </div>
 </div>

 <div className="flex justify-end gap-2 pt-2">
 <Button type="button" variant="secondary" onClick={() => setIsWithdrawModalOpen(false)}>
 Cancel
 </Button>
 <Button type="submit" isLoading={isWithdrawing} leftIcon={<ArrowUpRight className="w-4 h-4" />}>
 Confirm Payout
 </Button>
 </div>
 </form>
 </Modal>
 </div>
 );
};
