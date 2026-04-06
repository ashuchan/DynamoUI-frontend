import type { FieldMeta } from '../../../lib/types';
import { TextCell } from '../CellRenderers/TextCell';
import { NumberCell } from '../CellRenderers/NumberCell';
import { BooleanCell } from '../CellRenderers/BooleanCell';
import { DateCell } from '../CellRenderers/DateCell';
import { EnumCell } from '../CellRenderers/EnumCell';
import { UUIDCell } from '../CellRenderers/UUIDCell';
import { FKCell } from '../CellRenderers/FKCell';
import { SensitiveCell } from '../CellRenderers/SensitiveCell';

interface DetailCardFieldProps {
  field: FieldMeta;
  value: unknown;
  onNavigate?: (entity: string, pk: string) => void;
}

function FieldValue({
  field,
  value,
  onNavigate,
}: DetailCardFieldProps) {
  if (field.sensitive) {
    return <SensitiveCell value={value} fieldName={field.name} />;
  }

  switch (field.type) {
    case 'integer':
    case 'float':
      return <NumberCell value={value} format={field.display?.format} />;
    case 'boolean':
      return <BooleanCell value={value} />;
    case 'date':
      return <DateCell value={value} format={field.display?.format} />;
    case 'uuid':
      if (field.fk && onNavigate) {
        return (
          <FKCell
            value={value}
            targetEntity={field.fk.entity}
            targetField={field.fk.field}
            onNavigate={onNavigate}
          />
        );
      }
      return <UUIDCell value={value} truncate={false} />;
    case 'enum':
      return field.enumRef ? (
        <EnumCell value={value} enumRef={field.enumRef} />
      ) : (
        <TextCell value={value} truncate={false} />
      );
    case 'json':
      return (
        <pre className="text-xs bg-dui-surface-secondary rounded p-2 overflow-auto max-h-32 text-dui-text-primary">
          {value === null || value === undefined
            ? '—'
            : JSON.stringify(value, null, 2)}
        </pre>
      );
    default:
      return <TextCell value={value} truncate={false} />;
  }
}

export function DetailCardField({
  field,
  value,
  onNavigate,
}: DetailCardFieldProps) {
  return (
    <div className="grid grid-cols-3 gap-4 py-3 border-b border-dui-border last:border-b-0">
      <dt className="text-sm font-medium text-dui-text-secondary flex items-start">
        {field.label}
        {field.isPK && (
          <span className="ml-1 text-xs text-dui-text-muted">(PK)</span>
        )}
        {field.sensitive && (
          <span className="ml-1 text-xs text-dui-warning">(sensitive)</span>
        )}
      </dt>
      <dd className="col-span-2 text-sm">
        <FieldValue field={field} value={value} onNavigate={onNavigate} />
      </dd>
    </div>
  );
}
