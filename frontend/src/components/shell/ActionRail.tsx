import { type ReactNode } from 'react';
import {
  BarChart3,
  LineChart as LineIcon,
  PieChart,
  Save,
  Pin,
  CalendarClock,
  BellRing,
  Download,
  Link as LinkIcon,
  Search as SearchIcon,
  Pencil,
} from 'lucide-react';
import type { ExecutedResult, ResultShape } from '../../lib/types';

// Sections are computed from the current result shape. `onTrigger` wires the
// button clicks up to the page's state — the rail itself is presentational.

export type ActionRailAction =
  | 'chart_bar'
  | 'chart_line'
  | 'chart_pie'
  | 'save_view'
  | 'pin'
  | 'schedule'
  | 'alert'
  | 'export_csv'
  | 'export_xlsx'
  | 'copy_link'
  | 'share'
  | 'refine'
  | 'edit_as_nl';

interface ActionRailProps {
  executed?: ExecutedResult;
  onTrigger?: (action: ActionRailAction) => void;
  disabled?: boolean;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-b border-dui-border last:border-b-0">
      <div className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-widest text-dui-text-muted">
        {title}
      </div>
      <div className="flex flex-col py-1">{children}</div>
    </div>
  );
}

function RailButton({
  icon,
  label,
  shortcut,
  onClick,
  disabled,
}: {
  icon: ReactNode;
  label: string;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 px-4 py-1.5 text-[13px] text-dui-text-secondary hover:bg-dui-surface-tertiary hover:text-dui-text-primary disabled:opacity-40 disabled:cursor-not-allowed dui-focus-ring text-left"
    >
      <span className="text-dui-text-muted flex-shrink-0">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {shortcut && (
        <span className="text-[10px] text-dui-text-muted border border-dui-border rounded px-1">
          {shortcut}
        </span>
      )}
    </button>
  );
}

function inferShape(executed?: ExecutedResult): ResultShape | null {
  if (!executed) return null;
  const rows = executed.result.rows ?? [];
  if (rows.length === 1) return 'single';
  return 'list';
}

export function ActionRail({ executed, onTrigger, disabled }: ActionRailProps) {
  const shape = inferShape(executed);
  const canVisualise = shape === 'list' || shape === 'aggregate';
  const trigger = (a: ActionRailAction) => !disabled && onTrigger?.(a);

  return (
    <aside
      className="flex-shrink-0 flex flex-col overflow-y-auto"
      style={{
        width: 280,
        borderLeft: '1px solid var(--dui-border)',
        background: 'var(--dui-surface)',
      }}
      aria-label="Action rail"
    >
      <div className="px-4 py-3 border-b border-dui-border">
        <div className="text-[11px] uppercase tracking-widest text-dui-text-muted">
          Actions
        </div>
        {!executed && (
          <p className="mt-2 text-xs text-dui-text-muted leading-snug">
            Run a query to see actions — visualise, save, pin, schedule, share.
          </p>
        )}
      </div>

      {canVisualise && (
        <Section title="Visualise">
          <RailButton
            icon={<BarChart3 size={13} />}
            label="Bar chart"
            onClick={() => trigger('chart_bar')}
            disabled={disabled}
          />
          <RailButton
            icon={<LineIcon size={13} />}
            label="Line chart"
            onClick={() => trigger('chart_line')}
            disabled={disabled}
          />
          <RailButton
            icon={<PieChart size={13} />}
            label="Pie chart"
            onClick={() => trigger('chart_pie')}
            disabled={disabled}
          />
        </Section>
      )}

      <Section title="Persist">
        <RailButton
          icon={<Save size={13} />}
          label="Save as view"
          shortcut="S"
          onClick={() => trigger('save_view')}
          disabled={!executed || disabled}
        />
        <RailButton
          icon={<Pin size={13} />}
          label="Pin to home"
          shortcut="P"
          onClick={() => trigger('pin')}
          disabled={!executed || disabled}
        />
        <RailButton
          icon={<CalendarClock size={13} />}
          label="Schedule delivery"
          shortcut="⇧S"
          onClick={() => trigger('schedule')}
          disabled={!executed || disabled}
        />
        <RailButton
          icon={<BellRing size={13} />}
          label="Create alert"
          shortcut="⇧A"
          onClick={() => trigger('alert')}
          disabled={!executed || disabled}
        />
      </Section>

      <Section title="Transform">
        <RailButton
          icon={<SearchIcon size={13} />}
          label="Refine query"
          shortcut="/"
          onClick={() => trigger('refine')}
          disabled={!executed || disabled}
        />
        <RailButton
          icon={<Pencil size={13} />}
          label="Edit as NL"
          onClick={() => trigger('edit_as_nl')}
          disabled={!executed || disabled}
        />
      </Section>

      <Section title="Export">
        <RailButton
          icon={<Download size={13} />}
          label="CSV"
          shortcut="E"
          onClick={() => trigger('export_csv')}
          disabled={!executed || disabled}
        />
        <RailButton
          icon={<Download size={13} />}
          label="XLSX"
          onClick={() => trigger('export_xlsx')}
          disabled={!executed || disabled}
        />
      </Section>

      <Section title="Share">
        <RailButton
          icon={<LinkIcon size={13} />}
          label="Copy link"
          onClick={() => trigger('copy_link')}
          disabled={!executed || disabled}
        />
        <RailButton
          icon={<LinkIcon size={13} />}
          label="Share publicly"
          onClick={() => trigger('share')}
          disabled={!executed || disabled}
        />
      </Section>
    </aside>
  );
}
