import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, Database, ArrowRight } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { queryKeys } from '../lib/queryKeys';
import { PageHeader } from '../components/shell/PageHeader';

// Entity directory. We derive the list from the admin widget dashboard since
// there is no dedicated "list entities" endpoint; widgets/dashboard already
// iterates the skill registry, and every widget carries its entity name.

export function EntitiesPage() {
  const widgets = useQuery({
    queryKey: queryKeys.widgetsDashboard(),
    queryFn: () => apiClient.fetchWidgetsDashboard(),
    staleTime: 5 * 60 * 1000,
  });

  const entities = new Set<string>();
  widgets.data?.forEach((cat) =>
    cat.widgets.forEach((w) => entities.add(w.entity)),
  );
  const sorted = Array.from(entities).sort();

  return (
    <div className="flex flex-col overflow-hidden h-full">
      <PageHeader
        title="Entities"
        subtitle="Every entity the skill registry knows about."
      />
      <div className="flex-1 overflow-y-auto p-6">
        {widgets.isLoading && (
          <div className="flex items-center justify-center py-12 text-dui-text-muted">
            <Loader2 size={16} className="animate-spin mr-2" />
            <span className="text-sm">Loading entities…</span>
          </div>
        )}
        {widgets.isError && (
          <div className="flex items-center gap-2 p-3 rounded-md border border-dui-border bg-dui-surface text-dui-danger">
            <AlertCircle size={14} />
            <span className="text-sm">
              {widgets.error instanceof Error ? widgets.error.message : 'Failed to load'}
            </span>
          </div>
        )}
        {!widgets.isLoading && sorted.length === 0 && (
          <p className="text-sm text-dui-text-muted">
            No entities scaffolded yet. Start with the admin portal.
          </p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {sorted.map((entity) => (
            <Link
              key={entity}
              to={`/entities/${entity}`}
              className="group flex items-center justify-between gap-2 rounded-md border border-dui-border bg-dui-surface px-3 py-3 hover:border-dui-primary/40 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Database size={13} className="text-dui-text-muted group-hover:text-dui-primary" />
                <span className="text-sm text-dui-text-primary truncate">{entity}</span>
              </div>
              <ArrowRight size={12} className="text-dui-text-muted group-hover:text-dui-primary flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
