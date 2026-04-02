import { useState } from 'react';
import { X, Play } from 'lucide-react';
import type { Widget } from '../../lib/types';

interface WidgetParamModalProps {
  widget: Widget;
  onExecute: (widget: Widget, params: Record<string, unknown>) => void;
  onCancel: () => void;
}

export function WidgetParamModal({ widget, onExecute, onCancel }: WidgetParamModalProps) {
  const [params, setParams] = useState<Record<string, unknown>>(
    Object.fromEntries(
      widget.params.map((p) => [p.name, p.defaultValue ?? '']),
    ),
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onExecute(widget, params);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="widget-modal-title"
    >
      <div className="bg-dui-surface border border-dui-border rounded-xl shadow-xl w-full max-w-sm mx-4">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-dui-border">
          <div>
            <h3
              id="widget-modal-title"
              className="text-sm font-semibold text-dui-text-primary"
            >
              {widget.title}
            </h3>
            {widget.description && (
              <p className="text-xs text-dui-text-muted mt-0.5">{widget.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-dui-text-muted hover:text-dui-text-primary focus:outline-none dui-focus-ring rounded ml-3 flex-shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {widget.params.map((param) => (
            <div key={param.name}>
              <label
                htmlFor={`param-${param.name}`}
                className="block text-xs font-medium text-dui-text-secondary mb-1"
              >
                {param.label}
                {param.required && (
                  <span className="text-dui-danger ml-1">*</span>
                )}
              </label>
              <input
                id={`param-${param.name}`}
                type={
                  param.type === 'integer' || param.type === 'float'
                    ? 'number'
                    : param.type === 'date'
                      ? 'date'
                      : 'text'
                }
                value={String(params[param.name] ?? '')}
                onChange={(e) =>
                  setParams((prev) => ({ ...prev, [param.name]: e.target.value }))
                }
                required={param.required}
                className="block w-full rounded border border-dui-border bg-dui-surface text-dui-text-primary text-sm px-3 py-1.5 focus:outline-none focus:border-dui-border"
              />
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-dui-primary text-dui-surface text-sm font-medium hover:opacity-90 focus:outline-none dui-focus-ring"
            >
              <Play size={13} />
              Run
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-md text-sm font-medium border border-dui-border text-dui-text-secondary hover:bg-dui-surface-secondary focus:outline-none dui-focus-ring"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
