import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import type { FieldMeta, Sort } from '../../../lib/types';

interface DataTableHeaderProps {
  fields: FieldMeta[];
  sort?: Sort;
  onSort: (field: string) => void;
}

export function DataTableHeader({ fields, sort, onSort }: DataTableHeaderProps) {
  return (
    <thead>
      <tr className="bg-dui-table-header border-b border-dui-border">
        {fields.map((field) => {
          const isSorted = sort?.field === field.name;
          const direction = isSorted ? sort?.direction : undefined;

          return (
            <th
              key={field.name}
              scope="col"
              style={field.display?.width ? { width: field.display.width } : undefined}
              className="px-4 py-2.5 text-left"
            >
              <button
                type="button"
                onClick={() => onSort(field.name)}
                className={[
                  'inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide',
                  'text-dui-text-secondary hover:text-dui-text-primary',
                  'focus:outline-none dui-focus-ring rounded',
                ].join(' ')}
                aria-sort={
                  isSorted
                    ? direction === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
              >
                {field.label}
                {isSorted ? (
                  direction === 'asc' ? (
                    <ArrowUp size={12} />
                  ) : (
                    <ArrowDown size={12} />
                  )
                ) : (
                  <ArrowUpDown size={12} className="opacity-40" />
                )}
              </button>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
