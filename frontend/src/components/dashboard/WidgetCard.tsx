import { Play, Loader2, AlertCircle, X, ChevronRight } from 'lucide-react';
import type { Widget, QueryResult } from '../../lib/types';

interface WidgetCardProps {
  widget: Widget;
  execution?: { result: QueryResult | null; isLoading: boolean; error: string | null };
  onRun: (widget: Widget) => void;
  onDismiss: (widgetId: string) => void;
  onNavigate?: (entity: string, pk: string) => void;
}

function ResultTable({
  result,
  onNavigate,
  entity,
}: {
  result: QueryResult;
  onNavigate?: (entity: string, pk: string) => void;
  entity: string;
}) {
  if (result.rows.length === 0) {
    return (
      <p className="text-xs text-dui-text-muted py-2 text-center">No results.</p>
    );
  }

  const columns = Object.keys(result.rows[0]);

  return (
    <div className="mt-3 overflow-x-auto rounded border border-dui-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-dui-table-header border-b border-dui-border">
            {columns.map((col) => (
              <th
                key={col}
                className="px-2 py-1.5 text-left font-medium text-dui-text-secondary whitespace-nowrap"
              >
                {col}
              </th>
            ))}
            {onNavigate && <th className="px-2 py-1.5" />}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-dui-border last:border-b-0 hover:bg-dui-surface-secondary"
            >
              {columns.map((col) => (
                <td
                  key={col}
                  className="px-2 py-1.5 text-dui-text-primary whitespace-nowrap max-w-[160px] overflow-hidden text-ellipsis"
                >
                  {row[col] === null || row[col] === undefined
                    ? <span className="text-dui-text-muted">—</span>
                    : String(row[col])}
                </td>
              ))}
              {onNavigate && (
                <td className="px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const pk = String(row['id'] ?? row[columns[0]]);
                      onNavigate(entity, pk);
                    }}
                    className="text-dui-text-muted hover:text-dui-text-primary focus:outline-none dui-focus-ring rounded"
                    aria-label="Open record"
                  >
                    <ChevronRight size={12} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-2 py-1 text-xs text-dui-text-muted border-t border-dui-border">
        {result.totalCount} total
      </p>
    </div>
  );
}

export function WidgetCard({
  widget,
  execution,
  onRun,
  onDismiss,
  onNavigate,
}: WidgetCardProps) {
  return (
    <div className="bg-dui-surface border border-dui-border rounded-lg p-4 shadow-sm flex flex-col gap-2">
      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-dui-text-primary truncate">
            {widget.title}
          </h3>
          {widget.description && (
            <p className="text-xs text-dui-text-muted mt-0.5 line-clamp-2">
              {widget.description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onRun(widget)}
          disabled={execution?.isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-dui-primary text-dui-surface text-xs font-medium hover:opacity-90 focus:outline-none dui-focus-ring disabled:opacity-50 flex-shrink-0"
          aria-label={`Run ${widget.title}`}
        >
          {execution?.isLoading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Play size={12} />
          )}
          Run
        </button>
      </div>

      {/* Result */}
      {execution && (
        <div className="relative">
          {/* Dismiss button */}
          <button
            type="button"
            onClick={() => onDismiss(widget.id)}
            className="absolute top-0 right-0 text-dui-text-muted hover:text-dui-text-primary focus:outline-none dui-focus-ring rounded"
            aria-label="Dismiss result"
          >
            <X size={12} />
          </button>

          {execution.isLoading && (
            <div className="flex items-center gap-2 text-dui-text-muted text-xs py-2">
              <Loader2 size={12} className="animate-spin" />
              Running…
            </div>
          )}

          {execution.error && (
            <div className="flex items-center gap-1.5 text-dui-danger text-xs py-2">
              <AlertCircle size={12} />
              {execution.error}
            </div>
          )}

          {execution.result && !execution.isLoading && (
            <ResultTable
              result={execution.result}
              onNavigate={onNavigate}
              entity={widget.entity}
            />
          )}
        </div>
      )}
    </div>
  );
}
