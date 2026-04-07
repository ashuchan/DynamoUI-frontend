import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LandingPage } from './components/landing/LandingPage';
import { ResultsLayout } from './components/results/ResultsLayout';
import { DetailCard } from './components/data-display/DetailCard/DetailCard';
import type { ResolutionResult } from './lib/types';
import { useState } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

// ── View state ────────────────────────────────────────────────────────────────

type View =
  | { type: 'landing' }
  | { type: 'results'; query: string; result: ResolutionResult }
  | { type: 'record'; entity: string; pk: string };

// ── App shell ─────────────────────────────────────────────────────────────────

function AppShell() {
  const [view, setView]     = useState<View>({ type: 'landing' });
  const [history, setHistory] = useState<View[]>([]);

  function push(next: View) {
    setHistory((h) => [...h, view]);
    setView(next);
  }

  function goBack() {
    const prev = history[history.length - 1];
    if (prev) {
      setView(prev);
      setHistory((h) => h.slice(0, -1));
    }
  }

  function handleResolved(query: string, result: ResolutionResult) {
    // Only show results view when we have entity + query_plan rows
    if (result.entity && result.query_plan?.rows.length) {
      push({ type: 'results', query, result });
    } else if (result.entity) {
      // Resolved to an entity but no pre-fetched rows — still show results
      push({ type: 'results', query, result });
    }
  }

  function handleRowClick(entity: string, pk: string) {
    push({ type: 'record', entity, pk });
  }

  function handleNewQuery(query: string, result: ResolutionResult) {
    // Replace the current results view (don't stack results on results)
    setHistory((h) => {
      const filtered = h.filter((v) => v.type !== 'results');
      return [...filtered, view];
    });
    setView({ type: 'results', query, result });
  }

  function handleBack() {
    const prev = history[history.length - 1];
    if (prev) {
      goBack();
    } else {
      setView({ type: 'landing' });
      setHistory([]);
    }
  }

  // ── Record detail view ────────────────────────────────────────────────────
  if (view.type === 'record') {
    return (
      <div
        className="min-h-screen bg-dui-bg flex flex-col"
        style={{ '--dui-surface-secondary': 'var(--dui-bg)' } as React.CSSProperties}
      >
        {/* Minimal header for record view */}
        <header
          className="flex items-center gap-4 px-4 border-b border-dui-border flex-shrink-0"
          style={{ height: 52, background: 'rgba(17,24,39,0.9)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 40 }}
        >
          <span className="text-sm font-bold text-dui-text-primary tracking-tight" style={{ letterSpacing: '-0.4px' }}>
            Dynamo<span className="text-dui-primary">UI</span>
          </span>
          <button
            type="button"
            onClick={handleBack}
            className="ml-auto text-xs text-dui-text-muted border border-dui-border rounded-lg px-3 py-1.5 hover:text-dui-text-secondary transition-colors"
          >
            ← Back
          </button>
        </header>
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
          <DetailCard
            entity={view.entity}
            pk={view.pk}
            onBack={history.length > 0 ? handleBack : undefined}
            onNavigate={handleRowClick}
          />
        </main>
      </div>
    );
  }

  // ── Results view ──────────────────────────────────────────────────────────
  if (view.type === 'results') {
    return (
      <ResultsLayout
        query={view.query}
        result={view.result}
        onRowClick={handleRowClick}
        onNewQuery={handleNewQuery}
        onBack={() => { setView({ type: 'landing' }); setHistory([]); }}
      />
    );
  }

  // ── Landing view ──────────────────────────────────────────────────────────
  return <LandingPage onResolved={handleResolved} />;
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  );
}
