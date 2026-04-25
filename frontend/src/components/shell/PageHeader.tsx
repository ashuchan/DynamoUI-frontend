import type { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-dui-border flex-shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-dui-text-primary tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-xs text-dui-text-muted">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function PagePlaceholder({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col overflow-hidden h-full">
      <PageHeader title={title} />
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="max-w-md text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-dui-border bg-dui-surface px-3 py-1 text-[10px] uppercase tracking-widest text-dui-text-muted mb-4">
            Coming soon
          </div>
          <p className="text-sm text-dui-text-secondary leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
