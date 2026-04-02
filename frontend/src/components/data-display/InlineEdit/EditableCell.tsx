import { useRef, useEffect, type KeyboardEvent } from 'react';
import { useInlineEdit } from './useInlineEdit';
import { InlineDiffPreview } from './InlineDiffPreview';
import type { FieldMeta } from '../../../lib/types';
import { EnumDropdown } from '../CellRenderers/EnumCell';

interface EditableCellProps {
  entity: string;
  pk: string;
  field: FieldMeta;
  value: unknown;
  children: React.ReactNode;
  disabled?: boolean;
}

// Inline editing is disabled on sm breakpoint (< 640px) per accessibility rules.
// Sensitive fields are never inline-editable.
export function EditableCell({
  entity,
  pk,
  field,
  value,
  children,
  disabled = false,
}: EditableCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    isEditing,
    editValue,
    setEditValue,
    diffPreview,
    error,
    isPreviewing,
    isExecuting,
    startEdit,
    cancelEdit,
    requestPreview,
    confirmEdit,
  } = useInlineEdit({
    entity,
    pk,
    field: field.name,
    originalValue: value,
  });

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  // Sensitive fields and disabled states are never editable
  if (field.sensitive || disabled) {
    return <>{children}</>;
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!diffPreview) {
        requestPreview();
      } else {
        confirmEdit();
      }
    }
  }

  if (!isEditing) {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={`${field.label}: double-click to edit`}
        onDoubleClick={startEdit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') startEdit();
        }}
        className="cursor-pointer rounded hover:bg-dui-surface-secondary px-1 -mx-1 hidden sm:block"
        title="Double-click to edit"
      >
        {children}
      </div>
    );
  }

  return (
    <div className="hidden sm:block">
      {field.type === 'enum' && field.enumRef ? (
        <EnumDropdown
          enumName={field.enumRef}
          value={String(editValue ?? '')}
          onChange={(v) => setEditValue(v)}
          mode="edit"
          disabled={isPreviewing || isExecuting}
        />
      ) : field.type === 'boolean' ? (
        <select
          value={String(editValue)}
          onChange={(e) => setEditValue(e.target.value === 'true')}
          onKeyDown={(e) => {
            if (e.key === 'Escape') cancelEdit();
            if (e.key === 'Enter' && !diffPreview) requestPreview();
          }}
          className="block w-full rounded border border-dui-border bg-dui-surface text-dui-text-primary text-sm px-2 py-1 focus:outline-none focus:border-dui-border"
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      ) : (
        <input
          ref={inputRef}
          type={
            field.type === 'integer' || field.type === 'float'
              ? 'number'
              : field.type === 'date'
                ? 'date'
                : 'text'
          }
          value={String(editValue ?? '')}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label={`${field.label}: double-click to edit`}
          className={[
            'block w-full rounded border border-dui-border bg-dui-surface text-dui-text-primary text-sm px-2 py-1',
            'focus:outline-none focus:border-dui-border',
          ].join(' ')}
        />
      )}

      {error && (
        <p className="mt-1 text-xs text-dui-danger">{error}</p>
      )}

      {!diffPreview && !isPreviewing && (
        <div className="flex items-center gap-2 mt-1">
          <button
            type="button"
            onClick={requestPreview}
            disabled={isPreviewing}
            className="text-xs text-dui-primary hover:underline focus:outline-none dui-focus-ring rounded"
          >
            Preview change
          </button>
          <button
            type="button"
            onClick={cancelEdit}
            className="text-xs text-dui-text-muted hover:underline focus:outline-none dui-focus-ring rounded"
          >
            Cancel
          </button>
        </div>
      )}

      {isPreviewing && (
        <p className="mt-1 text-xs text-dui-text-muted">Loading preview…</p>
      )}

      {diffPreview && (
        <InlineDiffPreview
          preview={diffPreview}
          onConfirm={confirmEdit}
          onCancel={cancelEdit}
          isExecuting={isExecuting}
        />
      )}
    </div>
  );
}
