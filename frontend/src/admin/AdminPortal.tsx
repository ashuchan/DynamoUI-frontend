import { useState } from 'react';
import { Database, Wand2 } from 'lucide-react';
import { ConnectionsPage } from './ConnectionsPage';
import { ScaffoldJobsPage } from './ScaffoldJobsPage';

type AdminTab = 'connections' | 'scaffold';

/**
 * Top-level admin portal — minimal in-tree router. Owners and admins can
 * manage their tenant's database connections and review scaffold jobs.
 *
 * Phase 4 will add Skills/Patterns/Widgets tabs that talk to the
 * /admin/registry/* endpoints.
 */
export function AdminPortal() {
  const [tab, setTab] = useState<AdminTab>('connections');

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-md bg-dui-surface p-1 border border-dui-border w-fit">
        <TabButton
          icon={<Database size={14} />}
          label="Connections"
          active={tab === 'connections'}
          onClick={() => setTab('connections')}
        />
        <TabButton
          icon={<Wand2 size={14} />}
          label="Scaffold Jobs"
          active={tab === 'scaffold'}
          onClick={() => setTab('scaffold')}
        />
      </div>
      {tab === 'connections' && <ConnectionsPage />}
      {tab === 'scaffold' && <ScaffoldJobsPage />}
    </div>
  );
}

function TabButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium focus:outline-none dui-focus-ring',
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
