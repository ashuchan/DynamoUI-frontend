import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppShell } from './components/shell/AppShell';

// Route-addressable pages
import { HomePage } from './pages/HomePage';
import { ResultsPage } from './pages/ResultsPage';
import { EntitiesPage } from './pages/EntitiesPage';
import { EntityListPage } from './pages/EntityListPage';
import { EntityDetailPage } from './pages/EntityDetailPage';
import { LibraryPage } from './pages/LibraryPage';
import { ViewsPage } from './pages/ViewsPage';
import { ViewExecutePage } from './pages/ViewExecutePage';
import { DashboardsPage, DashboardDetailPage } from './pages/DashboardsPage';
import { SchedulesPage, ScheduleDetailPage } from './pages/SchedulesPage';
import { AlertsPage, AlertDetailPage } from './pages/AlertsPage';
import { SharedListPage, SharedTokenPage, EmbedTokenPage } from './pages/SharedPage';
import { AdminPage } from './pages/AdminPage';
import { CanvasPage } from './pages/CanvasPage';
import { NotFoundPage } from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      // Contract §6.2: lists stale 30s, individual resources 60s. Pages that
      // need bespoke staleness override locally.
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Unauthenticated shared/embed surfaces — no chrome, no auth gate */}
            <Route path="/shared/:token" element={<SharedTokenPage />} />
            <Route path="/embed/:token" element={<EmbedTokenPage />} />

            {/* Everything else is behind the auth gate + shell */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<HomePage />} />
              <Route path="dashboards" element={<DashboardsPage />} />
              <Route path="dashboards/:id" element={<DashboardDetailPage />} />
              <Route path="views" element={<ViewsPage />} />
              <Route path="views/:id" element={<ViewExecutePage />} />
              <Route path="entities" element={<EntitiesPage />} />
              <Route path="entities/:entity" element={<EntityListPage />} />
              <Route path="entities/:entity/:pk" element={<EntityDetailPage />} />
              <Route path="library" element={<LibraryPage />} />
              <Route path="schedules" element={<SchedulesPage />} />
              <Route path="schedules/:id" element={<ScheduleDetailPage />} />
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="alerts/:id" element={<AlertDetailPage />} />
              <Route path="results/:sessionId" element={<ResultsPage />} />
              <Route path="shared" element={<SharedListPage />} />
              <Route path="canvas" element={<CanvasPage />} />
              <Route path="admin" element={<AdminPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
