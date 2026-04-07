import { useState, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Search, Loader2, AlertCircle, LayoutDashboard, LogOut, Settings, Table2 } from 'lucide-react';
import { Dashboard } from './components/dashboard/Dashboard';
import { DataTable } from './components/data-display/DataTable/DataTable';
import { DetailCard } from './components/data-display/DetailCard/DetailCard';
import { apiClient } from './lib/apiClient';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminPortal } from './admin/AdminPortal';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

// ── View types ──────────────────────────────────────────────────────────────

import type { ResolvedData } from './lib/types';

type View =
  | { type: 'dashboard' }
  | { type: 'entity'; entity: string; resolvedData?: ResolvedData }
  | { type: 'record'; entity: string; pk: string }
  | { type: 'admin' };

// ── NL Search Bar ────────────────────────────────────────────────────────────

interface NLBarProps {
  onNavigate: (entity: string, pk?: string, resolvedData?: ResolvedData) => void;
}

function NLBar({ onNavigate }: NLBarProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.resolve(trimmed);

      if (result.entity) {
        onNavigate(result.entity, undefined, result.query_plan ?? undefined);
        setInput('');
      } else {
        setError('Could not determine which entity to show. Try being more specific.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl">
      <div className="flex items-center gap-2 bg-dui-surface border border-dui-border rounded-lg px-3 py-2 shadow-sm focus-within:border-dui-border">
        {isLoading ? (
          <Loader2 size={16} className="text-dui-text-muted animate-spin flex-shrink-0" />
        ) : (
          <Search size={16} className="text-dui-text-muted flex-shrink-0" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (error) setError(null);
          }}
          placeholder={'Ask anything \u2014 e.g. \u201cshow active employees\u201d, \u201clist recent orders\u201d'}
          maxLength={500}
          disabled={isLoading}
          className="flex-1 bg-transparent text-sm text-dui-text-primary placeholder:text-dui-text-muted focus:outline-none"
          aria-label="Natural language query"
        />
      </div>
      {error && (
        <div className="absolute left-0 top-full mt-1 flex items-center gap-1.5 text-xs text-dui-danger">
          <AlertCircle size={11} />
          {error}
        </div>
      )}
    </form>
  );
}

// ── Nav tab button ────────────────────────────────────────────────────────────

function NavTab({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium focus:outline-none dui-focus-ring transition-colors',
        active
          ? 'bg-dui-surface-secondary text-dui-text-primary'
          : 'text-dui-text-secondary hover:bg-dui-surface-secondary',
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
  );
}

// ── Admin tab — only visible to owners + admins ─────────────────────────────

function AdminTab({ active, onClick }: { active: boolean; onClick: () => void }) {
  const { tenant } = useAuth();
  if (!tenant || (tenant.role !== 'owner' && tenant.role !== 'admin')) return null;
  return (
    <NavTab
      label="Admin"
      icon={<Settings size={14} />}
      active={active}
      onClick={onClick}
    />
  );
}

// ── Tenant menu ─────────────────────────────────────────────────────────────

function TenantMenu() {
  const { user, tenant, logout } = useAuth();
  if (!user || !tenant) return null;
  return (
    <div className="flex items-center gap-2 pl-2 ml-1 border-l border-dui-border">
      <div className="flex flex-col items-end leading-tight">
        <span className="text-xs font-medium text-dui-text-primary truncate max-w-[140px]">
          {tenant.name}
        </span>
        <span className="text-[10px] text-dui-text-muted truncate max-w-[140px]">
          {user.email} · {tenant.role}
        </span>
      </div>
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

// ── App Shell ────────────────────────────────────────────────────────────────

function AppShell() {
  const [view, setView] = useState<View>({ type: 'dashboard' });
  const [history, setHistory] = useState<View[]>([]);

  function navigate(nextView: View) {
    setHistory((prev) => [...prev, view]);
    setView(nextView);
  }

  function goBack() {
    const prev = history[history.length - 1];
    if (prev) {
      setView(prev);
      setHistory((h) => h.slice(0, -1));
    }
  }

  function handleNLNavigate(entity: string, pk?: string, resolvedData?: ResolvedData) {
    if (pk) {
      navigate({ type: 'record', entity, pk });
    } else {
      navigate({ type: 'entity', entity, resolvedData });
    }
  }

  function handleRowClick(entity: string, pk: string) {
    navigate({ type: 'record', entity, pk });
  }

  function handleWidgetNavigate(entity: string, pk: string) {
    navigate({ type: 'record', entity, pk });
  }

  return (
    <div className="min-h-screen bg-dui-surface-secondary flex flex-col">
      {/* Top bar */}
      <header className="bg-dui-surface border-b border-dui-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
          {/* Brand */}
          <span className="text-sm font-bold text-dui-text-primary tracking-tight flex-shrink-0">
            Dynamo<span className="text-dui-primary">UI</span>
          </span>

          {/* NL bar */}
          <div className="flex-1 min-w-0">
            <NLBar onNavigate={handleNLNavigate} />
          </div>

          {/* Nav tabs */}
          <nav className="flex items-center gap-1 flex-shrink-0">
            <NavTab
              label="Dashboard"
              icon={<LayoutDashboard size={14} />}
              active={view.type === 'dashboard'}
              onClick={() => navigate({ type: 'dashboard' })}
            />
            {(view.type === 'entity' || view.type === 'record') && (
              <NavTab
                label={view.entity}
                icon={<Table2 size={14} />}
                active={view.type === 'entity'}
                onClick={() =>
                  navigate({
                    type: 'entity',
                    entity: (view as { entity: string }).entity,
                  })
                }
              />
            )}
            <AdminTab active={view.type === 'admin'} onClick={() => navigate({ type: 'admin' })} />
            <TenantMenu />
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {view.type === 'dashboard' && (
          <Dashboard onNavigate={handleWidgetNavigate} />
        )}

        {view.type === 'entity' && (
          <DataTable
            entity={view.entity}
            resolvedData={view.resolvedData}
            onRowClick={handleRowClick}
            onNavigate={handleWidgetNavigate}
          />
        )}

        {view.type === 'record' && (
          <DetailCard
            entity={view.entity}
            pk={view.pk}
            onBack={history.length > 0 ? goBack : undefined}
            onNavigate={handleWidgetNavigate}
          />
        )}

        {view.type === 'admin' && <AdminPortal />}
      </main>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────

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
