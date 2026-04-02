interface TextCellProps {
  value: unknown;
  truncate?: boolean;
  maxLength?: number;
}

export function TextCell({ value, truncate = true, maxLength = 80 }: TextCellProps) {
  if (value === null || value === undefined) {
    return <span className="text-dui-text-muted italic">—</span>;
  }

  const str = String(value);
  const truncated = truncate && str.length > maxLength;
  const display = truncated ? `${str.slice(0, maxLength)}…` : str;

  return (
    <span
      title={truncated ? str : undefined}
      className="text-dui-text-primary"
    >
      {display}
    </span>
  );
}
