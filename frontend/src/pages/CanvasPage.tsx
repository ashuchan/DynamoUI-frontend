import { useEffect, useRef, useState } from 'react';
import { ChatPanel } from '../components/canvas/ChatPanel';
import { PreviewPanel } from '../components/canvas/PreviewPanel';
import { IntentSummary } from '../components/canvas/IntentSummary';
import { GenerateButton } from '../components/canvas/GenerateButton';
import {
  useCreateSession,
  useSession,
} from '../hooks/canvas/useCanvasSession';
import { useCanvasIntent } from '../hooks/canvas/useCanvasIntent';
import { useCanvasPreview } from '../hooks/canvas/useCanvasPreview';
import { canvasClient } from '../lib/canvasClient';

export function CanvasPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [intentVersion, setIntentVersion] = useState(0);
  const prevIntentRef = useRef<string>('');
  const startedRef = useRef(false);

  const createSession = useCreateSession();
  const { data: session } = useSession(sessionId);
  const sessionState = session?.state ?? 'eliciting';
  const { data: intentEnvelope } = useCanvasIntent(sessionId, sessionState);
  const { data: preview } = useCanvasPreview(sessionId, intentVersion);

  function startSession() {
    startedRef.current = true;
    createSession.mutate(undefined, {
      onSuccess: (data) => setSessionId(data.session_id),
      // On failure, release the guard so the user can click Retry.
      onError: () => {
        startedRef.current = false;
      },
    });
  }

  // Start a new session exactly once per mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (startedRef.current) return;
    startSession();
  }, []);

  // Detect intent changes via JSON-equal — the polled object's reference
  // changes every tick, so shallow equality won't do.
  useEffect(() => {
    const serialised = JSON.stringify(intentEnvelope?.intent ?? {});
    if (serialised !== prevIntentRef.current) {
      prevIntentRef.current = serialised;
      setIntentVersion((v) => v + 1);
    }
  }, [intentEnvelope?.intent]);

  const isComplete = sessionState === 'complete';
  const artifactsUrl =
    isComplete && sessionId ? canvasClient.getArtifactsUrl(sessionId) : null;

  return (
    <div
      className="flex flex-col h-full bg-dui-bg"
      data-testid="canvas-page"
      style={{ minHeight: 'calc(100vh - 52px)' }}
    >
      <header className="flex items-center justify-between px-6 py-3 border-b border-dui-border bg-dui-surface">
        <div>
          <h1 className="text-lg font-semibold text-dui-text-primary">
            DynamoUI Canvas
          </h1>
          <p className="text-xs text-dui-text-secondary">
            Describe your deployment and Canvas will configure it for you
          </p>
        </div>
        <GenerateButton
          sessionId={sessionId}
          disabled={!isComplete}
          artifactsUrl={artifactsUrl}
        />
      </header>

      {createSession.isError && !sessionId && (
        <div
          className="flex items-center justify-between gap-3 px-6 py-2 bg-dui-surface-tertiary border-b border-dui-border"
          data-testid="canvas-session-error"
        >
          <p className="text-xs text-dui-danger">
            Couldn't start a Canvas session
            {createSession.error instanceof Error
              ? `: ${createSession.error.message}`
              : '.'}
          </p>
          <button
            type="button"
            onClick={startSession}
            className="text-xs font-medium text-dui-primary hover:underline"
            data-testid="canvas-session-retry"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div
          className="flex flex-col border-r border-dui-border bg-dui-surface"
          style={{ width: 420, minWidth: 320 }}
        >
          <ChatPanel
            sessionId={sessionId}
            messages={session?.messages ?? []}
            sessionState={sessionState}
          />
        </div>

        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="border-b border-dui-border px-4 py-2 bg-dui-surface">
            <IntentSummary intent={intentEnvelope?.intent ?? {}} />
          </div>
          <div className="flex-1 overflow-auto p-4 bg-dui-surface-secondary">
            <PreviewPanel preview={preview ?? null} sessionState={sessionState} />
          </div>
        </div>
      </div>
    </div>
  );
}
