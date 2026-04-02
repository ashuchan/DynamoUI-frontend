import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface DataTablePaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export function DataTablePagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
}: DataTablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startRow = (page - 1) * pageSize + 1;
  const endRow = Math.min(page * pageSize, totalCount);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const btnBase = [
    'inline-flex items-center justify-center w-8 h-8 rounded',
    'border border-dui-border text-dui-text-secondary text-sm',
    'focus:outline-none dui-focus-ring',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ].join(' ');

  const btnActive = 'hover:bg-dui-surface-secondary';

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-dui-border bg-dui-surface">
      <p className="text-xs text-dui-text-secondary">
        {totalCount === 0
          ? 'No records'
          : `${startRow}–${endRow} of ${totalCount.toLocaleString()} records`}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={!canPrev}
          aria-label="First page"
          className={`${btnBase} ${canPrev ? btnActive : ''}`}
        >
          <ChevronsLeft size={14} />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          aria-label="Previous page"
          className={`${btnBase} ${canPrev ? btnActive : ''}`}
        >
          <ChevronLeft size={14} />
        </button>

        <span className="text-xs text-dui-text-secondary px-2">
          Page {page} of {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
          aria-label="Next page"
          className={`${btnBase} ${canNext ? btnActive : ''}`}
        >
          <ChevronRight size={14} />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={!canNext}
          aria-label="Last page"
          className={`${btnBase} ${canNext ? btnActive : ''}`}
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}
