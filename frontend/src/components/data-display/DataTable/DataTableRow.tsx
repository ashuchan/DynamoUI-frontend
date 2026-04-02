import type { FieldMeta } from '../../../lib/types';
import { DataTableCell } from './DataTableCell';

interface DataTableRowProps {
  row: Record<string, unknown>;
  fields: FieldMeta[];
  entity: string;
  pk: string;
  index: number;
  onRowClick?: (pk: string) => void;
  onNavigate?: (entity: string, pk: string) => void;
}

export function DataTableRow({
  row,
  fields,
  entity,
  pk,
  index,
  onRowClick,
  onNavigate,
}: DataTableRowProps) {
  const isEven = index % 2 === 0;

  return (
    <tr
      onClick={onRowClick ? () => onRowClick(pk) : undefined}
      className={[
        'border-b border-dui-border transition-colors',
        isEven ? '' : 'bg-[var(--dui-table-row-stripe)]',
        onRowClick
          ? 'cursor-pointer hover:bg-[var(--dui-table-row-hover)]'
          : 'hover:bg-[var(--dui-table-row-hover)]',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {fields.map((field) => (
        <DataTableCell
          key={field.name}
          field={field}
          value={row[field.name]}
          entity={entity}
          pk={pk}
          onNavigate={onNavigate}
          editingEnabled={!onRowClick}
        />
      ))}
    </tr>
  );
}
