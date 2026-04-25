import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Loader2, AlertCircle, CalendarClock } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { queryKeys } from '../lib/queryKeys';
import { PageHeader, PagePlaceholder } from '../components/shell/PageHeader';

export function SchedulesPage() {
  const list = useQuery({
    queryKey: queryKeys.schedules(),
    queryFn: () => apiClient.listSchedules(),
    staleTime: 30_000,
  });

  return (
    <div className="flex flex-col overflow-hidden h-full">
      <PageHeader
        title="Schedules"
        subtitle="Recurring deliveries of your saved views and dashboards."
      />
      <div className="flex-1 overflow-y-auto p-6">
        {list.isLoading && (
          <div className="flex items-center justify-center py-12 text-dui-text-muted">
            <Loader2 size={16} className="animate-spin mr-2" />
            <span className="text-sm">Loading schedules…</span>
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
              <CalendarClock size={20} className="text-dui-text-muted" />
            </div>
            <h3 className="text-sm font-medium text-dui-text-primary mb-1">No schedules yet</h3>
            <p className="text-xs text-dui-text-muted max-w-sm">
              From any result, hit <span className="text-dui-text-secondary">Schedule delivery</span>
              {' '}in the action rail. Full schedule modal + cron preview ship in F7.
            </p>
          </div>
        )}
        {list.data && list.data.length > 0 && (
          <div className="space-y-2">
            {list.data.map((s) => (
              <div
                key={s.id}
                className="rounded-md border border-dui-border bg-dui-surface p-3"
              >
                <div className="flex items-center gap-2">
                  <CalendarClock size={13} className="text-dui-primary" />
                  <span className="text-sm text-dui-text-primary">{s.sourceType} · {s.sourceId}</span>
                  {!s.enabled && (
                    <span className="ml-auto text-[9px] uppercase tracking-wider text-dui-text-muted">
                      paused
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[11px] text-dui-text-muted">
                  {s.cronExpr} · {s.timezone} · {s.channel} · next{' '}
                  {s.nextRunAt ? new Date(s.nextRunAt).toLocaleString() : '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ScheduleDetailPage() {
  const { id } = useParams();
  return (
    <PagePlaceholder
      title={`Schedule · ${id}`}
      subtitle="Run history + edit form ship in F7. The endpoints (/schedules/:id, /runs, /test) are wired through apiClient."
    />
  );
}
