interface DateCellProps {
  value: unknown;
  format?: string;
}

export function DateCell({ value, format }: DateCellProps) {
  if (value === null || value === undefined) {
    return <span className="text-dui-text-muted italic">—</span>;
  }

  const dateStr = String(value);
  let display: string;
  let title: string | undefined;

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return <span className="text-dui-text-primary">{dateStr}</span>;
    }

    title = date.toISOString();

    if (format === 'datetime') {
      display = new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
    } else {
      display = new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
      }).format(date);
    }
  } catch {
    return <span className="text-dui-text-primary">{dateStr}</span>;
  }

  return (
    <time dateTime={dateStr} title={title} className="text-dui-text-primary tabular-nums">
      {display}
    </time>
  );
}
