import { Search, X } from 'lucide-react';
import { useState } from 'react';
import type { FieldMeta, Filters } from '../../../lib/types';
import { EnumDropdown } from '../CellRenderers/EnumCell';

interface DataTableFilterProps {
  fields: FieldMeta[];
  filters: Filters;
  searchableFields: string[];
  onFilterChange: (field: string, op: string, value: unknown) => void;
}

export function DataTableFilter({
  fields,
  filters,
  searchableFields,
  onFilterChange,
}: DataTableFilterProps) {
  const [searchText, setSearchText] = useState('');

  const searchableFieldMetas = fields.filter((f) =>
    searchableFields.includes(f.name),
  );

  const firstSearchable = searchableFieldMetas[0];

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (firstSearchable) {
      onFilterChange(firstSearchable.name, 'like', searchText);
    }
  }

  function clearAllFilters() {
    setSearchText('');
    for (const field of Object.keys(filters)) {
      onFilterChange(field, 'eq', '');
    }
  }

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="flex flex-col gap-3 p-3 border-b border-dui-border bg-dui-surface-secondary">
      {/* Quick search */}
      {firstSearchable && (
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dui-text-muted"
            />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={`Search by ${firstSearchable.label}…`}
              className={[
                'w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-dui-border',
                'bg-dui-surface text-dui-text-primary placeholder:text-dui-text-muted',
                'focus:outline-none focus:border-dui-border',
              ].join(' ')}
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 text-sm rounded-md bg-dui-primary text-dui-surface font-medium hover:opacity-90 focus:outline-none dui-focus-ring"
          >
            Search
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-dui-border text-dui-text-secondary hover:bg-dui-surface-tertiary focus:outline-none dui-focus-ring"
            >
              <X size={12} />
              Clear
            </button>
          )}
        </form>
      )}

      {/* Enum filters */}
      <div className="flex flex-wrap gap-2">
        {fields
          .filter((f) => f.type === 'enum' && f.enumRef && f.display?.visible !== false)
          .map((field) => (
            <div key={field.name} className="flex items-center gap-1">
              <label className="text-xs text-dui-text-secondary font-medium">
                {field.label}:
              </label>
              <div className="w-36">
                <EnumDropdown
                  enumName={field.enumRef!}
                  value={String(filters[field.name]?.value ?? '')}
                  onChange={(v) => onFilterChange(field.name, 'eq', v)}
                  mode="filter"
                />
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
