import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/apiClient';
import { queryKeys } from '../../../lib/queryKeys';

interface EnumCellProps {
  value: unknown;
  enumRef: string;
}

export function EnumCell({ value, enumRef }: EnumCellProps) {
  const { data: options } = useQuery({
    queryKey: queryKeys.enumOptions(enumRef),
    queryFn: () => apiClient.fetchEnumOptions(enumRef),
    staleTime: 5 * 60 * 1000,
  });

  if (value === null || value === undefined) {
    return <span className="text-dui-text-muted italic">—</span>;
  }

  const strValue = String(value);
  const option = options?.find((o) => o.value === strValue);
  const label = option?.label ?? strValue;
  const deprecated = option?.deprecated ?? false;

  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        'bg-dui-badge-bg text-dui-badge-text',
        deprecated ? 'opacity-60 line-through' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      title={deprecated ? `${label} (deprecated)` : undefined}
    >
      {label}
    </span>
  );
}

interface EnumDropdownProps {
  enumName: string;
  value: string;
  onChange: (value: string) => void;
  mode: 'create' | 'edit' | 'filter';
  disabled?: boolean;
  id?: string;
}

export function EnumDropdown({
  enumName,
  value,
  onChange,
  mode,
  disabled = false,
  id,
}: EnumDropdownProps) {
  const { data: options, isLoading } = useQuery({
    queryKey: queryKeys.enumOptions(enumName),
    queryFn: () => apiClient.fetchEnumOptions(enumName),
    staleTime: 5 * 60 * 1000,
  });

  const filtered =
    mode === 'create'
      ? (options ?? []).filter((o) => !o.deprecated)
      : (options ?? []);

  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || isLoading}
      className={[
        'block w-full rounded-md border border-dui-border px-3 py-1.5 text-sm',
        'bg-dui-surface text-dui-text-primary',
        'focus:outline-none focus:border-dui-border',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {mode === 'filter' && <option value="">All</option>}
      {filtered.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
          {opt.deprecated ? ' (deprecated)' : ''}
        </option>
      ))}
    </select>
  );
}
