import { useParams, useNavigate } from 'react-router-dom';
import { DataTable } from '../components/data-display/DataTable/DataTable';
import { PageHeader } from '../components/shell/PageHeader';

export function EntityListPage() {
  const { entity } = useParams<{ entity: string }>();
  const navigate = useNavigate();
  if (!entity) return null;

  return (
    <div className="flex flex-col overflow-hidden h-full">
      <PageHeader
        title={entity}
        subtitle="Default list view — backed by /api/v1/entities/{entity}."
      />
      <div className="flex-1 overflow-y-auto">
        <DataTable
          entity={entity}
          onRowClick={(e, pk) => navigate(`/entities/${e}/${encodeURIComponent(pk)}`)}
        />
      </div>
    </div>
  );
}
