interface UUIDCellProps {
  value: unknown;
  truncate?: boolean;
}

export function UUIDCell({ value, truncate = true }: UUIDCellProps) {
  if (value === null || value === undefined) {
    return <span className="text-dui-text-muted italic">—</span>;
  }

  const str = String(value);
  const display = truncate ? str.slice(0, 8) + '…' : str;

  return (
    <span
      title={str}
      className="font-mono text-xs text-dui-text-secondary tracking-tight"
    >
      {display}
    </span>
  );
}
