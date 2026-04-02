import type { FieldMeta } from '../../../lib/types';
import { TextCell } from '../CellRenderers/TextCell';
import { NumberCell } from '../CellRenderers/NumberCell';
import { BooleanCell } from '../CellRenderers/BooleanCell';
import { DateCell } from '../CellRenderers/DateCell';
import { EnumCell } from '../CellRenderers/EnumCell';
import { UUIDCell } from '../CellRenderers/UUIDCell';
import { FKCell } from '../CellRenderers/FKCell';
import { SensitiveCell } from '../CellRenderers/SensitiveCell';
import { EditableCell } from '../InlineEdit/EditableCell';

interface DataTableCellProps {
  field: FieldMeta;
  value: unknown;
  entity: string;
  pk: string;
  onNavigate?: (entity: string, pk: string) => void;
  editingEnabled?: boolean;
}

function CellContent({
  field,
  value,
  onNavigate,
}: {
  field: FieldMeta;
  value: unknown;
  onNavigate?: (entity: string, pk: string) => void;
}) {
  if (field.sensitive) {
    return <SensitiveCell value={value} fieldName={field.name} />;
  }

  switch (field.type) {
    case 'string':
      return <TextCell value={value} />;
    case 'integer':
    case 'float':
      return <NumberCell value={value} format={field.display?.format} />;
    case 'boolean':
      return <BooleanCell value={value} />;
    case 'date':
      return <DateCell value={value} format={field.display?.format} />;
    case 'uuid':
      if (field.fkTarget && onNavigate) {
        return (
          <FKCell
            value={value}
            targetEntity={field.fkTarget.entity}
            targetField={field.fkTarget.field}
            onNavigate={onNavigate}
          />
        );
      }
      return <UUIDCell value={value} />;
    case 'enum':
      return field.enumRef ? (
        <EnumCell value={value} enumRef={field.enumRef} />
      ) : (
        <TextCell value={value} />
      );
    default:
      return <TextCell value={value} />;
  }
}

export function DataTableCell({
  field,
  value,
  entity,
  pk,
  onNavigate,
  editingEnabled = true,
}: DataTableCellProps) {
  const content = <CellContent field={field} value={value} onNavigate={onNavigate} />;

  // PK fields and sensitive fields are never inline-editable
  const canEdit = editingEnabled && !field.isPK && !field.sensitive;

  if (canEdit) {
    return (
      <td className="px-4 py-2 whitespace-nowrap text-sm">
        <EditableCell entity={entity} pk={pk} field={field} value={value}>
          {content}
        </EditableCell>
        {/* Always show plain content on sm breakpoint (no double-click editing) */}
        <div className="sm:hidden">{content}</div>
      </td>
    );
  }

  return (
    <td className="px-4 py-2 whitespace-nowrap text-sm">
      {content}
    </td>
  );
}
