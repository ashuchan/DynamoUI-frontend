import { useState, useRef, useEffect } from 'react';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { useNLResolve } from '../../lib/hooks/useNLResolve';
import type { ResolutionResultV2 } from '../../lib/types';

interface NLInputBarProps {
  // Allows a page (e.g. ResultsLayout) to react to non-executed outcomes
  // (schedule_draft, alert_draft, clarification) without losing routing of
  // the executed path handled by useNLResolve itself.
  onOutcome?: (outcome: ResolutionResultV2) => void;
  compact?: boolean;
  initialValue?: string;
}

export function NLInputBar({ onOutcome, compact, initialValue = '' }: NLInputBarProps) {
  const [input, setInput] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resolve = useNLResolve();

  useEffect(() => setInput(initialValue), [initialValue]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || resolve.isPending) return;
    setError(null);
    try {
      const outcome = await resolve.mutateAsync({ input: trimmed });
      onOutcome?.(outcome);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  }

  const h = compact ? 'py-1.5' : 'py-3';
  const icon = compact ? 13 : 16;

  return (
    <form onSubmit={submit} className="w-full">
      <div
        className={`flex items-center gap-2 rounded-lg px-3 ${h}`}
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--dui-border)',
        }}
      >
        {resolve.isPending ? (
          <Loader2 size={icon} className="text-dui-primary animate-spin flex-shrink-0" />
        ) : (
          <Sparkles size={icon} className="text-dui-primary flex-shrink-0" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Ask anything — e.g. “top 5 albums by purchase”"
          maxLength={500}
          disabled={resolve.isPending}
          className="flex-1 bg-transparent text-sm text-dui-text-primary placeholder:text-dui-text-muted focus:outline-none"
          aria-label="Natural language query"
        />
        <span className="hidden md:inline text-[10px] text-dui-text-muted border border-dui-border rounded px-1.5 py-0.5">
          ⌘K
        </span>
      </div>
      {error && (
        <div className="absolute mt-1 flex items-center gap-1 text-xs text-dui-danger">
          <AlertCircle size={10} />
          {error}
        </div>
      )}
    </form>
  );
}
