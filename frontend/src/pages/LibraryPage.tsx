import { useNavigate } from 'react-router-dom';
import { Dashboard } from '../components/dashboard/Dashboard';
import { PageHeader } from '../components/shell/PageHeader';

export function LibraryPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col overflow-hidden h-full">
      <PageHeader
        title="Library"
        subtitle="Admin-curated widgets. Run one to drop pre-built queries into your workspace."
      />
      <div className="flex-1 overflow-y-auto p-6">
        <Dashboard
          onNavigate={(e, pk) => navigate(`/entities/${e}/${encodeURIComponent(pk)}`)}
        />
      </div>
    </div>
  );
}
