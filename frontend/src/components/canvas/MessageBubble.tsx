import type { CanvasMessage } from '../../types/canvas';

interface Props {
  message: CanvasMessage;
  isLoading?: boolean;
}

export function MessageBubble({ message, isLoading }: Props) {
  const isUser = message.role === 'user';
  return (
    <div
      data-testid="canvas-message"
      data-role={message.role}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={[
          'max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words',
          isUser
            ? 'bg-dui-primary text-white'
            : 'bg-dui-surface-secondary text-dui-text-primary border border-dui-border',
          isLoading ? 'animate-pulse' : '',
        ].join(' ')}
      >
        {message.content}
      </div>
    </div>
  );
}
