import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Plus, Loader2, AlertCircle } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import { queryKeys } from '../../../lib/queryKeys';
import type { MutationDef, MutationPlan, FieldMeta } from '../../../lib/types';
import { InlineDiffPreview } from '../InlineEdit/InlineDiffPreview';

interface DetailCardActionsProps {
  entity: string;
  pk: string;
  record: Record<string, unknown>;
  fields: FieldMeta[];
  onDeleted?: () => void;
}

interface MutationFormProps {
  def: MutationDef;
  entity: string;
  pk: string;
  record: Record<string, unknown>;
  fields: FieldMeta[];
  onDone: () => void;
}

function MutationForm({ def, entity, pk, record, fields, onDone }: MutationFormProps) {
  const queryClient = useQueryClient();
  const applicableFields = fields.filter((f) => def.fields.includes(f.name));

  const [formData, setFormData] = useState<Record<string, unknown>>(
    Object.fromEntries(applicableFields.map((f) => [f.name, record[f.name] ?? ''])),
  );
  const [preview, setPreview] = useState<import('../../../lib/types').DiffPreview | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const previewMutation = useMutation({
    mutationFn: (plan: MutationPlan) => apiClient.previewMutation(plan),
    onSuccess: (data) => {
      setPreview(data);
      setFormError(null);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const executeMutation = useMutation({
    mutationFn: (plan: MutationPlan) => apiClient.executeMutation(plan),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.entityList(entity) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.singleRecord(entity, pk) });
      onDone();
    },
    onError: (err: Error) => setFormError(err.message),
  });

  function handlePreview() {
    const plan: MutationPlan = {
      entity,
      operation: def.operation,
      pk: def.operation !== 'create' ? pk : undefined,
      data: formData,
    };
    previewMutation.mutate(plan);
  }

  function handleExecute() {
    if (!preview) return;
    const plan: MutationPlan = {
      entity,
      operation: def.operation,
      pk: def.operation !== 'create' ? pk : undefined,
      data: formData,
    };
    executeMutation.mutate(plan);
  }

  return (
    <div className="mt-3 p-4 border border-dui-border rounded-lg bg-dui-surface-secondary">
      <h4 className="text-sm font-semibold text-dui-text-primary mb-3">{def.label}</h4>

      {applicableFields.map((field) => (
        <div key={field.name} className="mb-3">
          <label
            htmlFor={`action-${field.name}`}
            className="block text-xs font-medium text-dui-text-secondary mb-1"
          >
            {field.label}
            {!field.nullable && <span className="text-dui-danger ml-1">*</span>}
          </label>
          <input
            id={`action-${field.name}`}
            type={
              field.type === 'integer' || field.type === 'float'
                ? 'number'
                : field.type === 'date'
                  ? 'date'
                  : 'text'
            }
            value={String(formData[field.name] ?? '')}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))
            }
            disabled={field.sensitive}
            className={[
              'block w-full rounded border border-dui-border bg-dui-surface text-dui-text-primary text-sm px-3 py-1.5',
              'focus:outline-none focus:border-dui-border',
              field.sensitive ? 'opacity-50 cursor-not-allowed' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          />
        </div>
      ))}

      {formError && (
        <div className="flex items-center gap-2 mb-3 text-dui-danger text-xs">
          <AlertCircle size={12} />
          {formError}
        </div>
      )}

      {!preview ? (
        <button
          type="button"
          onClick={handlePreview}
          disabled={previewMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-dui-primary text-dui-surface text-sm font-medium hover:opacity-90 focus:outline-none dui-focus-ring disabled:opacity-50"
        >
          {previewMutation.isPending && <Loader2 size={12} className="animate-spin" />}
          Preview changes
        </button>
      ) : (
        <InlineDiffPreview
          preview={preview}
          onConfirm={handleExecute}
          onCancel={() => setPreview(null)}
          isExecuting={executeMutation.isPending}
        />
      )}

      <button
        type="button"
        onClick={onDone}
        className="ml-2 text-xs text-dui-text-muted hover:underline focus:outline-none dui-focus-ring rounded"
      >
        Dismiss
      </button>
    </div>
  );
}

export function DetailCardActions({
  entity,
  pk,
  record,
  fields,
  onDeleted,
}: DetailCardActionsProps) {
  const queryClient = useQueryClient();
  const [activeAction, setActiveAction] = useState<MutationDef | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data: mutationDefs, isLoading } = useQuery({
    queryKey: queryKeys.mutationDefs(entity),
    queryFn: () => apiClient.fetchMutationDefs(entity),
    staleTime: 5 * 60 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: (plan: MutationPlan) => apiClient.executeMutation(plan),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.entityList(entity) });
      onDeleted?.();
    },
  });

  if (isLoading || !mutationDefs || mutationDefs.length === 0) return null;

  const updateDefs = mutationDefs.filter((d) => d.operation === 'update');
  const createDefs = mutationDefs.filter((d) => d.operation === 'create');
  const deleteDefs = mutationDefs.filter((d) => d.operation === 'delete');

  return (
    <div className="mt-4 pt-4 border-t border-dui-border">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-dui-text-muted mb-3">
        Actions
      </h3>
      <div className="flex flex-wrap gap-2">
        {updateDefs.map((def) => (
          <button
            key={def.name}
            type="button"
            onClick={() => setActiveAction(def)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-dui-border text-dui-text-secondary hover:bg-dui-surface-secondary focus:outline-none dui-focus-ring"
          >
            <Pencil size={11} />
            {def.label}
          </button>
        ))}

        {createDefs.map((def) => (
          <button
            key={def.name}
            type="button"
            onClick={() => setActiveAction(def)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-dui-border text-dui-text-secondary hover:bg-dui-surface-secondary focus:outline-none dui-focus-ring"
          >
            <Plus size={11} />
            {def.label}
          </button>
        ))}

        {deleteDefs.length > 0 && (
          <button
            type="button"
            onClick={() => setDeleteConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-dui-danger text-dui-danger hover:bg-dui-surface-secondary focus:outline-none dui-focus-ring"
          >
            <Trash2 size={11} />
            Delete
          </button>
        )}
      </div>

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="mt-3 p-3 border border-dui-danger rounded-md bg-dui-surface-secondary">
          <p className="text-sm text-dui-text-primary mb-3">
            Are you sure you want to delete this record? This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                deleteMutation.mutate({
                  entity,
                  operation: 'delete',
                  pk,
                  data: {},
                });
              }}
              disabled={deleteMutation.isPending}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-dui-danger text-dui-surface hover:opacity-90 focus:outline-none dui-focus-ring disabled:opacity-50"
            >
              {deleteMutation.isPending && <Loader2 size={11} className="animate-spin" />}
              Confirm Delete
            </button>
            <button
              type="button"
              onClick={() => setDeleteConfirm(false)}
              className="px-3 py-1.5 rounded-md text-xs font-medium border border-dui-border text-dui-text-secondary hover:bg-dui-surface-tertiary focus:outline-none dui-focus-ring"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Mutation form */}
      {activeAction && (
        <MutationForm
          def={activeAction}
          entity={entity}
          pk={pk}
          record={record}
          fields={fields}
          onDone={() => setActiveAction(null)}
        />
      )}
    </div>
  );
}
