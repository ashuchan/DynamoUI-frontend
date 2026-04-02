import { Database } from 'lucide-react';

interface DataTableEmptyProps {
  hasFilters: boolean;
}

export function DataTableEmpty({ hasFilters }: DataTableEmptyProps) {
  return (
    <tr>
      <td colSpan={999}>
        <div className="flex flex-col items-center justify-center py-16 text-dui-text-muted">
          <Database size={40} className="mb-4 opacity-40" />
          <p className="text-sm font-medium">
            {hasFilters ? 'No records match the current filters' : 'No records found'}
          </p>
          {hasFilters && (
            <p className="text-xs mt-1">Try clearing some filters to see more results</p>
          )}
        </div>
      </td>
    </tr>
  );
}
