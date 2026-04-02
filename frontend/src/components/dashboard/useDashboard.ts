import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { apiClient } from '../../lib/apiClient';
import { queryKeys } from '../../lib/queryKeys';
import type { Widget, QueryResult } from '../../lib/types';

export interface WidgetExecution {
  widgetId: string;
  result: QueryResult | null;
  isLoading: boolean;
  error: string | null;
}

export function useDashboard() {
  const dashboardQuery = useQuery({
    queryKey: queryKeys.widgetsDashboard(),
    queryFn: () => apiClient.fetchWidgetsDashboard(),
    staleTime: 5 * 60 * 1000,
  });

  // Track which widget is waiting for params
  const [pendingWidget, setPendingWidget] = useState<Widget | null>(null);
  // Track execution results per widget id
  const [executions, setExecutions] = useState<Record<string, WidgetExecution>>({});

  const requestWidgetExecution = useCallback((widget: Widget) => {
    if (widget.params.length === 0) {
      // No params needed — execute immediately
      void executeWidget(widget, {});
    } else {
      setPendingWidget(widget);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const executeWidget = useCallback(
    async (widget: Widget, params: Record<string, unknown>) => {
      setPendingWidget(null);
      setExecutions((prev) => ({
        ...prev,
        [widget.id]: { widgetId: widget.id, result: null, isLoading: true, error: null },
      }));
      try {
        const result = await apiClient.executeWidget(widget.id, params);
        setExecutions((prev) => ({
          ...prev,
          [widget.id]: { widgetId: widget.id, result, isLoading: false, error: null },
        }));
      } catch (err) {
        setExecutions((prev) => ({
          ...prev,
          [widget.id]: {
            widgetId: widget.id,
            result: null,
            isLoading: false,
            error: err instanceof Error ? err.message : 'Execution failed',
          },
        }));
      }
    },
    [],
  );

  const dismissWidget = useCallback((widgetId: string) => {
    setExecutions((prev) => {
      const next = { ...prev };
      delete next[widgetId];
      return next;
    });
  }, []);

  const cancelPendingWidget = useCallback(() => {
    setPendingWidget(null);
  }, []);

  return {
    categories: dashboardQuery.data ?? [],
    isLoading: dashboardQuery.isLoading,
    isError: dashboardQuery.isError,
    error: dashboardQuery.error,
    pendingWidget,
    executions,
    requestWidgetExecution,
    executeWidget,
    dismissWidget,
    cancelPendingWidget,
  };
}
