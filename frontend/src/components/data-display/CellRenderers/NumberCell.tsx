interface NumberCellProps {
  value: unknown;
  format?: string;
}

export function NumberCell({ value, format }: NumberCellProps) {
  if (value === null || value === undefined) {
    return <span className="text-dui-text-muted italic">—</span>;
  }

  const num = Number(value);
  if (isNaN(num)) {
    return <span className="text-dui-text-primary">{String(value)}</span>;
  }

  let formatted: string;
  if (format === 'currency') {
    formatted = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  } else if (format === 'percent') {
    formatted = new Intl.NumberFormat(undefined, {
      style: 'percent',
      minimumFractionDigits: 1,
    }).format(num / 100);
  } else {
    formatted = new Intl.NumberFormat().format(num);
  }

  return (
    <span className="text-dui-text-primary tabular-nums">
      {formatted}
    </span>
  );
}
