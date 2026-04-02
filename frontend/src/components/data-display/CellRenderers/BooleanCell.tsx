import { Check, X } from 'lucide-react';

interface BooleanCellProps {
  value: unknown;
}

export function BooleanCell({ value }: BooleanCellProps) {
  if (value === null || value === undefined) {
    return <span className="text-dui-text-muted italic">—</span>;
  }

  const bool = Boolean(value);

  return bool ? (
    <span className="inline-flex items-center gap-1 text-dui-success" aria-label="Yes">
      <Check size={14} />
      <span className="text-xs">Yes</span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-dui-danger" aria-label="No">
      <X size={14} />
      <span className="text-xs">No</span>
    </span>
  );
}
