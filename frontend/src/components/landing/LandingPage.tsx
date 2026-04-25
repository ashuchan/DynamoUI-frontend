import { useState, useRef } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { useNLResolve } from '../../lib/hooks/useNLResolve';

// ── Wave paths — four sinusoidal curves at different amplitudes ───────────
const WAVE_PATHS = [
  'M0,40 C80,40 100,24 200,40 C300,56 320,24 420,40 C520,56 540,24 640,40 C720,24 760,48 800,40',
  'M0,40 C70,32 100,48 190,40 C290,32 320,50 410,40 C510,30 540,50 630,40 C720,30 760,44 800,40',
  'M0,40 C60,36 90,44 180,40 C270,36 310,46 400,40 C490,36 530,44 620,40 C710,36 750,42 800,40',
  'M0,40 C50,38 80,42 160,40 C250,38 280,43 380,40 C460,38 510,43 600,40 C690,38 740,41 800,40',
];

const HINTS = [
  'show active employees',
  'top 5 albums by purchase count',
  'list recent orders',
  'customers in Germany',
  'revenue by artist',
];

export function LandingPage() {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resolve = useNLResolve();

  async function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || resolve.isPending) return;
    setError(null);
    try {
      const outcome = await resolve.mutateAsync({ input: trimmed });
      if (outcome.kind === 'clarification_needed') {
        setError(outcome.question);
      }
      // `executed` already navigates via the hook; schedule/alert drafts will
      // surface their own modal in later milestones.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit(input);
  }

  function handleHint(hint: string) {
    setInput(hint);
    inputRef.current?.focus();
  }

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden">
      {/* Ambient decorative layers */}
      <div className="dui-landing-glow" aria-hidden="true" />
      <div className="dui-landing-grid" aria-hidden="true" />
      <div
        className="dui-landing-blob"
        aria-hidden="true"
        style={{ width: 320, height: 320, top: -80, left: -100, background: 'rgba(99,102,241,0.07)' }}
      />
      <div
        className="dui-landing-blob"
        aria-hidden="true"
        style={{ width: 220, height: 220, bottom: -50, right: -70, background: 'rgba(139,92,246,0.07)', animationDelay: '2s', animationDuration: '12s' }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-10 w-full max-w-2xl px-6 py-16">

        {/* Brand */}
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight text-dui-text-primary" style={{ letterSpacing: '-1.5px' }}>
            Dynamo<span className="text-dui-primary">UI</span>
          </h1>
          <p className="mt-2 text-sm text-dui-text-muted tracking-wide">
            Natural language · Instant data interfaces
          </p>
        </div>

        {/* Voice signal waves */}
        <svg
          viewBox="0 0 800 80"
          preserveAspectRatio="none"
          className="w-full"
          style={{ height: 52 }}
          aria-hidden="true"
        >
          <g style={{ transformOrigin: '400px 40px' }}>
            {WAVE_PATHS.map((d, i) => (
              <path
                key={i}
                d={d}
                strokeWidth={1.4 - i * 0.2}
                className={`dui-wave dui-wave-${i + 1}`}
              />
            ))}
          </g>
        </svg>

        {/* Prompt bar */}
        <div className="w-full">
          <form onSubmit={handleSubmit}>
            <div className="dui-prompt-box flex items-center gap-3 px-5 py-4">
              {resolve.isPending ? (
                <Loader2 size={18} className="text-dui-primary animate-spin flex-shrink-0" />
              ) : (
                <svg
                  width="18" height="18"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-dui-primary flex-shrink-0"
                  aria-hidden="true"
                >
                  <path d="M10 2v2m0 12v2M2 10h2m12 0h2M4.93 4.93l1.41 1.41m7.07 7.07 1.41 1.41M4.93 15.07l1.41-1.41m7.07-7.07 1.41-1.41" strokeLinecap="round" />
                  <circle cx="10" cy="10" r="3" fill="currentColor" opacity="0.4" />
                </svg>
              )}

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={'Ask anything \u2014 e.g. \u201cshow top 5 albums by purchase\u201d'}
                maxLength={500}
                disabled={resolve.isPending}
                className="flex-1 bg-transparent text-base text-dui-text-primary placeholder:text-dui-text-muted focus:outline-none"
                aria-label="Natural language query"
              />

              <button
                type="submit"
                disabled={resolve.isPending || !input.trim()}
                className="dui-prompt-submit flex-shrink-0 text-sm px-5 py-2.5"
              >
                Ask →
              </button>
            </div>
          </form>

          {/* Error */}
          {error && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-dui-danger px-1">
              <AlertCircle size={11} />
              {error}
            </div>
          )}

          {/* Hint pills */}
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {HINTS.map((hint) => (
              <button
                key={hint}
                type="button"
                onClick={() => handleHint(hint)}
                className="text-xs text-dui-text-muted border border-dui-border rounded-full px-3 py-1 bg-transparent hover:text-dui-text-secondary hover:border-dui-text-muted transition-colors"
              >
                {hint}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-dui-text-muted opacity-50 text-center">
          Pattern cache · LLM fallback · Zero SQL required
        </p>
      </div>
    </div>
  );
}
