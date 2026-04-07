import { useState, type FormEvent } from 'react';
import { Loader2, X } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import type { ConnectionCreatePayload } from './types';

const ADAPTER_OPTIONS = [
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'oracle', label: 'Oracle' },
  { value: 'dynamodb', label: 'AWS DynamoDB' },
  { value: 'spanner', label: 'GCP Spanner' },
  { value: 'cosmosdb', label: 'Azure Cosmos DB' },
  { value: 'bigquery', label: 'GCP BigQuery' },
];

export function ConnectionForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [adapterKind, setAdapterKind] = useState('postgresql');
  const [host, setHost] = useState('');
  const [port, setPort] = useState<string>('');
  const [database, setDatabase] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const payload: ConnectionCreatePayload = {
      name,
      adapter_kind: adapterKind,
      host: host || undefined,
      port: port ? Number(port) : undefined,
      database: database || undefined,
      username: username || undefined,
      password: password || undefined,
    };
    try {
      await apiClient.createConnection(payload);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-lg bg-dui-surface border border-dui-border shadow-xl">
        <header className="flex items-center justify-between border-b border-dui-border px-4 py-3">
          <h3 className="text-sm font-semibold text-dui-text-primary">New connection</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-dui-text-secondary hover:bg-dui-surface-secondary focus:outline-none dui-focus-ring"
          >
            <X size={14} />
          </button>
        </header>
        <form className="space-y-3 px-4 py-4" onSubmit={handleSubmit}>
          <Field label="Name" value={name} onChange={setName} required />
          <label className="block text-xs font-medium text-dui-text-secondary">
            Adapter
            <select
              value={adapterKind}
              onChange={(e) => setAdapterKind(e.target.value)}
              className="mt-1 w-full text-sm bg-dui-surface border border-dui-border rounded-md px-3 py-1.5 focus:outline-none dui-focus-ring text-dui-text-primary"
            >
              {ADAPTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <Field label="Host" value={host} onChange={setHost} />
            </div>
            <Field label="Port" value={port} onChange={setPort} type="number" />
          </div>
          <Field label="Database" value={database} onChange={setDatabase} />
          <Field label="Username" value={username} onChange={setUsername} />
          <Field
            label="Password"
            value={password}
            onChange={setPassword}
            type="password"
          />

          {error && (
            <div role="alert" className="text-xs text-dui-danger">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-dui-border px-3 py-1.5 text-sm text-dui-text-secondary hover:bg-dui-surface-secondary focus:outline-none dui-focus-ring"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-md bg-dui-primary text-dui-on-primary px-3 py-1.5 text-sm font-medium disabled:opacity-60 focus:outline-none dui-focus-ring"
            >
              {submitting && <Loader2 size={12} className="animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-medium text-dui-text-secondary">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-1 w-full text-sm bg-dui-surface border border-dui-border rounded-md px-3 py-1.5 focus:outline-none dui-focus-ring text-dui-text-primary"
      />
    </label>
  );
}
