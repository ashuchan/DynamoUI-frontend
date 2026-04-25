// Canvas API client — wraps the existing apiFetch helper so JWT injection,
// cookie credentials, and the v2 error envelope behave identically to
// apiClient. Base path is configurable via VITE_CANVAS_API_BASE; the default
// matches LLD 9 §4.

import { apiFetchAbsolute } from './apiClient';
import type {
  CanvasSession,
  CreateSessionResponse,
  GenerateResponse,
  IntentEnvelope,
  MessageResponse,
  PreviewData,
} from '../types/canvas';

export const CANVAS_BASE: string =
  (import.meta.env.VITE_CANVAS_API_BASE as string | undefined) ?? '/api/v1/canvas';

function canvasFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return apiFetchAbsolute<T>(`${CANVAS_BASE}${path}`, init);
}

export const canvasClient = {
  createSession: (): Promise<CreateSessionResponse> =>
    canvasFetch<CreateSessionResponse>('/session', { method: 'POST' }),

  getSession: (sessionId: string): Promise<CanvasSession> =>
    canvasFetch<CanvasSession>(`/session/${sessionId}`),

  sendMessage: (sessionId: string, message: string): Promise<MessageResponse> =>
    canvasFetch<MessageResponse>(`/session/${sessionId}/message`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  getIntent: (sessionId: string): Promise<IntentEnvelope> =>
    canvasFetch<IntentEnvelope>(`/session/${sessionId}/intent`),

  getPreview: (sessionId: string): Promise<PreviewData> =>
    canvasFetch<PreviewData>(`/session/${sessionId}/preview`),

  generate: (sessionId: string): Promise<GenerateResponse> =>
    canvasFetch<GenerateResponse>(`/session/${sessionId}/generate`, {
      method: 'POST',
    }),

  // Returned to <a href download> — the cookie set by POST /session carries
  // the bearer JWT so the link works without an Authorization header.
  getArtifactsUrl: (sessionId: string): string =>
    `${CANVAS_BASE}/session/${sessionId}/artifacts`,
};
