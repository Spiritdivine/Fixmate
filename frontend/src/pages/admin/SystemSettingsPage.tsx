import React, { useEffect, useState } from 'react';
import {
  Sliders,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Edit2,
  Key,
  Layers,
  Lock,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { formatDate } from '../../lib/formatters';
import { ApiResponse, SystemSetting } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';

export const SystemSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Edit Modal State
  const [selectedKey, setSelectedKey] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.get<ApiResponse<SystemSetting[]>>('/admin/settings');
      if (res.data.success) {
        setSettings(res.data.data);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const openEditModal = (key: string, currentValue: string, desc?: string | null) => {
    setSelectedKey(key);
    setEditValue(currentValue);
    setEditDesc(desc || '');
    setModalOpen(true);
  };

  const handleSaveSetting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKey) return;

    try {
      setIsEditing(true);
      setError(null);
      setSuccessMessage(null);

      const res = await apiClient.put<ApiResponse<SystemSetting>>(`/admin/settings/${selectedKey}`, {
        value: editValue.trim(),
        description: editDesc.trim() || undefined,
      });

      if (res.data.success) {
        setSettings((prev) =>
          prev.map((s) => (s.key === selectedKey ? res.data.data : s))
        );
        setSuccessMessage(`Setting "${selectedKey}" updated successfully.`);
        setModalOpen(false);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-purple-400" />
            <span>Dynamic Platform Configuration</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Runtime platform variables, escrow commission percentages, withdrawal thresholds, and Monad RPC parameters.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchSettings}
          className="font-bold text-xs"
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Parameters
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Preset System Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Platform Fee Parameter */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-sm">Escrow Platform Fee</span>
            <Badge variant="purple" size="sm">PLATFORM_FEE_PERCENT</Badge>
          </div>
          <p className="text-xs text-slate-400">
            Percentage deducted automatically by smart contract and fiat ledger on milestone release.
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-xl font-black text-purple-400">
              {settings.find((s) => s.key === 'PLATFORM_FEE_PERCENT')?.value || '5.00'}%
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                openEditModal(
                  'PLATFORM_FEE_PERCENT',
                  settings.find((s) => s.key === 'PLATFORM_FEE_PERCENT')?.value || '5.00',
                  'Base platform commission percent'
                )
              }
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            >
              Modify
            </Button>
          </div>
        </div>

        {/* Minimum Payout Amount */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-sm">Minimum Payout Withdrawal</span>
            <Badge variant="purple" size="sm">MIN_WITHDRAWAL_AMOUNT</Badge>
          </div>
          <p className="text-xs text-slate-400">
            Minimum threshold allowed for artisan bank account withdrawal requests.
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-xl font-black text-emerald-400">
              ₦{settings.find((s) => s.key === 'MIN_WITHDRAWAL_AMOUNT')?.value || '1,000'}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                openEditModal(
                  'MIN_WITHDRAWAL_AMOUNT',
                  settings.find((s) => s.key === 'MIN_WITHDRAWAL_AMOUNT')?.value || '1000',
                  'Minimum payout amount in NGN'
                )
              }
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            >
              Modify
            </Button>
          </div>
        </div>

        {/* Dispute Evidence Window */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-sm">Dispute Evidence Window</span>
            <Badge variant="purple" size="sm">DISPUTE_WINDOW_DAYS</Badge>
          </div>
          <p className="text-xs text-slate-400">
            Number of days counterparties have to submit supplementary proof before arbitration judgment.
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-xl font-black text-white">
              {settings.find((s) => s.key === 'DISPUTE_WINDOW_DAYS')?.value || '3'} Days
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                openEditModal(
                  'DISPUTE_WINDOW_DAYS',
                  settings.find((s) => s.key === 'DISPUTE_WINDOW_DAYS')?.value || '3',
                  'Days allowed for evidence submission'
                )
              }
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            >
              Modify
            </Button>
          </div>
        </div>

        {/* Monad Chain ID & RPC */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-sm">Monad Network Chain ID</span>
            <Badge variant="purple" size="sm">MONAD_CHAIN_ID</Badge>
          </div>
          <p className="text-xs text-slate-400">
            EVM Network ID for smart contract escrow interactions (Monad Testnet).
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-xl font-black text-purple-400 font-mono">
              10143
            </span>
            <Badge variant="success" size="sm">Verified</Badge>
          </div>
        </div>
      </div>

      {/* All Dynamic System Parameters Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">All System Parameter Records</h3>
          <Button
            size="sm"
            onClick={() => openEditModal('', '', '')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
          >
            + Add Custom Parameter
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Parameter Key</th>
                <th className="py-3.5 px-4">Value</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Last Updated</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading system parameters...
                  </td>
                </tr>
              ) : settings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No custom parameters registered.
                  </td>
                </tr>
              ) : (
                settings.map((s) => (
                  <tr key={s.key} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-300">
                      {s.key}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white font-mono">
                      {s.value}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                      {s.description || 'System parameter'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[10px]">
                      {formatDate(s.updatedAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(s.key, s.value, s.description)}
                        leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedKey ? `Update Setting: ${selectedKey}` : 'Register New System Setting'}
      >
        <form onSubmit={handleSaveSetting} className="space-y-4 text-xs">
          {!selectedKey && (
            <Input
              label="Setting Key (UPPERCASE_SNAKE_CASE)"
              placeholder="e.g. MAXIMUM_DISPUTE_LIMIT"
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
              required
            />
          )}

          <Input
            label="Setting Value"
            placeholder="e.g. 5.00 or 1000"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            required
          />

          <Textarea
            label="Description & Purpose"
            placeholder="Document what this parameter controls in the application runtime..."
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            rows={2}
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isEditing} className="bg-purple-600 text-white font-bold">
              Save Parameter
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
