import { useState, useEffect, useRef } from 'react';
import { Loader2, Send } from 'lucide-react';

interface Props {
  onSubmit: (text: string) => void;
  disabled?: boolean;
  pending?: boolean;
  placeholder?: string;
  initialValue?: string;
}

// Chat-specific input. NLInputBar is wired to the resolve API and isn't
// reusable for a chat turn, so Canvas owns its own input. Visual language
// matches NLInputBar (rounded surface + primary icon) for consistency.
export function ChatInput({
  onSubmit,
  disabled,
  pending,
  placeholder = 'Describe your deployment...',
  initialValue = '',
}: Props) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setValue(initialValue), [initialValue]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled || pending) return;
    onSubmit(trimmed);
    setValue('');
  }

  const isDisabled = disabled || pending;

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-center gap-2 rounded-lg px-3 py-2 bg-dui-surface-secondary border border-dui-border">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          disabled={isDisabled}
          maxLength={2000}
          aria-label="Canvas chat input"
          data-testid="canvas-chat-input"
          className="flex-1 bg-transparent text-sm text-dui-text-primary placeholder:text-dui-text-muted focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isDisabled || !value.trim()}
          aria-label="Send message"
          data-testid="canvas-chat-send"
          className="flex-shrink-0 rounded-md p-1.5 text-dui-primary hover:bg-dui-surface-tertiary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
        </button>
      </div>
    </form>
  );
}
