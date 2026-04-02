import { Loader2, AlertCircle } from 'lucide-react';
import { useDashboard } from './useDashboard';
import { WidgetGrid } from './WidgetGrid';
import { WidgetParamModal } from './WidgetParamModal';
import type { Widget } from '../../lib/types';

interface DashboardProps {
  onNavigate?: (entity: string, pk: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const {
    categories,
    isLoading,
    isError,
    error,
    pendingWidget,
    executions,
    requestWidgetExecution,
    executeWidget,
    dismissWidget,
    cancelPendingWidget,
  } = useDashboard();

  function handleRun(widget: Widget) {
    requestWidgetExecution(widget);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-dui-text-muted">
        <Loader2 size={24} className="animate-spin mr-2" />
        <span className="text-sm">Loading dashboard…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 p-4 text-dui-danger bg-dui-surface border border-dui-border rounded-md">
        <AlertCircle size={16} />
        <span className="text-sm">
          {error instanceof Error ? error.message : 'Failed to load dashboard'}
        </span>
      </div>
    );
  }

  return (
    <>
      <WidgetGrid
        categories={categories}
        executions={executions}
        onRun={handleRun}
        onDismiss={dismissWidget}
        onNavigate={onNavigate}
      />

      {pendingWidget && (
        <WidgetParamModal
          widget={pendingWidget}
          onExecute={executeWidget}
          onCancel={cancelPendingWidget}
        />
      )}
    </>
  );
}
