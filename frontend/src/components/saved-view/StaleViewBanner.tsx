import { AlertTriangle } from 'lucide-react';

interface StaleViewBannerProps {
  nlInput: string;
  onReview?: () => void;
  onAccept?: () => void;
  busy?: boolean;
}

export function StaleViewBanner({
  nlInput,
  onReview,
  onAccept,
  busy,
}: StaleViewBannerProps) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 border-b border-dui-border"
      style={{
        background: 'rgba(251, 191, 36, 0.08)',
        borderColor: 'rgba(251, 191, 36, 0.25)',
      }}
      role="status"
    >
      <AlertTriangle size={14} className="text-dui-warning flex-shrink-0" />
      <div className="flex-1 text-xs text-dui-text-secondary">
        This view's underlying data model has changed. We re-resolved{' '}
        <span className="text-dui-text-primary">“{nlInput}”</span> and got a
        slightly different plan.
      </div>
      {onReview && (
        <button
          type="button"
          onClick={onReview}
          disabled={busy}
          className="text-[11px] text-dui-text-secondary hover:text-dui-text-primary border border-dui-border rounded px-2 py-0.5"
        >
          Review changes
        </button>
      )}
      {onAccept && (
        <button
          type="button"
          onClick={onAccept}
          disabled={busy}
          className="text-[11px] text-dui-text-primary bg-dui-surface-tertiary border border-dui-primary/40 rounded px-2 py-0.5 hover:bg-dui-surface"
        >
          Accept
        </button>
      )}
    </div>
  );
}
