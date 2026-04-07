import { useEffect, useState } from 'react';
import { Loader2, Save, RefreshCw, Trash2 } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import type { RegistryEntrySummary, RegistryResourceType } from './types';

const TYPES: { value: RegistryResourceType; label: string }[] = [
  { value: 'skill', label: 'Skills' },
  { value: 'enum', label: 'Enums' },
  { value: 'pattern', label: 'Patterns' },
  { value: 'widget', label: 'Widgets' },
];

/**
 * Tenant YAML registry browser. Members read; admins/owners can edit.
 *
 * The YAML editor is intentionally a plain textarea so the admin bundle
 * stays small. A Monaco-backed upgrade is tracked as a follow-up.
 */
export function RegistryPage() {
  const [resourceType, setResourceType] = useState<RegistryResourceType>('skill');
  const [items, setItems] = useState<RegistryEntrySummary[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [yamlSource, setYamlSource] = useState('');
  const [draftName, setDraftName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function refreshList() {
    setError(null);
    try {
      const list = await apiClient.listRegistryEntries(resourceType);
      setItems(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  }

  useEffect(() => {
    setItems(null);
    setSelected(null);
    setYamlSource('');
    setDraftName('');
    void refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceType]);

  async function openEntry(name: string) {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const entry = await apiClient.getRegistryEntry(resourceType, name);
      setSelected(name);
      setDraftName(entry.name);
      setYamlSource(entry.yaml_source);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entry');
    } finally {
      setBusy(false);
    }
  }

  function startNew() {
    setSelected(null);
    setDraftName('');
    setYamlSource('# new entry\n');
    setError(null);
    setInfo(null);
  }

  async function handleSave() {
    if (!draftName) {
      setError('name is required');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiClient.upsertRegistryEntry(resourceType, draftName, yamlSource);
      setInfo(`Saved ${draftName}`);
      await refreshList();
      setSelected(draftName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    if (!window.confirm(`Delete ${selected}?`)) return;
    setBusy(true);
    setError(null);
    try {
      await apiClient.deleteRegistryEntry(resourceType, selected);
      await refreshList();
      setSelected(null);
      setDraftName('');
      setYamlSource('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-dui-text-primary">Tenant Registry</h2>
        <button
          type="button"
          onClick={refreshList}
          className="inline-flex items-center gap-1 rounded-md border border-dui-border px-2.5 py-1 text-xs font-medium text-dui-text-secondary hover:bg-dui-surface-secondary focus:outline-none dui-focus-ring"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </header>

      <div className="flex gap-1 rounded-md bg-dui-surface p-1 border border-dui-border w-fit">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setResourceType(t.value)}
            className={[
              'px-3 py-1 text-xs font-medium rounded-md focus:outline-none dui-focus-ring',
              resourceType === t.value
                ? 'bg-dui-surface-secondary text-dui-text-primary'
                : 'text-dui-text-secondary hover:bg-dui-surface-secondary',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <aside className="col-span-1 space-y-2 border border-dui-border rounded-md p-2 bg-dui-surface">
          <button
            type="button"
            onClick={startNew}
            className="w-full inline-flex items-center justify-center gap-1 rounded-md bg-dui-primary text-dui-on-primary px-2 py-1 text-xs font-medium focus:outline-none dui-focus-ring"
          >
            New entry
          </button>
          {items === null ? (
            <div className="flex justify-center py-3">
              <Loader2 size={14} className="text-dui-text-muted animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-xs text-dui-text-muted py-2 text-center">empty</p>
          ) : (
            <ul className="space-y-1">
              {items.map((it) => (
                <li key={it.id}>
                  <button
                    type="button"
                    onClick={() => openEntry(it.name)}
                    className={[
                      'w-full text-left px-2 py-1 text-xs rounded-md focus:outline-none dui-focus-ring',
                      it.name === selected
                        ? 'bg-dui-surface-secondary text-dui-text-primary'
                        : 'text-dui-text-secondary hover:bg-dui-surface-secondary',
                    ].join(' ')}
                  >
                    {it.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <div className="col-span-2 space-y-2">
          <input
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="entry name"
            className="w-full text-sm bg-dui-surface border border-dui-border rounded-md px-3 py-1.5 focus:outline-none dui-focus-ring text-dui-text-primary"
          />
          <textarea
            value={yamlSource}
            onChange={(e) => setYamlSource(e.target.value)}
            rows={20}
            spellCheck={false}
            className="w-full text-xs font-mono bg-dui-surface border border-dui-border rounded-md p-3 focus:outline-none dui-focus-ring text-dui-text-primary"
            aria-label="YAML source"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={busy || !draftName}
              className="inline-flex items-center gap-1.5 rounded-md bg-dui-primary text-dui-on-primary px-3 py-1.5 text-xs font-medium disabled:opacity-60 focus:outline-none dui-focus-ring"
            >
              {busy ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Save
            </button>
            {selected && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-md border border-dui-border px-3 py-1.5 text-xs font-medium text-dui-danger hover:bg-dui-surface-secondary disabled:opacity-60 focus:outline-none dui-focus-ring"
              >
                <Trash2 size={12} />
                Delete
              </button>
            )}
          </div>
          {error && <div role="alert" className="text-xs text-dui-danger">{error}</div>}
          {info && <div className="text-xs text-dui-success">{info}</div>}
        </div>
      </div>
    </section>
  );
}
