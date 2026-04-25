import { useState, type FormEvent } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

type Mode = 'signin' | 'signup';

/**
 * Unified sign-in / sign-up screen. Rendered by ``App.tsx`` whenever the
 * user is unauthenticated. Kept intentionally small — no router, no forms
 * library — so it adds negligible bundle weight to the main app.
 */
export function AuthScreen() {
  const { login, signup, googleLogin, error } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleIdToken, setGoogleIdToken] = useState('');
  const [showGoogleField, setShowGoogleField] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await login({ email: email.trim(), password });
      } else {
        const trimmedTenant = tenantName.trim();
        await signup({
          email: email.trim(),
          password,
          display_name: displayName.trim(),
          tenant_name: trimmedTenant || undefined,
        });
      }
    } catch {
      // error is surfaced via useAuth()
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle(e: FormEvent) {
    e.preventDefault();
    if (!googleIdToken) return;
    setSubmitting(true);
    try {
      await googleLogin(googleIdToken);
    } catch {
      // error is surfaced via useAuth()
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-dui-surface-secondary flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 bg-dui-surface border border-dui-border rounded-lg p-6 shadow-sm">
        <header className="space-y-1">
          <h1 className="text-lg font-bold text-dui-text-primary tracking-tight">
            Dynamo<span className="text-dui-primary">UI</span>
          </h1>
          <p className="text-sm text-dui-text-secondary">
            {mode === 'signin'
              ? 'Sign in to your tenant'
              : 'Create a new account'}
          </p>
        </header>

        <div className="flex gap-1 rounded-md bg-dui-surface-secondary p-1">
          <TabButton
            label="Sign In"
            active={mode === 'signin'}
            onClick={() => setMode('signin')}
          />
          <TabButton
            label="Sign Up"
            active={mode === 'signup'}
            onClick={() => setMode('signup')}
          />
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <>
              <TextInput
                label="Display name"
                value={displayName}
                onChange={setDisplayName}
                required
                autoComplete="name"
              />
              <TextInput
                label="Tenant name (optional)"
                value={tenantName}
                onChange={setTenantName}
                autoComplete="organization"
              />
            </>
          )}
          <TextInput
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            required
            autoComplete="email"
          />
          <TextInput
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            required
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            minLength={mode === 'signup' ? 8 : undefined}
          />

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-md bg-dui-surface-secondary px-3 py-2 text-sm text-dui-danger"
            >
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-dui-primary text-dui-on-primary text-sm font-medium px-4 py-2 disabled:opacity-60 focus:outline-none dui-focus-ring"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowGoogleField((s) => !s)}
            className="text-xs text-dui-text-secondary hover:text-dui-text-primary"
          >
            {showGoogleField ? 'Hide Google ID token input' : 'Sign in with a Google ID token'}
          </button>
          {showGoogleField && (
            <form className="space-y-2" onSubmit={handleGoogle}>
              <p className="text-xs text-dui-text-muted">
                Paste a Google ID token obtained via your OAuth client. Full
                button flow lands in Phase 2.
              </p>
              <textarea
                value={googleIdToken}
                onChange={(e) => setGoogleIdToken(e.target.value)}
                rows={3}
                className="w-full text-xs font-mono bg-dui-surface border border-dui-border rounded-md px-2 py-1.5 focus:outline-none dui-focus-ring"
                aria-label="Google ID token"
              />
              <button
                type="submit"
                disabled={submitting || !googleIdToken}
                className="w-full text-sm font-medium rounded-md border border-dui-border px-3 py-1.5 hover:bg-dui-surface-secondary disabled:opacity-60"
              >
                Verify with Google
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex-1 text-sm font-medium rounded-md px-3 py-1.5 focus:outline-none dui-focus-ring',
        active
          ? 'bg-dui-surface text-dui-text-primary shadow-sm'
          : 'text-dui-text-secondary hover:text-dui-text-primary',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = 'text',
  required,
  autoComplete,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  minLength?: number;
}) {
  return (
    <label className="block text-xs font-medium text-dui-text-secondary">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        minLength={minLength}
        className="mt-1 w-full text-sm bg-dui-surface border border-dui-border rounded-md px-3 py-1.5 focus:outline-none dui-focus-ring text-dui-text-primary"
      />
    </label>
  );
}
