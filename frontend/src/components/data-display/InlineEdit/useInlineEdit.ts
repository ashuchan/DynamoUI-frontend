import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '../../../lib/apiClient';
import { queryKeys } from '../../../lib/queryKeys';
import type { DiffPreview, MutationPlan } from '../../../lib/types';

interface UseInlineEditOptions {
  entity: string;
  pk: string;
  mutationId: string;
  field: string;
  originalValue: unknown;
}

export function useInlineEdit({
  entity,
  pk,
  mutationId,
  field,
  originalValue,
}: UseInlineEditOptions) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<unknown>(originalValue);
  const [diffPreview, setDiffPreview] = useState<DiffPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewMutation = useMutation({
    mutationFn: (plan: MutationPlan) => apiClient.previewMutation(plan),
    onSuccess: (data) => {
      setDiffPreview(data);
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const executeMutation = useMutation({
    mutationFn: (plan: MutationPlan) => apiClient.executeMutation(plan),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.entityList(entity),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.singleRecord(entity, pk),
      });
      cancelEdit();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  function startEdit() {
    setIsEditing(true);
    setEditValue(originalValue);
    setDiffPreview(null);
    setError(null);
  }

  function cancelEdit() {
    setIsEditing(false);
    setEditValue(originalValue);
    setDiffPreview(null);
    setError(null);
  }

  function requestPreview() {
    const plan: MutationPlan = {
      entity,
      mutation_id: mutationId,
      record_pk: pk,
      fields: { [field]: editValue },
    };
    previewMutation.mutate(plan);
  }

  function confirmEdit() {
    if (!diffPreview) return;
    const plan: MutationPlan = {
      entity,
      mutation_id: mutationId,
      record_pk: pk,
      fields: { [field]: editValue },
    };
    executeMutation.mutate(plan);
  }

  return {
    isEditing,
    editValue,
    setEditValue,
    diffPreview,
    error,
    isPreviewing: previewMutation.isPending,
    isExecuting: executeMutation.isPending,
    startEdit,
    cancelEdit,
    requestPreview,
    confirmEdit,
  };
}
