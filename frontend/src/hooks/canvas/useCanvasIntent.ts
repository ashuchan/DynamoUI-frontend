import { useQuery } from '@tanstack/react-query';
import { canvasClient } from '../../lib/canvasClient';
import { canvasQueryKeys } from './useCanvasSession';
import type { ConversationState, IntentEnvelope } from '../../types/canvas';

const POLL_INTERVAL = Number(
  (import.meta.env.VITE_CANVAS_INTENT_POLL_MS as string | undefined) ?? 2000,
);

export function useCanvasIntent(
  sessionId: string | null,
  sessionState: ConversationState,
) {
  return useQuery<IntentEnvelope>({
    queryKey: canvasQueryKeys.intent(sessionId),
    queryFn: () => canvasClient.getIntent(sessionId as string),
    enabled: !!sessionId,
    refetchInterval: sessionState === 'complete' ? false : POLL_INTERVAL,
    // staleTime ≥ poll interval prevents unscheduled refetches between ticks
    // (e.g. on a re-render); the timer is the only refresh trigger we want.
    staleTime: POLL_INTERVAL,
  });
}

export const CANVAS_POLL_INTERVAL_MS = POLL_INTERVAL;
