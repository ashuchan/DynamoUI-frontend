import { Link } from 'react-router-dom';
import { Eye, Table2, BarChart3, FileText, Pin, Play, Share2, Trash2 } from 'lucide-react';
import type { SavedView } from '../../lib/types';

const SHAPE_ICON = {
  list: <Table2 size={13} />,
  single: <FileText size={13} />,
  aggregate: <BarChart3 size={13} />,
  chart: <BarChart3 size={13} />,
};

interface SavedViewCardProps {
  view: SavedView;
  onExecute?: (id: string) => void;
  onPin?: (id: string) => void;
  onShare?: (id: string) => void;
  onDelete?: (id: string) => void;
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const ms = Date.now() - d.getTime();
  if (ms < 60_000) return 'just now';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return d.toLocaleDateString();
}

export function SavedViewCard({
  view,
  onExecute,
  onPin,
  onShare,
  onDelete,
}: SavedViewCardProps) {
  return (
    <div
      className="group flex flex-col rounded-lg border border-dui-border bg-dui-surface p-4 hover:border-dui-primary/30 transition-colors"
      style={{ minHeight: 140 }}
    >
      <div className="flex items-start gap-2">
        <div
          className="flex-shrink-0 rounded-md p-2 text-dui-text-muted group-hover:text-dui-primary transition-colors"
          style={{ background: 'var(--dui-surface-tertiary)' }}
        >
          {SHAPE_ICON[view.resultShape] ?? <Eye size={13} />}
        </div>
        <div className="flex-1 min-w-0">
          <Link
            to={`/views/${view.id}`}
            className="block text-sm font-medium text-dui-text-primary hover:text-dui-primary truncate"
          >
            {view.name}
          </Link>
          <div className="mt-0.5 text-[11px] text-dui-text-muted truncate">
            {view.entity} · updated {formatRelative(view.updatedAt)}
          </div>
        </div>
        {view.stale && (
          <span className="text-[9px] uppercase tracking-wider text-dui-warning border border-dui-warning/40 rounded px-1.5 py-0.5">
            Stale
          </span>
        )}
      </div>

      <p className="mt-3 text-xs text-dui-text-secondary leading-snug line-clamp-2 flex-1">
        “{view.nlInput}”
      </p>

      <div className="mt-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => onExecute?.(view.id)}
          aria-label="Execute"
          className="text-[11px] text-dui-text-secondary hover:text-dui-text-primary border border-dui-border rounded px-2 py-0.5 inline-flex items-center gap-1"
        >
          <Play size={10} />
          Run
        </button>
        <button
          type="button"
          onClick={() => onPin?.(view.id)}
          aria-label="Pin to home"
          className="text-[11px] text-dui-text-secondary hover:text-dui-text-primary border border-dui-border rounded px-2 py-0.5 inline-flex items-center gap-1"
        >
          <Pin size={10} />
          Pin
        </button>
        {view.isShared && (
          <button
            type="button"
            onClick={() => onShare?.(view.id)}
            aria-label="Share"
            className="text-[11px] text-dui-text-secondary hover:text-dui-text-primary border border-dui-border rounded px-2 py-0.5 inline-flex items-center gap-1"
          >
            <Share2 size={10} />
            Share
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete?.(view.id)}
          aria-label="Delete"
          className="ml-auto text-[11px] text-dui-danger hover:opacity-80 border border-dui-border rounded px-2 py-0.5 inline-flex items-center gap-1"
        >
          <Trash2 size={10} />
        </button>
      </div>
    </div>
  );
}
