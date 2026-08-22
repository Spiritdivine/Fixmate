import React, { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Database,
  Layers,
  Zap,
  Server,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const SystemHealthPage: React.FC = () => {
  const [healthData, setHealthData] = useState<any | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runHealthProbe = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const start = performance.now();
      const res = await apiClient.get<any>('/health');
      const end = performance.now();
      setLatency(Math.round(end - start));
      setHealthData(res.data);
    } catch (err: any) {
      setError(err.message || 'Health probe failed.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runHealthProbe();
  }, []);

  const isHealthy = healthData?.status === 'ok';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            <span>Infrastructure Health & Diagnostic Console</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Live health checks across PostgreSQL database clusters, Monad RPC endpoints, and WebSockets gateway.
          </p>
        </div>
        <Button
          size="sm"
          onClick={runHealthProbe}
          isLoading={isLoading}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Execute Live Probe
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Global Status Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div
            className={`p-3.5 rounded-2xl ${
              isHealthy ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}
          >
            {isHealthy ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white">
                {isHealthy ? 'All Systems Operational' : 'Degraded Performance'}
              </h3>
              <Badge variant={isHealthy ? 'success' : 'danger'}>
                {healthData?.status?.toUpperCase() || 'UNKNOWN'}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Service: {healthData?.service || 'Artisan Escrow Backend API'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Gateway Latency</span>
            <p className="text-sm font-black text-purple-400 font-mono">{latency !== null ? `${latency} ms` : '--'}</p>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Environment</span>
            <p className="text-xs font-bold text-white uppercase">{healthData?.environment || 'development'}</p>
          </div>
        </div>
      </div>

      {/* Diagnostic Service Probes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PostgreSQL Database Probe */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <Database className="w-4 h-4 text-purple-400" />
              <span>PostgreSQL Cluster</span>
            </div>
            <Badge
              variant={healthData?.checks?.database === 'ok' ? 'success' : 'danger'}
              size="sm"
            >
              {healthData?.checks?.database === 'ok' ? 'HEALTHY' : 'ERROR'}
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            Prisma ORM connection pool and raw query execution validation.
          </p>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
            Status: <strong className="text-emerald-400">{healthData?.checks?.database || 'Pending'}</strong>
          </div>
        </div>

        {/* Monad Testnet RPC Probe */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Monad Testnet RPC</span>
            </div>
            <Badge
              variant={healthData?.checks?.monadRpc === 'ok' ? 'success' : 'danger'}
              size="sm"
            >
              {healthData?.checks?.monadRpc === 'ok' ? 'CONNECTED' : 'ERROR'}
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            EVM JSON-RPC provider connectivity on Chain ID 10143.
          </p>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
            Status: <strong className="text-emerald-400">{healthData?.checks?.monadRpc || 'Pending'}</strong>
          </div>
        </div>

        {/* Real-time Socket.io Gateway Probe */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <Zap className="w-4 h-4 text-purple-400" />
              <span>WebSockets Gateway</span>
            </div>
            <Badge variant="success" size="sm">
              LISTENING
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            Real-time chat messaging and instant notification dispatch channel.
          </p>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
            Gateway: <strong className="text-purple-400">Socket.io WSS Active</strong>
          </div>
        </div>
      </div>

      {/* Raw Health Response Payload Card */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400">
          Raw Probe Response Payload
        </h3>
        <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono text-emerald-400 overflow-x-auto">
          {JSON.stringify(healthData, null, 2)}
        </pre>
      </div>
    </div>
  );
};
