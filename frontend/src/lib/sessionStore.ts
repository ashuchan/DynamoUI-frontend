import { create } from 'zustand';
import type { ExecutedResult } from './types';

// Transient result-session store. Holds the last N executed results by their
// server-issued sessionId so `/results/:sessionId` can render without refetch.
// We keep a recent-queries tail for the palette's RECENT section.

const MAX_SESSIONS = 30;
const MAX_RECENTS = 10;

export interface RecentQuery {
  input: string;
  at: string;
  sessionId?: string;
}

interface SessionState {
  results: Record<string, { executed: ExecutedResult; input: string; at: string }>;
  order: string[];
  recents: RecentQuery[];

  // Skill-hash tracked across the app so we know when to invalidate metadata
  // caches (displayConfig / fieldMeta / mutationDefs).
  lastKnownSkillHash: string | null;

  stashResult: (input: string, executed: ExecutedResult) => string;
  getResult: (sessionId: string) => { executed: ExecutedResult; input: string; at: string } | undefined;
  pushRecent: (input: string, sessionId?: string) => void;
  setSkillHash: (hash: string) => boolean; // returns true if it changed
  clear: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  results: {},
  order: [],
  recents: [],
  lastKnownSkillHash: null,

  stashResult: (input, executed) => {
    const id = executed.sessionId;
    set((state) => {
      const order = [id, ...state.order.filter((x) => x !== id)].slice(0, MAX_SESSIONS);
      const results = { ...state.results, [id]: { executed, input, at: new Date().toISOString() } };
      // Prune evicted ids out of `results`.
      for (const key of Object.keys(results)) {
        if (!order.includes(key)) delete results[key];
      }
      return { order, results };
    });
    get().pushRecent(input, id);
    return id;
  },

  getResult: (sessionId) => get().results[sessionId],

  pushRecent: (input, sessionId) => {
    set((state) => {
      const recents = [
        { input, sessionId, at: new Date().toISOString() },
        ...state.recents.filter((r) => r.input !== input),
      ].slice(0, MAX_RECENTS);
      return { recents };
    });
  },

  setSkillHash: (hash) => {
    const prev = get().lastKnownSkillHash;
    if (prev === hash) return false;
    set({ lastKnownSkillHash: hash });
    return prev !== null; // only true if we had a prior hash (i.e. a real rotation)
  },

  clear: () => set({ results: {}, order: [], recents: [] }),
}));
