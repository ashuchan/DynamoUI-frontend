import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { canvasClient } from '../../lib/canvasClient';
import type { CanvasSession, MessageResponse } from '../../types/canvas';

export const canvasQueryKeys = {
  session: (id: string | null) => ['canvas-session', id] as const,
  intent: (id: string | null) => ['canvas-intent', id] as const,
  preview: (id: string | null, version: number) =>
    ['canvas-preview', id, version] as const,
  // Prefix used for invalidating every preview query for a session, regardless
  // of intentVersion. React Query treats an array prefix match as "all keys
  // whose first N entries equal this".
  previewPrefix: (id: string | null) => ['canvas-preview', id] as const,
};

export function useCreateSession() {
  return useMutation({
    mutationFn: () => canvasClient.createSession(),
  });
}

export function useSession(sessionId: string | null) {
  return useQuery<CanvasSession>({
    queryKey: canvasQueryKeys.session(sessionId),
    queryFn: () => canvasClient.getSession(sessionId as string),
    enabled: !!sessionId,
    // Refresh on every send-message invalidate (the canonical trigger). We
    // don't poll the session endpoint (intent polling carries the live state
    // signal) and don't auto-refetch on focus to avoid spurious renders.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export function useSendMessage(sessionId: string | null) {
  const queryClient = useQueryClient();
  return useMutation<MessageResponse, Error, string>({
    mutationFn: (message: string) => {
      if (!sessionId) {
        return Promise.reject(new Error('No active Canvas session'));
      }
      return canvasClient.sendMessage(sessionId, message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: canvasQueryKeys.session(sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: canvasQueryKeys.intent(sessionId),
      });
      // Intent often shifts after a turn; invalidate every preview key for
      // this session so the panel doesn't stall waiting for the next poll.
      queryClient.invalidateQueries({
        queryKey: canvasQueryKeys.previewPrefix(sessionId),
      });
    },
  });
}
