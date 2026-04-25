import { Link, useLocation } from 'react-router-dom';
import { LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { NLInputBar } from './NLInputBar';

export function TopBar() {
  const { user, tenant, logout } = useAuth();
  const location = useLocation();
  const hideNL = location.pathname === '/'; // landing hero has its own prompt

  const canAdmin = tenant?.role === 'owner' || tenant?.role === 'admin';
  const inAdmin = location.pathname.startsWith('/admin');

  return (
    <header
      className="flex items-center gap-4 px-4 border-b border-dui-border flex-shrink-0"
      style={{
        height: 52,
        background: 'rgba(17,24,39,0.9)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Brand */}
      <Link to="/" className="flex-shrink-0">
        <span
          className="text-sm font-bold text-dui-text-primary tracking-tight"
          style={{ letterSpacing: '-0.4px' }}
        >
          Dynamo<span className="text-dui-primary">UI</span>
        </span>
      </Link>

      {/* Persistent NL bar */}
      <div className="flex-1 max-w-2xl">
        {!hideNL && <NLInputBar compact />}
      </div>

      {/* Tenant + user chip */}
      {user && tenant && (
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex flex-col items-end leading-tight pr-1">
            <span className="text-xs font-medium text-dui-text-primary truncate max-w-[140px]">
              {tenant.name}
            </span>
            <span className="text-[10px] text-dui-text-muted truncate max-w-[140px]">
              {user.email} · {tenant.role}
            </span>
          </div>

          {canAdmin && (
            <Link
              to={inAdmin ? '/' : '/admin'}
              aria-label={inAdmin ? 'Close admin portal' : 'Open admin portal'}
              className={[
                'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs focus:outline-none dui-focus-ring transition-colors',
                inAdmin
                  ? 'bg-dui-surface-tertiary text-dui-text-primary'
                  : 'text-dui-text-secondary hover:bg-dui-surface-tertiary',
              ].join(' ')}
            >
              <Settings size={13} />
              Admin
            </Link>
          )}

          <button
            type="button"
            onClick={logout}
            aria-label="Sign out"
            className="inline-flex items-center rounded-md p-1.5 text-dui-text-secondary hover:bg-dui-surface-tertiary focus:outline-none dui-focus-ring"
          >
            <LogOut size={14} />
          </button>
        </div>
      )}
    </header>
  );
}
