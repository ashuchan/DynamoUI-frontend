import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { CanvasPage } from './CanvasPage';
import { canvasClient } from '../lib/canvasClient';
import {
  COMPLETE_INTENT_ENVELOPE,
  COMPLETE_SESSION,
  DASHBOARD_PREVIEW,
  ELICITING_SESSION,
} from '../test/canvasFixtures';
import type { CanvasSession, IntentEnvelope } from '../types/canvas';

function renderPage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/canvas']}>
        <CanvasPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// Spy types are intentionally `any` here — vi.spyOn's return type encodes
// the original function signature, which doesn't unify across all the
// methods on canvasClient. Tests cast at call sites where strictness matters.
/* eslint-disable @typescript-eslint/no-explicit-any */
let createSessionSpy: any;
let getSessionSpy: any;
let getIntentSpy: any;
let getPreviewSpy: any;
let sendMessageSpy: any;
let generateSpy: any;
/* eslint-enable @typescript-eslint/no-explicit-any */

beforeEach(() => {
  createSessionSpy = vi.spyOn(canvasClient, 'createSession');
  getSessionSpy = vi.spyOn(canvasClient, 'getSession');
  getIntentSpy = vi.spyOn(canvasClient, 'getIntent');
  getPreviewSpy = vi.spyOn(canvasClient, 'getPreview');
  sendMessageSpy = vi.spyOn(canvasClient, 'sendMessage');
  generateSpy = vi.spyOn(canvasClient, 'generate');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CanvasPage — end-to-end happy path', () => {
  it('creates a session on mount and renders chat + intent + preview', async () => {
    createSessionSpy.mockResolvedValue({ session_id: 'sid-1' });
    getSessionSpy.mockImplementation(
      async (): Promise<CanvasSession> => ELICITING_SESSION,
    );
    getIntentSpy.mockImplementation(
      async (): Promise<IntentEnvelope> => ({
        state: 'eliciting',
        intent: ELICITING_SESSION.partial_intent,
      }),
    );
    getPreviewSpy.mockResolvedValue(DASHBOARD_PREVIEW);

    renderPage();

    await waitFor(() => {
      expect(createSessionSpy).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(getSessionSpy).toHaveBeenCalledWith('sid-1');
    });
    // Intent chips populate from the intent envelope
    await waitFor(() => {
      expect(screen.getByTestId('canvas-chip-domain')).toHaveTextContent(
        'Logistics',
      );
    });
    // Preview renders the dashboard archetype
    await waitFor(() => {
      expect(
        screen.getByTestId('canvas-archetype-dashboard'),
      ).toBeInTheDocument();
    });
    // Generate is disabled while state is still eliciting
    expect(screen.getByTestId('canvas-generate-button')).toBeDisabled();
  });

  it('enables Generate and exposes the artifact download once state == complete', async () => {
    createSessionSpy.mockResolvedValue({ session_id: 'sid-c' });
    getSessionSpy.mockResolvedValue(COMPLETE_SESSION);
    getIntentSpy.mockResolvedValue(COMPLETE_INTENT_ENVELOPE);
    getPreviewSpy.mockResolvedValue(DASHBOARD_PREVIEW);
    generateSpy.mockResolvedValue({
      status: 'ok',
      files: ['theme.css', 'layout.config.yaml'],
      artifacts_url: '/api/v1/canvas/session/sid-c/artifacts',
    });

    renderPage();

    await waitFor(() => {
      const btn = screen.getByTestId('canvas-generate-button');
      expect(btn).not.toBeDisabled();
    });

    fireEvent.click(screen.getByTestId('canvas-generate-button'));

    await waitFor(() => {
      expect(generateSpy).toHaveBeenCalledWith('sid-c');
    });
    await waitFor(() => {
      const link = screen.getByTestId(
        'canvas-download-link',
      ) as HTMLAnchorElement;
      expect(link.getAttribute('download')).toBe('canvas-output.zip');
      expect(link.href).toContain('/canvas/session/sid-c/artifacts');
    });
  });

  it('forwards a chat turn through canvasClient.sendMessage', async () => {
    createSessionSpy.mockResolvedValue({ session_id: 'sid-2' });
    getSessionSpy.mockResolvedValue(ELICITING_SESSION);
    getIntentSpy.mockResolvedValue({
      state: 'eliciting',
      intent: ELICITING_SESSION.partial_intent,
    });
    getPreviewSpy.mockResolvedValue(DASHBOARD_PREVIEW);
    sendMessageSpy.mockResolvedValue({
      reply: 'OK',
      intent_update: { primary_entity: 'Order' },
      session_state: 'eliciting',
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('canvas-chat-input')).toBeInTheDocument();
    });

    const input = screen.getByTestId('canvas-chat-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'primary entity is order' } });
    fireEvent.click(screen.getByTestId('canvas-chat-send'));

    await waitFor(() => {
      expect(sendMessageSpy).toHaveBeenCalledWith(
        'sid-2',
        'primary entity is order',
      );
    });
  });

  it('renders the empty state when no preview has loaded yet', async () => {
    createSessionSpy.mockResolvedValue({ session_id: 'sid-3' });
    getSessionSpy.mockResolvedValue(ELICITING_SESSION);
    getIntentSpy.mockResolvedValue({
      state: 'eliciting',
      intent: {},
    });
    // Preview never resolves — ensures the page still mounts cleanly while
    // the request is in flight.
    getPreviewSpy.mockImplementation(() => new Promise(() => {}));

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('canvas-preview-empty')).toBeInTheDocument();
    });
  });
});
