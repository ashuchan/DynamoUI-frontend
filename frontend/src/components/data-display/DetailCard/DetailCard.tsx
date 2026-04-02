import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import { queryKeys } from '../../../lib/queryKeys';
import { DetailCardField } from './DetailCardField';
import { DetailCardRelations } from './DetailCardRelations';
import { DetailCardActions } from './DetailCardActions';

interface DetailCardProps {
  entity: string;
  pk: string;
  onBack?: () => void;
  onNavigate?: (entity: string, pk: string) => void;
}

export function DetailCard({ entity, pk, onBack, onNavigate }: DetailCardProps) {
  const fieldMetaQuery = useQuery({
    queryKey: queryKeys.fieldMeta(entity),
    queryFn: () => apiClient.fetchFieldMeta(entity),
    staleTime: 5 * 60 * 1000,
  });

  const recordQuery = useQuery({
    queryKey: queryKeys.singleRecord(entity, pk),
    queryFn: () => apiClient.fetchSingleRecord(entity, pk),
    staleTime: 30 * 1000,
    enabled: fieldMetaQuery.isSuccess,
  });

  const fields = fieldMetaQuery.data ?? [];
  const record = recordQuery.data?.rows[0] ?? null;

  const isLoading = fieldMetaQuery.isLoading || recordQuery.isLoading;
  const isError = fieldMetaQuery.isError || recordQuery.isError;
  const error = fieldMetaQuery.error ?? recordQuery.error;

  return (
    <div className="bg-dui-surface border border-dui-border rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-dui-border">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 text-sm text-dui-text-secondary hover:text-dui-text-primary focus:outline-none dui-focus-ring rounded"
            aria-label="Go back"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        )}
        <div>
          <h2 className="text-base font-semibold text-dui-text-primary capitalize">
            {entity.replace(/_/g, ' ')}
          </h2>
          <p className="text-xs text-dui-text-muted font-mono mt-0.5">{pk}</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-4">
        {isLoading && (
          <div className="flex items-center gap-2 py-8 text-dui-text-muted">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading record…</span>
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-2 py-4 text-dui-danger">
            <AlertCircle size={16} />
            <span className="text-sm">
              {error instanceof Error ? error.message : 'Failed to load record'}
            </span>
          </div>
        )}

        {!isLoading && !isError && record && (
          <>
            <dl>
              {fields.map((field) => (
                <DetailCardField
                  key={field.name}
                  field={field}
                  value={record[field.name]}
                  onNavigate={onNavigate}
                />
              ))}
            </dl>

            {onNavigate && (
              <DetailCardRelations
                fields={fields}
                record={record}
                onNavigate={onNavigate}
              />
            )}

            <DetailCardActions
              entity={entity}
              pk={pk}
              record={record}
              fields={fields}
            />
          </>
        )}

        {!isLoading && !isError && !record && (
          <p className="py-8 text-center text-sm text-dui-text-muted">
            Record not found.
          </p>
        )}
      </div>
    </div>
  );
}
