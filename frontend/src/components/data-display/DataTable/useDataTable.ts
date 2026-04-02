import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { apiClient } from '../../../lib/apiClient';
import { queryKeys } from '../../../lib/queryKeys';
import type { Sort, Filters, DisplayConfig, FieldMeta } from '../../../lib/types';

interface UseDataTableOptions {
  entity: string;
}

export function useDataTable({ entity }: UseDataTableOptions) {
  const configQuery = useQuery({
    queryKey: queryKeys.displayConfig(entity),
    queryFn: () => apiClient.fetchDisplayConfig(entity),
    staleTime: 5 * 60 * 1000,
  });

  const fieldMetaQuery = useQuery({
    queryKey: queryKeys.fieldMeta(entity),
    queryFn: () => apiClient.fetchFieldMeta(entity),
    staleTime: 5 * 60 * 1000,
  });

  const config: DisplayConfig | undefined = configQuery.data;
  const fields: FieldMeta[] = fieldMetaQuery.data ?? [];

  const [sort, setSort] = useState<Sort | undefined>(
    config?.defaultSort ?? undefined,
  );
  const [page, setPage] = useState(1);
  const [pageSize] = useState(config?.defaultPageSize ?? 20);
  const [filters, setFilters] = useState<Filters>({});

  const dataQuery = useQuery({
    queryKey: queryKeys.entityList(entity, sort, page, filters),
    queryFn: () =>
      apiClient.fetchEntityList(entity, { sort, page, pageSize, filters }),
    staleTime: 30 * 1000,
    enabled: fieldMetaQuery.isSuccess,
  });

  const handleSort = useCallback(
    (field: string) => {
      setSort((prev) => {
        if (prev?.field === field) {
          return { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
        }
        return { field, direction: 'asc' };
      });
      setPage(1);
    },
    [],
  );

  const handleFilterChange = useCallback((field: string, op: string, value: unknown) => {
    setFilters((prev) => {
      if (value === '' || value === null || value === undefined) {
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return { ...prev, [field]: { op, value } };
    });
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  return {
    config,
    fields,
    sort,
    page,
    pageSize,
    filters,
    data: dataQuery.data,
    isLoading: dataQuery.isLoading || configQuery.isLoading || fieldMetaQuery.isLoading,
    isError: dataQuery.isError || configQuery.isError || fieldMetaQuery.isError,
    error: dataQuery.error ?? configQuery.error ?? fieldMetaQuery.error,
    handleSort,
    handleFilterChange,
    handlePageChange,
  };
}
