import {
  useReactTable,
  getCoreRowModel,
} from '@tanstack/react-table';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useDataTable } from './useDataTable';
import { DataTableHeader } from './DataTableHeader';
import { DataTableRow } from './DataTableRow';
import { DataTableEmpty } from './DataTableEmpty';
import { DataTablePagination } from './DataTablePagination';
import { DataTableFilter } from './DataTableFilter';
import type { FieldMeta, ResolvedData } from '../../../lib/types';

interface DataTableProps {
  entity: string;
  resolvedData?: ResolvedData;
  onRowClick?: (entity: string, pk: string) => void;
  onNavigate?: (entity: string, pk: string) => void;
}

function deriveFieldsFromRows(
  rowKeys: string[],
  knownFields: FieldMeta[],
): FieldMeta[] {
  const knownMap = new Map(knownFields.map((f) => [f.name, f]));
  return rowKeys.map(
    (key): FieldMeta =>
      knownMap.get(key) ?? {
        name: key,
        type: 'string',
        label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        isPK: false,
        nullable: true,
        sensitive: false,
      },
  );
}

export function DataTable({ entity, resolvedData, onRowClick, onNavigate }: DataTableProps) {
  const {
    config,
    fields,
    sort,
    page,
    pageSize,
    filters,
    data,
    isLoading,
    isError,
    error,
    handleSort,
    handleFilterChange,
    handlePageChange,
  } = useDataTable({ entity, resolvedData });

  // When resolved data is present, derive columns from actual row keys so that
  // computed columns (e.g. purchase_count) appear and missing non-selected
  // columns (e.g. artist_id that wasn't in GROUP BY) are excluded.
  const visibleFields: FieldMeta[] = resolvedData?.rows.length
    ? deriveFieldsFromRows(Object.keys(resolvedData.rows[0]), fields)
    : config
      ? fields.filter(
          (f) => config.visibleFields.includes(f.name) && f.display?.visible !== false,
        )
      : fields.filter((f) => f.display?.visible !== false);

  // Determine PK field name
  const pkField = fields.find((f) => f.isPK);

  // TanStack Table (manual everything — all logic is server-side)
  const table = useReactTable({
    data: data?.rows ?? [],
    columns: visibleFields.map((f) => ({
      id: f.name,
      accessorKey: f.name,
    })),
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true,
    rowCount: data?.totalCount ?? 0,
  });

  const hasFilters = Object.keys(filters).length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-dui-text-muted">
        <Loader2 size={24} className="animate-spin mr-2" />
        <span className="text-sm">Loading {entity}…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 p-4 text-dui-danger bg-dui-surface border border-dui-border rounded-md">
        <AlertCircle size={16} />
        <span className="text-sm">
          {error instanceof Error ? error.message : 'Failed to load data'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-lg border border-dui-border bg-dui-surface overflow-hidden shadow-sm">
      {/* Filter bar — hidden for resolved (pre-executed) queries */}
      {!resolvedData && (
        <DataTableFilter
          fields={visibleFields}
          filters={filters}
          searchableFields={config?.searchableFields ?? []}
          onFilterChange={handleFilterChange}
        />
      )}

      {/* Table scroll wrapper */}
      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse text-sm"
          aria-label={`${entity} data table`}
        >
          <DataTableHeader
            fields={visibleFields}
            sort={sort}
            onSort={handleSort}
          />
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <DataTableEmpty hasFilters={hasFilters} />
            ) : (
              table.getRowModel().rows.map((_row, index) => {
                const rawRow = data!.rows[index];
                const pk = pkField ? String(rawRow[pkField.name] ?? index) : String(index);

                return (
                  <DataTableRow
                    key={pk}
                    row={rawRow}
                    fields={visibleFields}
                    entity={entity}
                    pk={pk}
                    index={index}
                    onRowClick={
                      onRowClick ? (p) => onRowClick(entity, p) : undefined
                    }
                    onNavigate={onNavigate}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination — hidden for resolved (pre-executed) queries */}
      {data && !resolvedData && (
        <DataTablePagination
          page={page}
          pageSize={pageSize}
          totalCount={data.totalCount}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
