interface FKCellProps {
  value: unknown;
  targetEntity: string;
  targetField: string;
  onNavigate?: (entity: string, pk: string) => void;
}

export function FKCell({ value, targetEntity, onNavigate }: FKCellProps) {
  if (value === null || value === undefined) {
    return <span className="text-dui-text-muted italic">—</span>;
  }

  const str = String(value);

  if (onNavigate) {
    return (
      <button
        type="button"
        onClick={() => onNavigate(targetEntity, str)}
        className={[
          'text-dui-primary hover:underline text-sm font-mono',
          'focus:outline-none dui-focus-ring rounded',
        ].join(' ')}
        title={`Navigate to ${targetEntity} ${str}`}
      >
        {str.length > 12 ? str.slice(0, 8) + '…' : str}
      </button>
    );
  }

  return (
    <span className="font-mono text-xs text-dui-text-secondary" title={str}>
      {str.length > 12 ? str.slice(0, 8) + '…' : str}
    </span>
  );
}
