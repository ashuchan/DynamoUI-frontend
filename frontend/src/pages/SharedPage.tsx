import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { queryKeys } from '../lib/queryKeys';
import { DataTable } from '../components/data-display/DataTable/DataTable';
import { PagePlaceholder } from '../components/shell/PageHeader';
import type { ResolvedData } from '../lib/types';

export function SharedListPage() {
  return (
    <PagePlaceholder
      title="Shared"
      subtitle="A library of views and dashboards shared with you. F10 ships the full listing + share-token management UI; share-tokens API is wired."
    />
  );
}

export function SharedTokenPage() {
  const { token } = useParams<{ token: string }>();
  const q = useQuery({
    queryKey: queryKeys.sharedContent(token!),
    queryFn: () => apiClient.getSharedContent(token!),
    enabled: Boolean(token),
    staleTime: 60_000,
  });

  if (q.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-dui-text-muted">
        <Loader2 size={18} className="animate-spin mr-2" />
        <span className="text-sm">Loading shared view…</span>
      </div>
    );
  }
  if (q.isError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="flex items-center gap-2 p-4 rounded-md border border-dui-border bg-dui-surface text-dui-danger">
          <AlertCircle size={14} />
          <span className="text-sm">
            {q.error instanceof Error ? q.error.message : 'Shared link is invalid or expired.'}
          </span>
        </div>
      </div>
    );
  }
  const executed = q.data!;
  const entity = (executed.provenance.queryPlan as { entity?: string })?.entity ?? 'unknown';
  const resolved: ResolvedData = {
    rows: executed.result.rows,
    total_count: executed.result.rows.length,
  };

  return (
    <div className="min-h-screen flex flex-col bg-dui-bg">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-dui-border">
        <span className="text-sm font-bold text-dui-text-primary tracking-tight">
          Dynamo<span className="text-dui-primary">UI</span>
        </span>
        <span className="text-xs text-dui-text-muted">Shared view</span>
      </header>
      <main className="flex-1">
        <DataTable entity={entity} resolvedData={resolved} />
      </main>
    </div>
  );
}

export function EmbedTokenPage() {
  const { token } = useParams<{ token: string }>();
  const q = useQuery({
    queryKey: queryKeys.sharedContent(token!),
    queryFn: () => apiClient.getSharedContent(token!),
    enabled: Boolean(token),
    staleTime: 60_000,
  });

  if (q.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-dui-text-muted">
        <Loader2 size={18} className="animate-spin mr-2" />
        <span className="text-sm">Loading…</span>
      </div>
    );
  }
  if (q.isError || !q.data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="flex items-center gap-2 p-4 rounded-md border border-dui-border bg-dui-surface text-dui-danger">
          <AlertCircle size={14} />
          <span className="text-sm">
            {q.error instanceof Error
              ? q.error.message
              : 'Embedded link is invalid or expired.'}
          </span>
        </div>
      </div>
    );
  }
  const entity = (q.data.provenance.queryPlan as { entity?: string })?.entity ?? 'unknown';
  const resolved: ResolvedData = {
    rows: q.data.result.rows,
    total_count: q.data.result.rows.length,
  };
  return (
    <div className="min-h-screen bg-dui-bg">
      <DataTable entity={entity} resolvedData={resolved} />
    </div>
  );
}
