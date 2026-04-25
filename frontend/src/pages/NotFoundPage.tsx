import { Link, useLocation } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export function NotFoundPage() {
  const { pathname } = useLocation();
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md w-full flex flex-col items-center text-center gap-3 rounded-md border border-dui-border bg-dui-surface p-6 shadow-sm">
        <AlertCircle size={20} className="text-dui-text-muted" />
        <h1 className="text-base font-semibold text-dui-text-primary">
          Page not found
        </h1>
        <p className="text-xs text-dui-text-secondary">
          No route matches <code className="font-mono">{pathname}</code>.
        </p>
        <Link
          to="/"
          className="text-xs font-medium text-dui-primary hover:underline"
        >
          Go home →
        </Link>
      </div>
    </div>
  );
}
