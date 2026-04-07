import { useEffect, useState } from 'react';
import { Loader2, Play, RefreshCw } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import type { ConnectionRead, ScaffoldJob } from './types';

export function ScaffoldJobsPage() {
  const [jobs, setJobs] = useState<ScaffoldJob[] | null>(null);
  const [connections, setConnections] = useState<ConnectionRead[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>('');

  async function refresh() {
    setError(null);
    try {
      const [j, c] = await Promise.all([
        apiClient.listScaffoldJobs(),
        apiClient.listConnections(),
      ]);
      setJobs(j);
      setConnections(c);
      if (!selected && c.length > 0) setSelected(c[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleStart() {
    if (!selected) return;
    setBusy(true);
    try {
      await apiClient.startScaffold(selected, {});
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Start failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-dui-text-primary">Scaffold Jobs</h2>
        <button
          type="button"
          onClick={refresh}
          className="inline-flex items-center gap-1 rounded-md border border-dui-border px-2.5 py-1 text-xs font-medium text-dui-text-secondary hover:bg-dui-surface-secondary focus:outline-none dui-focus-ring"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </header>

      <div className="flex items-end gap-2">
        <label className="block text-xs font-medium text-dui-text-secondary">
          Connection
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="mt-1 text-sm bg-dui-surface border border-dui-border rounded-md px-3 py-1.5 focus:outline-none dui-focus-ring text-dui-text-primary min-w-[220px]"
          >
            {connections.length === 0 && <option value="">No connections</option>}
            {connections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.adapter_kind})
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={!selected || busy}
          onClick={handleStart}
          className="inline-flex items-center gap-1.5 rounded-md bg-dui-primary text-dui-on-primary px-3 py-1.5 text-xs font-medium disabled:opacity-60 focus:outline-none dui-focus-ring"
        >
          {busy ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
          Start scaffold
        </button>
      </div>

      {error && (
        <div role="alert" className="text-xs text-dui-danger">
          {error}
        </div>
      )}

      {jobs === null ? (
        <div className="flex justify-center py-6">
          <Loader2 size={16} className="text-dui-text-muted animate-spin" />
        </div>
      ) : jobs.length === 0 ? (
        <p className="text-sm text-dui-text-muted py-6 text-center">
          No scaffold jobs yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-dui-border">
          <table className="min-w-full text-sm">
            <thead className="bg-dui-surface-secondary text-dui-text-secondary">
              <tr>
                <Th>Job ID</Th>
                <Th>Connection</Th>
                <Th>Status</Th>
                <Th>Progress</Th>
                <Th>Updated</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dui-border bg-dui-surface">
              {jobs.map((j) => (
                <tr key={j.id}>
                  <Td className="font-mono text-xs">{j.id.slice(0, 8)}</Td>
                  <Td>
                    {connections.find((c) => c.id === j.connection_id)?.name ?? j.connection_id.slice(0, 8)}
                  </Td>
                  <Td>{j.status}</Td>
                  <Td>{j.progress}%</Td>
                  <Td>{new Date(j.updated_at).toLocaleString()}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left text-[11px] uppercase tracking-wide font-semibold px-3 py-2">
      {children}
    </th>
  );
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 text-dui-text-secondary ${className}`}>{children}</td>;
}
