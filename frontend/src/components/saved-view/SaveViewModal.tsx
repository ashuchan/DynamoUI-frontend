import { useState, useEffect, useMemo } from 'react';
import { Loader2, X, Lock, Globe } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '../../lib/apiClient';
import { queryKeys } from '../../lib/queryKeys';
import type { ExecutedResult, CreateSavedViewInput, ResultShape } from '../../lib/types';

interface SaveViewModalProps {
  executed: ExecutedResult;
  nlInput: string;
  entity?: string;
  onClose: () => void;
  onSaved?: (id: string) => void;
}

function inferResultShape(ex: ExecutedResult): ResultShape {
  const rows = ex.result.rows ?? [];
  if (rows.length === 1) return 'single';
  if (rows.length > 0 && Object.keys(rows[0] ?? {}).length <= 2) return 'aggregate';
  return 'list';
}

export function SaveViewModal({
  executed,
  nlInput,
  entity,
  onClose,
  onSaved,
}: SaveViewModalProps) {
  const [name, setName] = useState(nlInput.slice(0, 60));
  const [isShared, setIsShared] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const existing = useQuery({
    queryKey: queryKeys.savedViewList(),
    queryFn: () => apiClient.listSavedViews(),
    staleTime: 30_000,
  });

  const duplicate = useMemo(() => {
    if (!existing.data) return false;
    return existing.data.some(
      (v) => v.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );
  }, [existing.data, name]);

  useEffect(() => {
    if (duplicate) setValidationError('You already have a view with this name.');
    else setValidationError(null);
  }, [duplicate]);

  const save = useMutation({
    mutationFn: async () => {
      const body: CreateSavedViewInput = {
        name: name.trim(),
        nlInput,
        queryPlan: executed.provenance.queryPlan,
        entity: entity ?? (executed.provenance.queryPlan as { entity?: string })?.entity ?? 'unknown',
        resultShape: inferResultShape(executed),
        isShared,
      };
      return apiClient.createSavedView(body);
    },
    onSuccess: (view) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedViewList() });
      queryClient.invalidateQueries({ queryKey: queryKeys.home() });
      onSaved?.(view.id);
      onClose();
    },
    onError: (err) => {
      if (err instanceof ApiClientError && err.code === 'name_conflict') {
        setValidationError('That name is already taken. Pick another.');
      } else {
        setValidationError(err instanceof Error ? err.message : 'Save failed.');
      }
    },
  });

  const prov = executed.provenance;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || duplicate || save.isPending) return;
    save.mutate();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-view-title"
    >
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-xl border border-dui-border bg-dui-surface shadow-xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-dui-border">
          <h2 id="save-view-title" className="text-sm font-semibold text-dui-text-primary">
            Save this view
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-dui-text-muted hover:text-dui-text-secondary dui-focus-ring rounded-md p-1"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <label className="block">
            <span className="text-xs text-dui-text-muted uppercase tracking-wider">
              Name
            </span>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              className="mt-1 w-full rounded-md bg-dui-surface-tertiary border border-dui-border px-3 py-2 text-sm text-dui-text-primary placeholder:text-dui-text-muted focus:outline-none dui-focus-ring"
              placeholder="Give this view a short name"
            />
          </label>

          <div className="text-xs text-dui-text-muted">
            Based on: <span className="text-dui-text-secondary">“{nlInput}”</span>
          </div>

          <fieldset className="flex gap-2" aria-label="Visibility">
            <button
              type="button"
              onClick={() => setIsShared(false)}
              className={[
                'flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs border transition-colors',
                !isShared
                  ? 'bg-dui-surface-tertiary border-dui-primary/40 text-dui-text-primary'
                  : 'bg-transparent border-dui-border text-dui-text-secondary hover:text-dui-text-primary',
              ].join(' ')}
            >
              <Lock size={12} />
              Only me
            </button>
            <button
              type="button"
              onClick={() => setIsShared(true)}
              className={[
                'flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs border transition-colors',
                isShared
                  ? 'bg-dui-surface-tertiary border-dui-primary/40 text-dui-text-primary'
                  : 'bg-transparent border-dui-border text-dui-text-secondary hover:text-dui-text-primary',
              ].join(' ')}
            >
              <Globe size={12} />
              Shareable
            </button>
          </fieldset>

          <div className="rounded-md border border-dui-border bg-dui-surface-tertiary/40 px-3 py-2 text-[11px] text-dui-text-muted">
            <div>
              Provenance kept:{' '}
              <span className="text-dui-text-secondary">
                {prov.candidateSource === 'cache' ? 'pattern cache' : prov.candidateSource}
                {prov.patternMatchConfidence != null &&
                  ` · ${Math.round(prov.patternMatchConfidence * 100)}%`}
              </span>
            </div>
            <div>
              Skill hash:{' '}
              <span className="font-mono text-dui-text-secondary">
                {prov.skillHash.slice(0, 10)}…
              </span>
            </div>
          </div>

          {validationError && (
            <p className="text-xs text-dui-danger">{validationError}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-dui-border">
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded-md border border-dui-border text-dui-text-secondary hover:text-dui-text-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || duplicate || save.isPending}
            className="dui-prompt-submit text-xs px-4 py-1.5 inline-flex items-center gap-2"
          >
            {save.isPending && <Loader2 size={12} className="animate-spin" />}
            Save view
          </button>
        </div>
      </form>
    </div>
  );
}
