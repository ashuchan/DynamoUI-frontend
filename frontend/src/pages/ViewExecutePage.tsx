import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { queryKeys } from '../lib/queryKeys';
import { useSessionStore } from '../lib/sessionStore';

// Execute a saved view → redirect to its result session once data lands.
// This keeps saved-view execution cacheable at React Query while routing
// through the same /results/:sessionId surface as one-shot NL queries.

export function ViewExecutePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const stashResult = useSessionStore((s) => s.stashResult);

  const viewQuery = useQuery({
    queryKey: queryKeys.savedView(id!),
    queryFn: () => apiClient.getSavedView(id!),
    enabled: Boolean(id),
    staleTime: 60_000,
  });

  const execQuery = useQuery({
    queryKey: queryKeys.savedViewExecute(id!),
    queryFn: () => apiClient.executeSavedView(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (execQuery.data && viewQuery.data) {
      const sid = stashResult(viewQuery.data.nlInput, execQuery.data);
      navigate(`/results/${sid}`, { replace: true });
    }
  }, [execQuery.data, viewQuery.data, stashResult, navigate]);

  if (viewQuery.isError || execQuery.isError) {
    const err = (viewQuery.error ?? execQuery.error) as Error | undefined;
    return (
      <div className="flex items-center gap-2 m-6 p-3 rounded-md border border-dui-border bg-dui-surface text-dui-danger">
        <AlertCircle size={14} />
        <span className="text-sm">{err?.message ?? 'Failed to load view'}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-dui-text-muted">
      <Loader2 size={18} className="animate-spin mb-3" />
      <span className="text-sm">Executing saved view…</span>
    </div>
  );
}
