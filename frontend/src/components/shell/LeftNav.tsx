import { NavLink } from 'react-router-dom';
import {
  Home,
  LayoutDashboard,
  Eye,
  Database,
  BookMarked,
  CalendarClock,
  BellRing,
  Share2,
  Search,
  Palette,
} from 'lucide-react';

interface NavEntry {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const NAV: NavEntry[] = [
  { to: '/', label: 'Home', icon: <Home size={14} /> },
  { to: '/dashboards', label: 'Dashboards', icon: <LayoutDashboard size={14} /> },
  { to: '/views', label: 'Views', icon: <Eye size={14} /> },
  { to: '/entities', label: 'Entities', icon: <Database size={14} /> },
  { to: '/library', label: 'Library', icon: <BookMarked size={14} /> },
  { to: '/schedules', label: 'Schedules', icon: <CalendarClock size={14} /> },
  { to: '/alerts', label: 'Alerts', icon: <BellRing size={14} /> },
  { to: '/shared', label: 'Shared', icon: <Share2 size={14} /> },
  { to: '/canvas', label: 'Canvas', icon: <Palette size={14} /> },
];

export function LeftNav() {
  return (
    <aside
      className="flex-shrink-0 flex flex-col py-3 px-2 border-r border-dui-border"
      style={{ width: 200, background: 'var(--dui-surface-secondary)' }}
      aria-label="Primary navigation"
    >
      <div className="px-2 pb-2 flex items-center gap-2 text-[10px] uppercase tracking-widest text-dui-text-muted">
        <Search size={11} />
        <span>Workspace</span>
      </div>
      <nav className="flex flex-col gap-0.5">
        {NAV.map((entry) => (
          <NavLink
            key={entry.to}
            to={entry.to}
            end={entry.to === '/'}
            className={({ isActive }) =>
              [
                'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] transition-colors dui-focus-ring',
                isActive
                  ? 'bg-dui-surface-tertiary text-dui-text-primary'
                  : 'text-dui-text-secondary hover:bg-dui-surface-tertiary/60 hover:text-dui-text-primary',
              ].join(' ')
            }
          >
            {entry.icon}
            <span>{entry.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
