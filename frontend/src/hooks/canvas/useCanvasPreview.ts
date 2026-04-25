import { useQuery } from '@tanstack/react-query';
import { canvasClient } from '../../lib/canvasClient';
import { canvasQueryKeys } from './useCanvasSession';
import type { PreviewData } from '../../types/canvas';

// `intentVersion` is bumped by the parent whenever the polled intent changes
// (deep-equal in Canvas.tsx). Including it in the key forces a refetch on
// real intent change without thrashing the cache on every poll tick.
export function useCanvasPreview(
  sessionId: string | null,
  intentVersion: number,
) {
  return useQuery<PreviewData>({
    queryKey: canvasQueryKeys.preview(sessionId, intentVersion),
    queryFn: () => canvasClient.getPreview(sessionId as string),
    enabled: !!sessionId,
    staleTime: 10_000,
  });
}
