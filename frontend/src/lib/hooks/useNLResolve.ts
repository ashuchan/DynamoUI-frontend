import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../apiClient';
import { useSessionStore } from '../sessionStore';
import type { ResolutionResultV2 } from '../types';

// Wraps /resolve/v2 and its follow-on flows:
// - `executed`: stash the result under its sessionId, navigate to /results/:id.
// - `schedule_draft` / `alert_draft`: caller receives the draft and opens the
//   appropriate modal; no navigation.
// - `mutation_preview`: caller opens the mutation confirmation UI.
// - `clarification_needed`: caller shows disambiguation prompt.
//
// Every execution also refreshes lastKnownSkillHash. If the hash rotated since
// the last known value, we invalidate the schema-level React Query keys so
// stale FieldMeta/DisplayConfig doesn't linger.

export type NLResolveOutcome = ResolutionResultV2;

export function useNLResolve() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const stashResult = useSessionStore((s) => s.stashResult);
  const pushRecent = useSessionStore((s) => s.pushRecent);
  const setSkillHash = useSessionStore((s) => s.setSkillHash);

  return useMutation<NLResolveOutcome, Error, { input: string; navigateOnExecute?: boolean }>({
    mutationFn: async ({ input }) => {
      return apiClient.resolveV2(input);
    },
    onSuccess: (outcome, { input, navigateOnExecute = true }) => {
      if (outcome.kind === 'executed') {
        const prov = outcome.executed.provenance;
        const rotated = setSkillHash(prov.skillHash);
        if (rotated) {
          // Nuke all schema-level caches — display/field/mutation meta.
          queryClient.invalidateQueries({ queryKey: ['displayConfig'] });
          queryClient.invalidateQueries({ queryKey: ['fieldMeta'] });
          queryClient.invalidateQueries({ queryKey: ['mutationDefs'] });
          queryClient.invalidateQueries({ queryKey: ['enumOptions'] });
        }
        const sessionId = stashResult(input, outcome.executed);
        if (navigateOnExecute) navigate(`/results/${sessionId}`);
      } else {
        pushRecent(input);
      }
    },
  });
}
