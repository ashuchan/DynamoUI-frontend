import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface SensitiveCellProps {
  value: unknown;
  fieldName: string;
}

// SensitiveCell: renders as masked dots by default.
// The actual value is never rendered as DOM text while masked.
// Inline editing is always disabled for sensitive fields.
export function SensitiveCell({ value, fieldName }: SensitiveCellProps) {
  const [revealed, setRevealed] = useState(false);

  if (value === null || value === undefined) {
    return <span className="text-dui-text-muted italic">—</span>;
  }

  return (
    <span className="inline-flex items-center gap-1">
      {revealed ? (
        <span className="text-dui-text-primary text-sm">{String(value)}</span>
      ) : (
        <span aria-hidden="true" className="text-dui-text-muted tracking-widest select-none">
          {'••••••••'}
        </span>
      )}
      <button
        type="button"
        onClick={() => setRevealed((r) => !r)}
        aria-label={revealed ? `Hide ${fieldName}` : `Reveal ${fieldName}`}
        className="text-dui-text-muted hover:text-dui-text-secondary focus:outline-none dui-focus-ring rounded"
      >
        {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
      </button>
    </span>
  );
}
