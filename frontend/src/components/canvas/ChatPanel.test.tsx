import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChatPanel } from './ChatPanel';
import { canvasClient } from '../../lib/canvasClient';
import { ELICITING_SESSION, COMPLETE_SESSION } from '../../test/canvasFixtures';

function wrap(ui: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.spyOn(canvasClient, 'sendMessage');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ChatPanel', () => {
  it('renders all messages with role-tagged bubbles', () => {
    wrap(
      <ChatPanel
        sessionId="sid"
        messages={ELICITING_SESSION.messages}
        sessionState="eliciting"
      />,
    );
    const bubbles = screen.getAllByTestId('canvas-message');
    expect(bubbles).toHaveLength(2);
    expect(bubbles[0]).toHaveAttribute('data-role', 'user');
    expect(bubbles[1]).toHaveAttribute('data-role', 'assistant');
    expect(bubbles[0]).toHaveTextContent('logistics');
  });

  it('disables the input once the session is complete', () => {
    wrap(
      <ChatPanel
        sessionId="sid"
        messages={COMPLETE_SESSION.messages}
        sessionState="complete"
      />,
    );
    const input = screen.getByTestId('canvas-chat-input');
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute(
      'placeholder',
      expect.stringContaining('complete'),
    );
  });

  it('calls canvasClient.sendMessage on submit', async () => {
    (canvasClient.sendMessage as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      reply: 'thanks',
      intent_update: null,
      session_state: 'eliciting',
    });

    wrap(
      <ChatPanel
        sessionId="sid"
        messages={[]}
        sessionState="eliciting"
      />,
    );
    const input = screen.getByTestId('canvas-chat-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'build me a tool' } });
    fireEvent.click(screen.getByTestId('canvas-chat-send'));

    await waitFor(() => {
      expect(canvasClient.sendMessage).toHaveBeenCalledWith(
        'sid',
        'build me a tool',
      );
    });
  });

  it('does not submit empty messages', () => {
    wrap(
      <ChatPanel
        sessionId="sid"
        messages={[]}
        sessionState="eliciting"
      />,
    );
    const sendBtn = screen.getByTestId('canvas-chat-send');
    fireEvent.click(sendBtn);
    expect(canvasClient.sendMessage).not.toHaveBeenCalled();
  });
});
