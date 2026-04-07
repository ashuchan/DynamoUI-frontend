import { useState, useRef } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { DataTable } from '../data-display/DataTable/DataTable';
import { ChartPanel } from './ChartPanel';
import { SummaryPanel } from './SummaryPanel';
import { apiClient } from '../../lib/apiClient';
import type { ResolutionResult, ResolvedData } from '../../lib/types';

// ── Panel header ─────────────────────────────────────────────────────────────

function PanelHeader({
  icon,
  title,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-3 border-b border-dui-border flex-shrink-0"
      style={{ background: 'var(--dui-surface)' }}
    >
      <span className="text-dui-text-muted">{icon}</span>
      <span className="text-xs font-semibold uppercase tracking-widest text-dui-text-muted">
        {title}
      </span>
      {badge && <span className="ml-auto">{badge}</span>}
    </div>
  );
}

// ── Top results bar (sticky header above the 3 panels) ───────────────────────

interface ResultsHeaderProps {
  query: string;
  result: ResolutionResult;
  onNewQuery: (query: string, result: ResolutionResult) => void;
  onBack: () => void;
}

function ResultsHeader({ query, result, onNewQuery, onBack }: ResultsHeaderProps) {
  const [input, setInput]       = useState(query);
  const [isLoading, setLoading] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const inputRef                = useRef<HTMLInputElement>(null);
  const fromCache               = result.patternMatch != null && result.patternMatch.confidence >= 0.90;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.resolve(trimmed);
      if (res.entity) {
        onNewQuery(trimmed, res);
      } else {
        setError('Could not determine which data to show.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <header
      className="flex items-center gap-3 px-4 border-b border-dui-border flex-shrink-0"
      style={{ height: 52, background: 'rgba(17,24,39,0.9)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 40 }}
    >
      {/* Brand */}
      <span
        className="text-sm font-bold text-dui-text-primary flex-shrink-0 tracking-tight"
        style={{ letterSpacing: '-0.4px' }}
      >
        Dynamo<span className="text-dui-primary">UI</span>
      </span>

      {/* NL bar */}
      <form onSubmit={handleSubmit} className="flex-1 max-w-xl">
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-1.5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--dui-border)' }}
        >
          {isLoading ? (
            <Loader2 size={13} className="text-dui-primary animate-spin flex-shrink-0" />
          ) : (
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-dui-primary flex-shrink-0" aria-hidden="true">
              <path d="M10 2v2m0 12v2M2 10h2m12 0h2M4.93 4.93l1.41 1.41m7.07 7.07 1.41 1.41M4.93 15.07l1.41-1.41m7.07-7.07 1.41-1.41" strokeLinecap="round" />
              <circle cx="10" cy="10" r="3" fill="currentColor" opacity="0.4" />
            </svg>
          )}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); if (error) setError(null); }}
            maxLength={500}
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm text-dui-text-primary placeholder:text-dui-text-muted focus:outline-none"
            aria-label="Natural language query"
          />
        </div>
        {error && (
          <div className="absolute mt-1 flex items-center gap-1 text-xs text-dui-danger">
            <AlertCircle size={10} />{error}
          </div>
        )}
      </form>

      {/* Cache / LLM badge */}
      <div className="flex-shrink-0">
        {fromCache ? (
          <span className="dui-cache-badge text-xs px-3 py-1">
            Cache · {Math.round((result.patternMatch?.confidence ?? 0) * 100)}%
          </span>
        ) : (
          <span className="dui-llm-badge text-xs px-3 py-1">
            LLM · {Math.round(result.confidence * 100)}%
          </span>
        )}
      </div>

      {/* Back / new query */}
      <button
        type="button"
        onClick={onBack}
        className="flex-shrink-0 text-xs text-dui-text-muted border border-dui-border rounded-lg px-3 py-1.5 hover:text-dui-text-secondary hover:border-dui-text-muted transition-colors"
      >
        ✕ New query
      </button>
    </header>
  );
}

// ── Panel icon helpers ────────────────────────────────────────────────────────

const TableIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
    <rect x="1" y="1" width="14" height="14" rx="2" />
    <line x1="1" y1="5" x2="15" y2="5" />
    <line x1="1" y1="9" x2="15" y2="9" />
    <line x1="1" y1="13" x2="15" y2="13" />
    <line x1="5" y1="5" x2="5" y2="15" />
    <line x1="10" y1="5" x2="10" y2="15" />
  </svg>
);

const ChartIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
    <rect x="1" y="9" width="3" height="6" rx="1" />
    <rect x="6" y="5" width="3" height="10" rx="1" />
    <rect x="11" y="2" width="3" height="13" rx="1" />
  </svg>
);

const InsightIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
    <circle cx="8" cy="8" r="7" />
    <path d="M8 5v4l2 2" strokeLinecap="round" />
  </svg>
);

// ── ResultsLayout ─────────────────────────────────────────────────────────────

interface ResultsLayoutProps {
  query: string;
  result: ResolutionResult;
  onRowClick: (entity: string, pk: string) => void;
  onNewQuery: (query: string, result: ResolutionResult) => void;
  onBack: () => void;
}

export function ResultsLayout({
  query,
  result,
  onRowClick,
  onNewQuery,
  onBack,
}: ResultsLayoutProps) {
  const entity     = result.entity!;
  const queryPlan  = result.query_plan as ResolvedData;

  const rowCount = queryPlan?.rows.length ?? 0;

  return (
    <div
      className="flex flex-col"
      style={{ minHeight: '100vh', background: 'var(--dui-bg)' }}
    >
      <ResultsHeader
        query={query}
        result={result}
        onNewQuery={onNewQuery}
        onBack={onBack}
      />

      {/* 3-panel workspace */}
      <div
        className="flex-1 grid"
        style={{
          gridTemplateColumns: '340px 1fr 280px',
          height: 'calc(100vh - 52px)',
          overflow: 'hidden',
        }}
      >
        {/* ── LEFT — Data table ── */}
        <div
          className="flex flex-col overflow-hidden"
          style={{ borderRight: '1px solid var(--dui-border)' }}
        >
          <PanelHeader
            icon={<TableIcon />}
            title="Results"
            badge={
              <span className="text-xs text-dui-text-muted" style={{ background: 'var(--dui-surface-tertiary)', borderRadius: 5, padding: '2px 7px' }}>
                {rowCount} row{rowCount !== 1 ? 's' : ''}
              </span>
            }
          />
          <div className="flex-1 overflow-y-auto">
            <DataTable
              entity={entity}
              resolvedData={queryPlan}
              onRowClick={onRowClick}
            />
          </div>
        </div>

        {/* ── CENTER — Chart ── */}
        <div
          className="flex flex-col overflow-hidden"
          style={{ borderRight: '1px solid var(--dui-border)', background: 'var(--dui-surface)' }}
        >
          <PanelHeader
            icon={<ChartIcon />}
            title="Visualisation"
            badge={
              <span className="text-xs" style={{ color: 'var(--dui-primary)' }}>Bar · auto-selected</span>
            }
          />
          <div className="flex-1 overflow-hidden">
            {queryPlan ? (
              <ChartPanel queryPlan={queryPlan} entity={entity} />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-dui-text-muted">
                No data to visualise.
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT — Summary / Analysis ── */}
        <div
          className="flex flex-col overflow-hidden"
          style={{ background: 'var(--dui-surface)' }}
        >
          <PanelHeader icon={<InsightIcon />} title="Analysis" />
          <div className="flex-1 overflow-y-auto">
            {queryPlan ? (
              <SummaryPanel result={result} queryPlan={queryPlan} query={query} />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-dui-text-muted">
                No analysis available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
