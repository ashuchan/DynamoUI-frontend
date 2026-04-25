import { Outlet, useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { LeftNav } from './LeftNav';

// The shell composes: TopBar (persistent NL bar, user/tenant chip) + LeftNav
// + the routed page. Individual pages choose whether they want to render an
// ActionRail on the right; the shell stays neutral.
export function AppShell() {
  const location = useLocation();

  // Landing at "/" is intentionally chrome-lite: no LeftNav, full-bleed hero.
  const isLanding = location.pathname === '/';
  // Shared/embed routes render without chrome (handled in their own trees).

  if (isLanding) {
    return (
      <div className="min-h-screen flex flex-col bg-dui-bg">
        <TopBar />
        <main className="flex-1 flex flex-col">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-dui-bg">
      <TopBar />
      <div className="flex-1 flex overflow-hidden" style={{ minHeight: 'calc(100vh - 52px)' }}>
        <LeftNav />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
