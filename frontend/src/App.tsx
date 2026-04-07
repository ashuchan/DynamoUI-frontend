import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LogOut, Settings } from 'lucide-react';
import { LandingPage } from './components/landing/LandingPage';
import { ResultsLayout } from './components/results/ResultsLayout';
import { DetailCard } from './components/data-display/DetailCard/DetailCard';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminPortal } from './admin/AdminPortal';
import type { ResolutionResult } from './lib/types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

// ── View state ────────────────────────────────────────────────────────────────

type View =
  | { type: 'landing' }
  | { type: 'results'; query: string; result: ResolutionResult }
  | { type: 'record'; entity: string; pk: string }
  | { type: 'admin' };

// ── Floating tenant / admin menu ─────────────────────────────────────────────
// Sits in the top-right of every view so signed-in users can reach the admin
// portal and sign out without cluttering the new landing/results layout.

function TenantOverlay({
  onOpenAdmin,
  onExitAdmin,
  inAdmin,
}: {
  onOpenAdmin: () => void;
  onExitAdmin: () => void;
  inAdmin: boolean;
}) {
  const { user, tenant, logout } = useAuth();
  if (!user || !tenant) return null;

  const canAdmin = tenant.role === 'owner' || tenant.role === 'admin';

  return (
    <div
      className="fixed top-3 right-3 z-50 flex items-center gap-2 rounded-lg border border-dui-border bg-dui-surface/80 px-2 py-1.5 shadow-sm backdrop-blur"
    >
      <div className="flex flex-col items-end leading-tight pr-1">
        <span className="text-xs font-medium text-dui-text-primary truncate max-w-[140px]">
          {tenant.name}
        </span>
        <span className="text-[10px] text-dui-text-muted truncate max-w-[140px]">
          {user.email} · {tenant.role}
        </span>
      </div>
      {canAdmin && (
        <button
          type="button"
          onClick={inAdmin ? onExitAdmin : onOpenAdmin}
          aria-label={inAdmin ? 'Close admin portal' : 'Open admin portal'}
          className={[
            'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs focus:outline-none dui-focus-ring transition-colors',
            inAdmin
              ? 'bg-dui-surface-secondary text-dui-text-primary'
              : 'text-dui-text-secondary hover:bg-dui-surface-secondary',
          ].join(' ')}
        >
          <Settings size={13} />
          Admin
        </button>
      )}
      <button
        type="button"
        onClick={logout}
        aria-label="Sign out"
        className="inline-flex items-center rounded-md p-1.5 text-dui-text-secondary hover:bg-dui-surface-secondary focus:outline-none dui-focus-ring"
      >
        <LogOut size={14} />
      </button>
    </div>
  );
}

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

  function openAdmin() {
    push({ type: 'admin' });
  }

  function exitAdmin() {
    const prev = history[history.length - 1];
    if (prev) {
      goBack();
    } else {
      setView({ type: 'landing' });
      setHistory([]);
    }
  }

  const overlay = (
    <TenantOverlay
      inAdmin={view.type === 'admin'}
      onOpenAdmin={openAdmin}
      onExitAdmin={exitAdmin}
    />
  );

  // ── Admin portal view ────────────────────────────────────────────────────
  if (view.type === 'admin') {
    return (
      <div className="min-h-screen bg-dui-bg">
        {overlay}
        <main className="max-w-7xl w-full mx-auto px-4 py-6">
          <AdminPortal />
        </main>
      </div>
    );
  }

  // ── Record detail view ────────────────────────────────────────────────────
  if (view.type === 'record') {
    return (
      <div
        className="min-h-screen bg-dui-bg flex flex-col"
        style={{ '--dui-surface-secondary': 'var(--dui-bg)' } as React.CSSProperties}
      >
        {overlay}
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
      <>
        {overlay}
        <ResultsLayout
          query={view.query}
          result={view.result}
          onRowClick={handleRowClick}
          onNewQuery={handleNewQuery}
          onBack={() => { setView({ type: 'landing' }); setHistory([]); }}
        />
      </>
    );
  }

  // ── Landing view ──────────────────────────────────────────────────────────
  return (
    <>
      {overlay}
      <LandingPage onResolved={handleResolved} />
    </>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ProtectedRoute>
          <AppShell />
        </ProtectedRoute>
      </AuthProvider>
    </QueryClientProvider>
  );
}
