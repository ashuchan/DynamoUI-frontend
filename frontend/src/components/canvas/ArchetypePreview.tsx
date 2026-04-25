import type { LayoutArchetype, PreviewData, PreviewField } from '../../types/canvas';

interface Props {
  preview: PreviewData;
}

// Switches between the five archetype skeletons. We render a lightweight
// preview table here rather than the full app DataTable — DataTable is wired
// to /schema/{entity}/* endpoints which don't exist for synthetic entities,
// and Canvas needs the read-only constraint enforced at the component level.
export function ArchetypePreview({ preview }: Props) {
  const archetype: LayoutArchetype = preview.archetype;

  if (archetype === 'kanban') return <KanbanArchetype preview={preview} />;
  if (archetype === 'timeline') return <TimelineArchetype preview={preview} />;
  if (archetype === 'data_entry') return <DataEntryArchetype preview={preview} />;
  if (archetype === 'review_audit') return <ReviewAuditArchetype preview={preview} />;
  return <DashboardArchetype preview={preview} />;
}

function visibleFields(preview: PreviewData): PreviewField[] {
  return preview.fields.filter((f) => f.column_priority !== 'low');
}

function formatCell(value: unknown, field: PreviewField): string {
  if (value === null || value === undefined) return '—';
  if (field.is_monetary && typeof value === 'number') {
    return value.toLocaleString(undefined, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    });
  }
  return String(value);
}

function PreviewTable({ preview }: { preview: PreviewData }) {
  const fields = visibleFields(preview);
  return (
    <div
      className="overflow-x-auto border border-dui-border rounded-md bg-dui-surface"
      data-testid="canvas-preview-table"
    >
      <table className="w-full text-xs">
        <thead className="bg-dui-surface-tertiary text-dui-text-secondary">
          <tr>
            {fields.map((f) => (
              <th key={f.name} className="text-left font-medium px-3 py-2">
                {f.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {preview.rows.map((row, i) => (
            <tr key={i} className="border-t border-dui-border">
              {fields.map((f) => (
                <td
                  key={f.name}
                  className={[
                    'px-3 py-2 text-dui-text-primary',
                    f.is_status ? 'font-medium' : '',
                  ].join(' ')}
                >
                  {f.is_status ? (
                    <span className="inline-flex items-center rounded-full bg-dui-badge-bg px-2 py-0.5 text-[10px] text-dui-badge-text">
                      {formatCell(row[f.name], f)}
                    </span>
                  ) : (
                    formatCell(row[f.name], f)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetricCard({
  field,
  rows,
}: {
  field: string;
  rows: Record<string, unknown>[];
}) {
  const total = rows.reduce((sum, r) => sum + Number(r[field] ?? 0), 0);
  return (
    <div className="bg-dui-surface-secondary rounded-md p-3 border border-dui-border">
      <p className="text-[10px] uppercase tracking-wide text-dui-text-secondary">
        {field.replace(/_/g, ' ')}
      </p>
      <p className="text-lg font-semibold text-dui-text-primary">
        {total.toLocaleString()}
      </p>
    </div>
  );
}

function DashboardArchetype({ preview }: Props) {
  return (
    <div
      className="bg-dui-surface p-4 space-y-4"
      data-testid="canvas-archetype-dashboard"
    >
      {preview.metric_fields.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {preview.metric_fields.slice(0, 4).map((field) => (
            <MetricCard key={field} field={field} rows={preview.rows} />
          ))}
        </div>
      )}
      <PreviewTable preview={preview} />
    </div>
  );
}

function DataEntryArchetype({ preview }: Props) {
  const fields = preview.fields.slice(0, 5);
  return (
    <div
      className="flex bg-dui-surface"
      style={{ height: 360 }}
      data-testid="canvas-archetype-data_entry"
    >
      <div className="w-1/2 border-r border-dui-border overflow-auto p-3">
        <PreviewTable preview={{ ...preview, rows: preview.rows.slice(0, 5) }} />
      </div>
      <div className="w-1/2 p-4 bg-dui-surface-secondary">
        <p className="text-xs text-dui-text-muted mb-3">Edit panel</p>
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.name}>
              <label className="block text-xs font-medium text-dui-text-secondary mb-1">
                {f.label}
              </label>
              <div className="h-8 rounded bg-dui-surface border border-dui-border" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewAuditArchetype({ preview }: Props) {
  return (
    <div
      className="bg-dui-surface p-3"
      data-testid="canvas-archetype-review_audit"
    >
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium text-dui-text-primary">
          {preview.entity} — {preview.rows.length} records
        </span>
        <div className="flex gap-2">
          <div className="h-7 w-20 rounded bg-dui-surface-tertiary border border-dui-border" />
          <div className="h-7 w-24 rounded bg-dui-primary opacity-80" />
        </div>
      </div>
      <PreviewTable preview={preview} />
    </div>
  );
}

function KanbanArchetype({ preview }: Props) {
  const statusField = preview.fields.find((f) => f.is_status);
  const statusValues = statusField
    ? Array.from(
        new Set(preview.rows.map((r) => String(r[statusField.name] ?? ''))),
      ).filter((v) => v !== '')
    : ['Pending', 'In Progress', 'Done'];

  const labelField = preview.fields[0];

  return (
    <div
      className="flex gap-3 p-4 bg-dui-surface overflow-x-auto"
      style={{ minHeight: 280 }}
      data-testid="canvas-archetype-kanban"
    >
      {statusValues.slice(0, 4).map((status) => {
        const cards = statusField
          ? preview.rows.filter((r) => String(r[statusField.name]) === status)
          : preview.rows.slice(0, 3);
        return (
          <div key={status} className="flex-shrink-0 w-52">
            <div className="bg-dui-surface-secondary rounded-md p-2">
              <p className="text-xs font-semibold text-dui-text-secondary mb-2 px-1">
                {status} <span className="text-dui-text-muted">({cards.length})</span>
              </p>
              {cards.slice(0, 3).map((row, i) => (
                <div
                  key={i}
                  className="bg-dui-surface rounded border border-dui-border p-2 mb-2 text-xs text-dui-text-primary"
                >
                  {labelField ? formatCell(row[labelField.name], labelField) : '—'}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TimelineArchetype({ preview }: Props) {
  const labelField = preview.fields[0];
  const timeField =
    preview.fields.find((f) => /at|date|time/.test(f.name)) ?? preview.fields[1];

  return (
    <div
      className="p-4 bg-dui-surface space-y-3"
      data-testid="canvas-archetype-timeline"
    >
      {preview.rows.slice(0, 5).map((row, i) => (
        <div key={i} className="flex gap-3 items-start">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-dui-primary mt-0.5" />
            {i < Math.min(preview.rows.length, 5) - 1 && (
              <div
                className="w-px flex-1 bg-dui-border mt-1"
                style={{ minHeight: 24 }}
              />
            )}
          </div>
          <div className="flex-1 pb-3">
            <p className="text-xs font-medium text-dui-text-primary">
              {labelField ? formatCell(row[labelField.name], labelField) : '—'}
            </p>
            {timeField && (
              <p className="text-xs text-dui-text-muted">
                {formatCell(row[timeField.name], timeField)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
