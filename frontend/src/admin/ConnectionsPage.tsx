import { useEffect, useState } from 'react';
import { Loader2, Plus, RefreshCw, Trash2, PlayCircle } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import type { ConnectionRead } from './types';
import { ConnectionForm } from './ConnectionForm';

/**
 * Tenant DB Connections — list, create, delete and run a connectivity test.
 *
 * Loads on mount and re-fetches after every mutation. There is no React
 * Query usage here on purpose — the admin views are infrequent enough that
 * spinning up a separate cache namespace would just bloat the bundle.
 */
export function ConnectionsPage() {
  const [items, setItems] = useState<ConnectionRead[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function refresh() {
    setError(null);
    try {
      setItems(await apiClient.listConnections());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this connection? Encrypted credentials will be erased.')) return;
    setBusyId(id);
    try {
      await apiClient.deleteConnection(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusyId(null);
    }
  }

  async function handleTest(id: string) {
    setBusyId(id);
    try {
      const result = await apiClient.testConnection(id);
      if (!result.ok) setError(`Test failed: ${result.error ?? 'unknown error'}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test failed');
    } finally {
      await refresh();
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-dui-text-primary">Database Connections</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-1 rounded-md border border-dui-border px-2.5 py-1 text-xs font-medium text-dui-text-secondary hover:bg-dui-surface-secondary focus:outline-none dui-focus-ring"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1 rounded-md bg-dui-primary text-dui-on-primary px-2.5 py-1 text-xs font-medium focus:outline-none dui-focus-ring"
          >
            <Plus size={12} />
            New
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" className="text-xs text-dui-danger">
          {error}
        </div>
      )}

      {items === null ? (
        <div className="flex justify-center py-6">
          <Loader2 size={16} className="text-dui-text-muted animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-dui-text-muted py-6 text-center">
          No connections yet. Click <em>New</em> to register one.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-dui-border">
          <table className="min-w-full text-sm">
            <thead className="bg-dui-surface-secondary text-dui-text-secondary">
              <tr>
                <Th>Name</Th>
                <Th>Adapter</Th>
                <Th>Host</Th>
                <Th>Status</Th>
                <Th>Last tested</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dui-border bg-dui-surface">
              {items.map((c) => (
                <tr key={c.id}>
                  <Td className="font-medium text-dui-text-primary">{c.name}</Td>
                  <Td>{c.adapter_kind}</Td>
                  <Td>{c.host ?? '—'}</Td>
                  <Td>
                    <StatusBadge status={c.status} />
                  </Td>
                  <Td>
                    {c.last_tested_at
                      ? new Date(c.last_tested_at).toLocaleString()
                      : '—'}
                  </Td>
                  <Td className="text-right whitespace-nowrap">
                    <ActionButton
                      label="Test"
                      icon={<PlayCircle size={12} />}
                      disabled={busyId === c.id}
                      onClick={() => handleTest(c.id)}
                    />
                    <ActionButton
                      label="Delete"
                      icon={<Trash2 size={12} />}
                      disabled={busyId === c.id}
                      onClick={() => handleDelete(c.id)}
                      tone="danger"
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ConnectionForm
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            void refresh();
          }}
        />
      )}
    </section>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`text-left text-[11px] uppercase tracking-wide font-semibold px-3 py-2 ${className}`}
    >
      {children}
    </th>
  );
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 text-dui-text-secondary ${className}`}>{children}</td>;
}

function StatusBadge({ status }: { status: ConnectionRead['status'] }) {
  const color =
    status === 'ok'
      ? 'text-dui-success'
      : status === 'error'
        ? 'text-dui-danger'
        : 'text-dui-text-muted';
  return <span className={`text-xs font-medium ${color}`}>{status}</span>;
}

function ActionButton({
  label,
  icon,
  onClick,
  disabled,
  tone = 'default',
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'default' | 'danger';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ml-1 focus:outline-none dui-focus-ring',
        tone === 'danger'
          ? 'text-dui-danger hover:bg-dui-surface-secondary'
          : 'text-dui-text-secondary hover:bg-dui-surface-secondary',
        disabled ? 'opacity-50' : '',
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
  );
}
