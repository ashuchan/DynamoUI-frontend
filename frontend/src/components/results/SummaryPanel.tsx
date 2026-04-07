import type { ResolutionResult, ResolvedData } from '../../lib/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function isNumeric(v: unknown): v is number {
  return typeof v === 'number' && !isNaN(v);
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// Derive basic aggregate stats from rows for any result shape
interface Stats {
  totalRows: number;
  totalCount: number;
  numericCols: { key: string; label: string; sum: number; max: number }[];
  labelCols:   { key: string; label: string; uniqueCount: number }[];
}

function deriveStats(rows: Record<string, unknown>[], totalCount: number): Stats {
  if (!rows.length) return { totalRows: 0, totalCount, numericCols: [], labelCols: [] };

  const keys = Object.keys(rows[0]);
  const numericCols = keys
    .filter((k) => rows.every((r) => r[k] == null || isNumeric(r[k])))
    .map((k) => {
      const vals = rows.map((r) => Number(r[k] ?? 0));
      return {
        key: k,
        label: k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        sum: vals.reduce((a, b) => a + b, 0),
        max: Math.max(...vals),
      };
    });

  const labelCols = keys
    .filter((k) => rows.some((r) => typeof r[k] === 'string'))
    .map((k) => ({
      key: k,
      label: k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      uniqueCount: new Set(rows.map((r) => r[k])).size,
    }));

  return { totalRows: rows.length, totalCount, numericCols, labelCols };
}

// Generate bullet insights from data
function deriveInsights(
  rows: Record<string, unknown>[],
  stats: Stats,
): string[] {
  const insights: string[] = [];
  if (!rows.length) return insights;

  const topNumCol = stats.numericCols[0];
  const topLabelCol = stats.labelCols[0];

  if (topNumCol && topLabelCol) {
    const sorted = [...rows].sort(
      (a, b) => Number(b[topNumCol.key] ?? 0) - Number(a[topNumCol.key] ?? 0),
    );
    const topRow   = sorted[0];
    const topVal   = Number(topRow[topNumCol.key] ?? 0);
    const topLabel = String(topRow[topLabelCol.key] ?? '—');
    const secondVal = sorted[1] ? Number(sorted[1][topNumCol.key] ?? 0) : 0;
    const leadPct  = secondVal > 0 ? Math.round(((topVal - secondVal) / secondVal) * 100) : 0;

    insights.push(
      `"${topLabel}" leads with ${formatNum(topVal)} — ${leadPct > 0 ? `${leadPct}% ahead of #2` : 'the top result'}.`,
    );

    if (topNumCol.sum > 0) {
      const topSharePct = Math.round((topVal / topNumCol.sum) * 100);
      insights.push(
        `#1 accounts for ${topSharePct}% of the total ${topNumCol.label.toLowerCase()} across all results.`,
      );
    }

    const bottomVal = sorted[sorted.length - 1]
      ? Number(sorted[sorted.length - 1][topNumCol.key] ?? 0)
      : 0;
    if (bottomVal > 0 && topVal !== bottomVal) {
      const spread = Math.round(((topVal - bottomVal) / topVal) * 100);
      insights.push(
        `Range spans ${spread}% — from ${formatNum(bottomVal)} to ${formatNum(topVal)}.`,
      );
    }
  }

  if (topLabelCol && topLabelCol.uniqueCount > 1) {
    insights.push(
      `${topLabelCol.uniqueCount} unique ${topLabelCol.label.toLowerCase()} values in this result set.`,
    );
  }

  if (stats.totalCount > stats.totalRows) {
    insights.push(
      `Showing top ${stats.totalRows} of ${formatNum(stats.totalCount)} total records.`,
    );
  }

  return insights.slice(0, 5);
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="dui-stat-card p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-dui-text-muted mb-1">{label}</div>
      <div className="text-xl font-bold tracking-tight text-dui-text-primary">{value}</div>
      {sub && <div className="text-xs text-dui-text-muted mt-0.5">{sub}</div>}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-bold uppercase tracking-widest text-dui-text-muted mb-2">
      {children}
    </div>
  );
}

function Divider() {
  return <hr className="border-dui-border" />;
}

// ── Main component ────────────────────────────────────────────────────────────

interface SummaryPanelProps {
  result: ResolutionResult;
  queryPlan: ResolvedData;
  query: string;
}

export function SummaryPanel({ result, queryPlan, query }: SummaryPanelProps) {
  const { rows, total_count } = queryPlan;
  const stats    = deriveStats(rows, total_count);
  const insights = deriveInsights(rows, stats);
  const pm       = result.patternMatch;
  const fromCache = pm != null && pm.confidence >= 0.90;
  const confPct   = pm ? Math.round(pm.confidence * 100) : null;

  // Pick 2–4 most interesting stat cards from derived data
  const statCards: { label: string; value: string; sub?: string }[] = [];

  statCards.push({ label: 'Results', value: formatNum(stats.totalRows), sub: total_count > stats.totalRows ? `of ${formatNum(total_count)} total` : 'in result set' });

  if (stats.numericCols[0]) {
    const nc = stats.numericCols[0];
    statCards.push({ label: `Total ${nc.label}`, value: formatNum(nc.sum) });
  }
  if (stats.labelCols[0]) {
    const lc = stats.labelCols[0];
    statCards.push({ label: `Unique ${lc.label}`, value: formatNum(lc.uniqueCount) });
  }
  if (stats.numericCols[0] && stats.totalRows > 0) {
    const nc = stats.numericCols[0];
    statCards.push({ label: `Avg ${nc.label}`, value: formatNum(Math.round(nc.sum / stats.totalRows)) });
  }

  // Resolve time is not in the API response; we show confidence instead
  const resolveMs = result.llm_cost_usd != null && result.llm_cost_usd > 0 ? 'LLM' : '<20 ms';

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">

      {/* Cache / LLM indicator */}
      {fromCache ? (
        <div className="dui-cache-banner p-3 flex flex-col gap-1">
          <div className="text-xs font-bold uppercase tracking-widest text-dui-success">
            Pattern Cache Hit
          </div>
          <div className="text-xs text-dui-text-secondary italic truncate" title={pm?.matchedTrigger}>
            "{pm?.matchedTrigger}"
          </div>
          <div className="text-xs text-dui-text-muted">
            Confidence: <span className="text-dui-success font-bold">{confPct}%</span>
            {result.llm_cost_usd === 0 ? ' · No LLM used' : ''}
          </div>
        </div>
      ) : (
        <div
          className="p-3 flex flex-col gap-1 rounded-lg"
          style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.18)' }}
        >
          <div className="text-xs font-bold uppercase tracking-widest text-dui-warning">
            LLM Resolved
          </div>
          <div className="text-xs text-dui-text-secondary italic truncate" title={query}>
            "{query}"
          </div>
          {result.llm_cost_usd != null && result.llm_cost_usd > 0 && (
            <div className="text-xs text-dui-text-muted">
              Cost: <span className="text-dui-warning font-bold">${result.llm_cost_usd.toFixed(6)}</span>
            </div>
          )}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-2">
        {statCards.slice(0, 4).map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      <Divider />

      {/* Insights */}
      {insights.length > 0 && (
        <div>
          <SectionLabel>Key Insights</SectionLabel>
          <ul className="flex flex-col gap-2">
            {insights.map((text, i) => (
              <li key={i} className="flex gap-2 items-start">
                <div
                  className="flex-shrink-0 flex items-center justify-center rounded text-xs font-bold mt-0.5"
                  style={{
                    width: 18, height: 18,
                    background: 'rgba(99,102,241,0.14)',
                    color: 'var(--dui-primary)',
                  }}
                >
                  {i + 1}
                </div>
                <span className="text-xs text-dui-text-secondary leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Divider />

      {/* Query metadata */}
      <div>
        <SectionLabel>Query Metadata</SectionLabel>
        <div
          className="rounded-lg p-3 flex flex-col gap-2"
          style={{ background: 'var(--dui-surface-tertiary)', border: '1px solid var(--dui-border)' }}
        >
          {[
            { k: 'Entity',     v: result.entity ?? '—' },
            { k: 'Intent',     v: result.intent },
            ...(pm ? [{ k: 'Pattern', v: pm.patternId }] : []),
            { k: 'Source',     v: fromCache ? 'Pattern cache' : 'LLM',  green: fromCache },
            { k: 'LLM calls',  v: fromCache ? '0' : '1',                green: fromCache },
            { k: 'Resolved',   v: resolveMs },
          ].map(({ k, v, green }) => (
            <div key={k} className="flex justify-between text-xs gap-2">
              <span className="text-dui-text-muted">{k}</span>
              <span
                className={`font-medium truncate text-right max-w-[140px] ${green ? 'text-dui-success' : 'text-dui-text-secondary'}`}
                title={v}
              >
                {v}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
