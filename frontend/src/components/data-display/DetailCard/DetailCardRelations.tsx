import { ExternalLink } from 'lucide-react';
import type { FieldMeta } from '../../../lib/types';

interface DetailCardRelationsProps {
  fields: FieldMeta[];
  record: Record<string, unknown>;
  onNavigate: (entity: string, pk: string) => void;
}

export function DetailCardRelations({
  fields,
  record,
  onNavigate,
}: DetailCardRelationsProps) {
  const fkFields = fields.filter((f) => f.fkTarget && !f.sensitive);

  if (fkFields.length === 0) return null;

  return (
    <div className="mt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-dui-text-muted mb-2">
        Related Records
      </h3>
      <div className="flex flex-wrap gap-2">
        {fkFields.map((field) => {
          const value = record[field.name];
          if (value === null || value === undefined) return null;
          const pk = String(value);
          const targetEntity = field.fkTarget!.entity;

          return (
            <button
              key={field.name}
              type="button"
              onClick={() => onNavigate(targetEntity, pk)}
              className={[
                'inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium',
                'border border-dui-border text-dui-text-secondary',
                'hover:bg-dui-surface-secondary focus:outline-none dui-focus-ring',
              ].join(' ')}
            >
              <ExternalLink size={10} />
              {field.label}: {pk.slice(0, 8)}…
            </button>
          );
        })}
      </div>
    </div>
  );
}
