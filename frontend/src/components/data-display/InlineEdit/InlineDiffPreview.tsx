import { Check, X } from 'lucide-react';
import type { DiffPreview } from '../../../lib/types';

interface InlineDiffPreviewProps {
  preview: DiffPreview;
  onConfirm: () => void;
  onCancel: () => void;
  isExecuting: boolean;
}

export function InlineDiffPreview({
  preview,
  onConfirm,
  onCancel,
  isExecuting,
}: InlineDiffPreviewProps) {
  return (
    <div
      className="mt-1 rounded-md border border-dui-border bg-dui-surface p-3 shadow-sm"
      role="dialog"
      aria-label="Confirm change"
    >
      <p className="text-xs font-semibold text-dui-text-secondary uppercase tracking-wide mb-2">
        Confirm change
      </p>
      <table className="w-full text-xs mb-3">
        <thead>
          <tr>
            <th className="text-left text-dui-text-muted pb-1 pr-2 font-medium">Field</th>
            <th className="text-left text-dui-text-muted pb-1 pr-2 font-medium">Before</th>
            <th className="text-left text-dui-text-muted pb-1 font-medium">After</th>
          </tr>
        </thead>
        <tbody>
          {preview.changes.map((change) => (
            <tr key={change.field}>
              <td className="pr-2 py-0.5 font-mono text-dui-text-secondary">
                {change.field}
              </td>
              <td className="pr-2 py-0.5 text-dui-danger line-through">
                {change.oldValue === null || change.oldValue === undefined
                  ? '—'
                  : String(change.oldValue)}
              </td>
              <td className="py-0.5 text-dui-success font-medium">
                {change.newValue === null || change.newValue === undefined
                  ? '—'
                  : String(change.newValue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={isExecuting}
          className={[
            'inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-medium',
            'bg-dui-success text-dui-surface',
            'hover:opacity-90 focus:outline-none dui-focus-ring',
            isExecuting ? 'opacity-50 cursor-not-allowed' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <Check size={12} />
          {isExecuting ? 'Saving…' : 'Confirm'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isExecuting}
          className={[
            'inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-medium',
            'border border-dui-border text-dui-text-secondary',
            'hover:bg-dui-surface-secondary focus:outline-none dui-focus-ring',
            isExecuting ? 'opacity-50 cursor-not-allowed' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <X size={12} />
          Cancel
        </button>
      </div>
    </div>
  );
}
