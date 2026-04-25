import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Eye } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { queryKeys } from '../../lib/queryKeys';
import { useSessionStore } from '../../lib/sessionStore';
import { SavedViewCard } from './SavedViewCard';
import type { SavedViewFilter } from '../../lib/types';

interface SavedViewListProps {
  filter?: SavedViewFilter;
}

export function SavedViewList({ filter }: SavedViewListProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const stashResult = useSessionStore((s) => s.stashResult);

  const listQuery = useQuery({
    queryKey: queryKeys.savedViewList(filter),
    queryFn: () => apiClient.listSavedViews(filter),
    staleTime: 30_000,
  });

  const executeMutation = useMutation({
    mutationFn: async (id: string) => {
      const executed = await apiClient.executeSavedView(id);
      const view = listQuery.data?.find((v) => v.id === id);
      const input = view?.nlInput ?? view?.name ?? 'saved view';
      return { sessionId: stashResult(input, executed), executed };
    },
    onSuccess: ({ sessionId }) => navigate(`/results/${sessionId}`),
  });

  const pinMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient.createPin({ sourceType: 'saved_view', sourceId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.home() });
      queryClient.invalidateQueries({ queryKey: queryKeys.pins() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteSavedView(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedViewList() });
      queryClient.invalidateQueries({ queryKey: queryKeys.home() });
    },
  });

  if (listQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-dui-text-muted">
        <Loader2 size={16} className="animate-spin mr-2" />
        <span className="text-sm">Loading views…</span>
      </div>
    );
  }

  if (listQuery.isError) {
    return (
      <div className="flex items-center gap-2 m-6 p-3 rounded-md border border-dui-border bg-dui-surface text-dui-danger">
        <AlertCircle size={14} />
        <span className="text-sm">
          {listQuery.error instanceof Error ? listQuery.error.message : 'Failed to load views'}
        </span>
      </div>
    );
  }

  const views = listQuery.data ?? [];

  if (views.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="rounded-full bg-dui-surface-tertiary p-4 mb-4">
          <Eye size={20} className="text-dui-text-muted" />
        </div>
        <h3 className="text-sm font-medium text-dui-text-primary mb-1">No saved views yet</h3>
        <p className="text-xs text-dui-text-muted max-w-sm leading-relaxed">
          Run a query, then save its result from the action rail. Your saved views will show up
          here and across your home, dashboards, and command palette.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
      {views.map((view) => (
        <SavedViewCard
          key={view.id}
          view={view}
          onExecute={executeMutation.mutate}
          onPin={pinMutation.mutate}
          onDelete={(id) => {
            if (confirm(`Delete “${view.name}”?`)) deleteMutation.mutate(id);
          }}
        />
      ))}
    </div>
  );
}
