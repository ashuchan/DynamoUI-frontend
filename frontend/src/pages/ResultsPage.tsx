import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { DataTable } from '../components/data-display/DataTable/DataTable';
import { ChartPanel } from '../components/results/ChartPanel';
import { SummaryPanel } from '../components/results/SummaryPanel';
import { ActionRail, type ActionRailAction } from '../components/shell/ActionRail';
import { SaveViewModal } from '../components/saved-view/SaveViewModal';
import { apiClient } from '../lib/apiClient';
import { queryKeys } from '../lib/queryKeys';
import { useSessionStore } from '../lib/sessionStore';
import type { ResolvedData, ResolutionResult } from '../lib/types';

// Adapter: ExecutedResult → the legacy ResolvedData shape that DataTable /
// ChartPanel / SummaryPanel were built against. As those components migrate
// to consume Provenance directly we can drop this adapter.
function toLegacyResolved(rows: Record<string, unknown>[]): ResolvedData {
  return { rows, total_count: rows.length };
}

function toLegacyResolution(
  rows: Record<string, unknown>[],
  entity: string,
  provConfidence: number,
): ResolutionResult {
  return {
    intent: 'READ',
    entity,
    confidence: provConfidence,
    query_plan: toLegacyResolved(rows),
  };
}

export function ResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = useSessionStore((s) =>
    sessionId ? s.results[sessionId] : undefined,
  );
  const [showSaveModal, setShowSaveModal] = useState(false);

  const entity = useMemo(() => {
    if (!session) return undefined;
    const plan = session.executed.provenance.queryPlan as { entity?: string };
    return plan?.entity;
  }, [session]);

  const pinMutation = useMutation({
    mutationFn: (savedViewId: string) =>
      apiClient.createPin({ sourceType: 'saved_view', sourceId: savedViewId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.home() });
      queryClient.invalidateQueries({ queryKey: queryKeys.pins() });
    },
  });

  if (!session || !entity) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2 p-4 rounded-md border border-dui-border bg-dui-surface text-dui-text-secondary">
          <AlertCircle size={14} />
          <span className="text-sm">
            Result session expired. Run the query again.
          </span>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="ml-2 text-xs text-dui-primary hover:underline"
          >
            Go home →
          </button>
        </div>
      </div>
    );
  }

  const { executed, input } = session;
  const rows = executed.result.rows ?? [];
  const resolved = toLegacyResolved(rows);
  // Legacy confidence: prefer the pattern-match score when the row came from the
  // cache; otherwise fall back to 1.0 for verifier-approved results. Note the old
  // ``1 - llmCostUsd`` computation mixed dollars into a [0,1] score — meaningless.
  const legacyConfidence =
    executed.provenance.patternMatchConfidence ??
    (executed.provenance.verifierVerified ? 1 : 0);
  const legacyResolution = toLegacyResolution(rows, entity, legacyConfidence);

  function handleRowClick(e: string, pk: string) {
    navigate(`/entities/${e}/${encodeURIComponent(pk)}`);
  }

  async function handleAction(action: ActionRailAction) {
    switch (action) {
      case 'save_view':
        setShowSaveModal(true);
        break;
      case 'pin': {
        // Pinning requires a saved view first — open save modal.
        setShowSaveModal(true);
        break;
      }
      case 'copy_link':
        await navigator.clipboard.writeText(window.location.href);
        break;
      case 'export_csv':
      case 'export_xlsx': {
        const csv = [
          Object.keys(rows[0] ?? {}).join(','),
          ...rows.map((r) =>
            Object.values(r)
              .map((v) => (v == null ? '' : `"${String(v).replace(/"/g, '""')}"`))
              .join(','),
          ),
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${entity}-${executed.sessionId}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        break;
      }
      default:
        // chart_*, alert, schedule, refine, edit_as_nl, share — land in future F-slices
        break;
    }
  }

  return (
    <>
      <div
        className="flex-1 grid"
        style={{
          gridTemplateColumns: '340px 1fr 280px',
          minHeight: 'calc(100vh - 52px)',
          overflow: 'hidden',
        }}
      >
        {/* ── LEFT — Data table ── */}
        <div className="flex flex-col overflow-hidden border-r border-dui-border">
          <PanelHeader label="Results" count={rows.length} />
          <div className="flex-1 overflow-y-auto">
            <DataTable
              entity={entity}
              resolvedData={resolved}
              onRowClick={handleRowClick}
            />
          </div>
        </div>

        {/* ── CENTER — Chart ── */}
        <div
          className="flex flex-col overflow-hidden border-r border-dui-border"
          style={{ background: 'var(--dui-surface)' }}
        >
          <PanelHeader label="Visualisation" />
          <div className="flex-1 overflow-hidden">
            <ChartPanel queryPlan={resolved} entity={entity} />
          </div>
        </div>

        {/* ── RIGHT — Summary (narrower; ActionRail lives next to it) ── */}
        <div className="flex overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--dui-surface)' }}>
            <PanelHeader label="Analysis" />
            <div className="flex-1 overflow-y-auto">
              <SummaryPanel
                result={legacyResolution}
                queryPlan={resolved}
                query={input}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Floating action rail (absolute so it doesn't disturb the 3-panel grid) */}
      <div
        className="fixed top-[52px] right-0 bottom-0 z-30"
        style={{ width: 280 }}
      >
        <ActionRail executed={executed} onTrigger={handleAction} />
      </div>

      {showSaveModal && (
        <SaveViewModal
          executed={executed}
          nlInput={input}
          entity={entity}
          onClose={() => setShowSaveModal(false)}
          onSaved={(id) => pinMutation.mutate(id)}
        />
      )}
    </>
  );
}

function PanelHeader({ label, count }: { label: string; count?: number }) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-3 border-b border-dui-border flex-shrink-0"
      style={{ background: 'var(--dui-surface)' }}
    >
      <span className="text-xs font-semibold uppercase tracking-widest text-dui-text-muted">
        {label}
      </span>
      {count != null && (
        <span
          className="ml-auto text-xs text-dui-text-muted"
          style={{ background: 'var(--dui-surface-tertiary)', borderRadius: 5, padding: '2px 7px' }}
        >
          {count} row{count !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}
