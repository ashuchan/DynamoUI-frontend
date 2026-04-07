import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { AuthScreen } from './AuthScreen';

/**
 * Gate ``children`` behind a live auth session.
 *
 * While the AuthProvider rehydrates from localStorage we render a tiny
 * placeholder so the UI doesn't flicker between the dashboard and the sign-in
 * screen. Once booted, unauthenticated users see ``<AuthScreen />``.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isBooting } = useAuth();

  if (isBooting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2
          size={18}
          className="text-dui-text-muted animate-spin"
          aria-label="Loading session"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return <>{children}</>;
}
