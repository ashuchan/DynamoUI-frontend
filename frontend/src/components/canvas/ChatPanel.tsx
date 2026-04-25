import { useEffect, useRef } from 'react';
import { useSendMessage } from '../../hooks/canvas/useCanvasSession';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import type { CanvasMessage, ConversationState } from '../../types/canvas';

interface Props {
  sessionId: string | null;
  messages: CanvasMessage[];
  sessionState: ConversationState;
}

export function ChatPanel({ sessionId, messages, sessionState }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const sendMessage = useSendMessage(sessionId);
  const isComplete = sessionState === 'complete';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, sendMessage.isPending]);

  function handleSubmit(text: string) {
    if (!sessionId || isComplete) return;
    sendMessage.mutate(text);
  }

  const placeholder = isComplete
    ? 'Configuration complete — click Generate to download'
    : sessionId
      ? 'Describe your deployment...'
      : 'Starting Canvas session...';

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        data-testid="canvas-message-list"
      >
        {messages.length === 0 && !sendMessage.isPending && (
          <p className="text-sm text-dui-text-muted text-center mt-8">
            Canvas is ready. Describe the tool you're building.
          </p>
        )}
        {messages.map((msg, i) => (
          // Server message lists are append-only and never reordered, so
          // positional index is a safe and collision-proof key. Including
          // timestamp risked duplicates when fixtures or fast turns share an
          // ISO string at second resolution.
          <MessageBubble key={i} message={msg} />
        ))}
        {sendMessage.isPending && (
          <MessageBubble
            message={{ role: 'assistant', content: '…', timestamp: '' }}
            isLoading
          />
        )}
        {sendMessage.isError && (
          <p className="text-xs text-dui-danger px-2">
            {sendMessage.error instanceof Error
              ? sendMessage.error.message
              : 'Failed to send message'}
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-dui-border p-3">
        <ChatInput
          onSubmit={handleSubmit}
          disabled={!sessionId || isComplete}
          pending={sendMessage.isPending}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
