import type { ResolvedData } from '../../lib/types';

// ── Chart colour stops for bars ranked 1 → N ────────────────────────────────
const BAR_GRADIENTS = [
  { id: 'g1', from: '#6366f1', to: '#818cf8' },
  { id: 'g2', from: '#4f46e5', to: '#6366f1' },
  { id: 'g3', from: '#3b82f6', to: '#60a5fa' },
  { id: 'g4', from: '#2563eb', to: '#3b82f6' },
  { id: 'g5', from: '#1d4ed8', to: '#2563eb' },
];

// ── Column type detection ────────────────────────────────────────────────────

function isNumericColumn(rows: Record<string, unknown>[], key: string): boolean {
  return rows.every((r) => r[key] == null || typeof r[key] === 'number');
}

function isLabelColumn(rows: Record<string, unknown>[], key: string): boolean {
  return rows.some((r) => typeof r[key] === 'string');
}

interface ChartColumns {
  labelKey: string;
  valueKey: string;
}

function detectColumns(rows: Record<string, unknown>[]): ChartColumns | null {
  if (!rows.length) return null;
  const keys = Object.keys(rows[0]);

  const numericKeys = keys.filter((k) => isNumericColumn(rows, k));
  const labelKeys   = keys.filter((k) => isLabelColumn(rows, k));

  if (!numericKeys.length || !labelKeys.length) return null;

  // Prefer label columns that aren't UUIDs / pure digits
  const cleanLabel =
    labelKeys.find((k) =>
      rows.some(
        (r) => typeof r[k] === 'string' && !/^[\da-f-]{32,36}$/i.test(r[k] as string),
      ),
    ) ?? labelKeys[0];

  return { labelKey: cleanLabel, valueKey: numericKeys[0] };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatLabel(raw: string, maxLen = 22): string {
  return raw.length > maxLen ? `${raw.slice(0, maxLen)}…` : raw;
}

function formatValue(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

// ── Component ────────────────────────────────────────────────────────────────

interface ChartPanelProps {
  queryPlan: ResolvedData;
  entity: string;
}

export function ChartPanel({ queryPlan, entity }: ChartPanelProps) {
  const { rows } = queryPlan;

  const cols = detectColumns(rows);

  // Panel header is rendered by ResultsLayout; this component just fills the body.
  if (!cols) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-dui-text-muted opacity-40">
          <rect x="2" y="10" width="4" height="11" rx="1" /><rect x="9" y="6" width="4" height="15" rx="1" /><rect x="16" y="2" width="4" height="19" rx="1" />
        </svg>
        <p className="text-sm text-dui-text-muted">No chartable columns detected in this result.</p>
        <p className="text-xs text-dui-text-muted opacity-60">Results need at least one numeric and one text column.</p>
      </div>
    );
  }

  const { labelKey, valueKey } = cols;
  const maxValue = Math.max(...rows.map((r) => Number(r[valueKey] ?? 0)));
  const xSteps = 5;

  // Human-friendly column labels
  const humanLabel = (k: string) =>
    k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="flex flex-col h-full p-6 gap-6">
      {/* Chart heading */}
      <div>
        <div className="text-sm font-semibold text-dui-text-primary">
          {humanLabel(valueKey)} by {humanLabel(labelKey)}
        </div>
        <div className="text-xs text-dui-text-muted mt-0.5">
          {entity} · {rows.length} row{rows.length !== 1 ? 's' : ''} · auto-selected bar chart
        </div>
      </div>

      {/* SVG gradient defs (hidden) */}
      <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
        <defs>
          {BAR_GRADIENTS.map((g) => (
            <linearGradient key={g.id} id={`dui-${g.id}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%"   stopColor={g.from} />
              <stop offset="100%" stopColor={g.to} />
            </linearGradient>
          ))}
        </defs>
      </svg>

      {/* Bars */}
      <div className="flex flex-col gap-2.5 flex-1 justify-center">
        {rows.map((row, i) => {
          const label     = String(row[labelKey] ?? '—');
          const value     = Number(row[valueKey] ?? 0);
          const pct       = maxValue > 0 ? (value / maxValue) * 100 : 0;
          const rankLabel =['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'][i] ?? `${i + 1}`;

          return (
            <div key={i} className="flex items-center gap-3">
              {/* Rank */}
              <span
                className="text-xs font-bold w-5 flex-shrink-0 text-right"
                style={{
                  color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : undefined,
                }}
              >
                {rankLabel}
              </span>

              {/* Label */}
              <div
                className="text-xs text-dui-text-secondary text-right flex-shrink-0 overflow-hidden"
                style={{ width: 140 }}
                title={label}
              >
                {formatLabel(label)}
              </div>

              {/* Bar track */}
              <div className="flex-1 relative rounded" style={{ height: 26, background: 'var(--dui-surface-tertiary)' }}>
                <div
                  className="absolute inset-y-0 left-0 rounded flex items-center justify-end pr-2.5 transition-all"
                  style={{
                    width: `${Math.max(pct, 4)}%`,
                    background: `url('#') linear-gradient(90deg, ${BAR_GRADIENTS[Math.min(i, BAR_GRADIENTS.length - 1)].from}, ${BAR_GRADIENTS[Math.min(i, BAR_GRADIENTS.length - 1)].to})`,
                  }}
                >
                  <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>
                    {formatValue(value)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-dui-text-muted font-mono" style={{ paddingLeft: 176 }}>
        {Array.from({ length: xSteps + 1 }, (_, i) => (
          <span key={i}>{formatValue(Math.round((maxValue / xSteps) * i))}</span>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap text-xs text-dui-text-muted">
        <div className="flex items-center gap-1.5">
          <div
            className="rounded-sm"
            style={{ width: 10, height: 10, background: `linear-gradient(135deg, ${BAR_GRADIENTS[0].from}, ${BAR_GRADIENTS[0].to})` }}
          />
          <span>{humanLabel(valueKey)}</span>
        </div>
        <span className="ml-auto opacity-50">Chart type chosen automatically</span>
      </div>
    </div>
  );
}
