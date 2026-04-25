import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CANVAS_BASE, canvasClient } from './canvasClient';

vi.mock('../auth/tokenStorage', () => ({
  getCurrentToken: () => 'test-jwt',
}));

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('canvasClient', () => {
  it('createSession POSTs to /session with bearer token + cookie credentials', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ session_id: 'sid-1' }));
    const out = await canvasClient.createSession();
    expect(out).toEqual({ session_id: 'sid-1' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${CANVAS_BASE}/session`);
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer test-jwt',
      'Content-Type': 'application/json',
    });
  });

  it('getSession GETs /session/:id', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        session_id: 'sid-1',
        state: 'eliciting',
        messages: [],
        partial_intent: {},
      }),
    );
    const out = await canvasClient.getSession('sid-1');
    expect(out.session_id).toBe('sid-1');
    expect(fetchMock.mock.calls[0][0]).toBe(`${CANVAS_BASE}/session/sid-1`);
  });

  it('sendMessage POSTs JSON body to /session/:id/message', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        reply: 'ok',
        intent_update: null,
        session_state: 'eliciting',
      }),
    );
    await canvasClient.sendMessage('sid-1', 'hello');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${CANVAS_BASE}/session/sid-1/message`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ message: 'hello' });
  });

  it('getIntent returns the wrapped envelope', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ intent: { domain: 'logistics' }, state: 'eliciting' }),
    );
    const out = await canvasClient.getIntent('sid-1');
    expect(out.state).toBe('eliciting');
    expect(out.intent).toEqual({ domain: 'logistics' });
  });

  it('generate POSTs /session/:id/generate', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        status: 'ok',
        files: ['theme.css'],
        artifacts_url: '/api/v1/canvas/session/sid-1/artifacts',
      }),
    );
    const out = await canvasClient.generate('sid-1');
    expect(out.status).toBe('ok');
    expect(fetchMock.mock.calls[0][0]).toBe(
      `${CANVAS_BASE}/session/sid-1/generate`,
    );
  });

  it('getArtifactsUrl returns the deterministic path', () => {
    expect(canvasClient.getArtifactsUrl('sid-x')).toBe(
      `${CANVAS_BASE}/session/sid-x/artifacts`,
    );
  });

  it('surfaces v2 error envelope details', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            code: 'CANVAS_TURN_LIMIT',
            message: 'Conversation turn limit reached',
            traceId: 't-1',
          },
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    await expect(canvasClient.sendMessage('sid', 'x')).rejects.toMatchObject({
      status: 409,
      code: 'CANVAS_TURN_LIMIT',
      message: 'Conversation turn limit reached',
    });
  });
});
