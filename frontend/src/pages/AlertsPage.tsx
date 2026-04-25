import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Loader2, AlertCircle, BellRing } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { queryKeys } from '../lib/queryKeys';
import { PageHeader, PagePlaceholder } from '../components/shell/PageHeader';

export function AlertsPage() {
  const list = useQuery({
    queryKey: queryKeys.alerts(),
    queryFn: () => apiClient.listAlerts(),
    staleTime: 30_000,
  });

  return (
    <div className="flex flex-col overflow-hidden h-full">
      <PageHeader
        title="Alerts"
        subtitle="Conditions on your saved views. Heads-up: alert trigger history is a backend stub — list may be empty even after a trigger."
      />
      <div className="flex-1 overflow-y-auto p-6">
        {list.isLoading && (
          <div className="flex items-center justify-center py-12 text-dui-text-muted">
            <Loader2 size={16} className="animate-spin mr-2" />
            <span className="text-sm">Loading alerts…</span>
          </div>
        )}
        {list.isError && (
          <div className="flex items-center gap-2 p-3 rounded-md border border-dui-border bg-dui-surface text-dui-danger">
            <AlertCircle size={14} />
            <span className="text-sm">
              {list.error instanceof Error ? list.error.message : 'Failed to load'}
            </span>
          </div>
        )}
        {list.data && list.data.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-dui-surface-tertiary p-4 mb-4">
              <BellRing size={20} className="text-dui-text-muted" />
            </div>
            <h3 className="text-sm font-medium text-dui-text-primary mb-1">No alerts yet</h3>
            <p className="text-xs text-dui-text-muted max-w-sm">
              From a saved view, use <span className="text-dui-text-secondary">Create alert</span>
              {' '}in the action rail. The condition builder ships in F8.
            </p>
          </div>
        )}
        {list.data && list.data.length > 0 && (
          <div className="space-y-2">
            {list.data.map((a) => (
              <div
                key={a.id}
                className="rounded-md border border-dui-border bg-dui-surface p-3"
              >
                <div className="flex items-center gap-2">
                  <BellRing size={13} className="text-dui-primary" />
                  <span className="text-sm text-dui-text-primary">
                    Alert on saved view {a.savedViewId.slice(0, 8)}…
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-dui-text-muted">
                  Checks every <span className="font-mono">{a.checkCron}</span> · {a.channel}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AlertDetailPage() {
  const { id } = useParams();
  return (
    <PagePlaceholder
      title={`Alert · ${id}`}
      subtitle="Full alert detail + trigger history ships in F8 once the backend /alerts/:id/triggers endpoint is implemented (currently returns an empty stub)."
    />
  );
}
