import type { WidgetCategory, Widget } from '../../lib/types';
import type { WidgetExecution } from './useDashboard';
import { CategoryHeader } from './CategoryHeader';
import { WidgetCard } from './WidgetCard';

interface WidgetGridProps {
  categories: WidgetCategory[];
  executions: Record<string, WidgetExecution>;
  onRun: (widget: Widget) => void;
  onDismiss: (widgetId: string) => void;
  onNavigate?: (entity: string, pk: string) => void;
}

export function WidgetGrid({
  categories,
  executions,
  onRun,
  onDismiss,
  onNavigate,
}: WidgetGridProps) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-16 text-dui-text-muted text-sm">
        No widgets configured. Add entries to{' '}
        <code className="text-xs bg-dui-surface-secondary px-1 py-0.5 rounded">
          widgets.yaml
        </code>{' '}
        to get started.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {categories.map(({ category, widgets }) => (
        <section key={category} aria-label={category}>
          <CategoryHeader category={category} count={widgets.length} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {widgets.map((widget) => (
              <WidgetCard
                key={widget.id}
                widget={widget}
                execution={executions[widget.id]}
                onRun={onRun}
                onDismiss={onDismiss}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
