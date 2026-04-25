import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, LayoutDashboard, Plus } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { queryKeys } from '../lib/queryKeys';
import { PageHeader, PagePlaceholder } from '../components/shell/PageHeader';

export function DashboardsPage() {
  const list = useQuery({
    queryKey: queryKeys.dashboardList(),
    queryFn: () => apiClient.listDashboards(),
    staleTime: 30_000,
  });

  return (
    <div className="flex flex-col overflow-hidden h-full">
      <PageHeader
        title="Dashboards"
        subtitle="Personal dashboards of saved views, widgets, and pattern results."
        actions={
          <button
            type="button"
            disabled
            title="Coming in F4"
            className="dui-prompt-submit text-xs px-3 py-1.5 opacity-50 cursor-not-allowed inline-flex items-center gap-1"
          >
            <Plus size={12} />
            New dashboard
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto p-6">
        {list.isLoading && (
          <div className="flex items-center justify-center py-12 text-dui-text-muted">
            <Loader2 size={16} className="animate-spin mr-2" />
            <span className="text-sm">Loading dashboards…</span>
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
              <LayoutDashboard size={20} className="text-dui-text-muted" />
            </div>
            <h3 className="text-sm font-medium text-dui-text-primary mb-1">No dashboards yet</h3>
            <p className="text-xs text-dui-text-muted max-w-sm">
              Dashboards compose saved views into a single canvas. The editor lands in F4.
            </p>
          </div>
        )}
        {list.data && list.data.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.data.map((d) => (
              <Link
                key={d.id}
                to={`/dashboards/${d.id}`}
                className="rounded-lg border border-dui-border bg-dui-surface p-4 hover:border-dui-primary/30"
              >
                <div className="flex items-center gap-2">
                  <LayoutDashboard size={14} className="text-dui-primary" />
                  <span className="text-sm font-medium text-dui-text-primary">{d.name}</span>
                  {d.isDefault && (
                    <span className="ml-auto text-[9px] uppercase tracking-wider text-dui-text-muted border border-dui-border rounded px-1.5 py-0.5">
                      Default
                    </span>
                  )}
                </div>
                {d.description && (
                  <p className="mt-2 text-xs text-dui-text-muted line-clamp-2">{d.description}</p>
                )}
                <div className="mt-3 text-[11px] text-dui-text-muted">
                  {d.layout?.tiles?.length ?? 0} tile{(d.layout?.tiles?.length ?? 0) !== 1 ? 's' : ''}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function DashboardDetailPage() {
  const { id } = useParams();
  return (
    <PagePlaceholder
      title={`Dashboard · ${id}`}
      subtitle="The drag-and-drop dashboard editor (react-grid-layout, tile composer, add-tile drawer) ships in F4. Schema and endpoints are already wired through apiClient."
    />
  );
}
