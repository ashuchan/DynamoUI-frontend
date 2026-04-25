import { useParams, useNavigate } from 'react-router-dom';
import { DetailCard } from '../components/data-display/DetailCard/DetailCard';
import { PageHeader } from '../components/shell/PageHeader';

export function EntityDetailPage() {
  const { entity, pk } = useParams<{ entity: string; pk: string }>();
  const navigate = useNavigate();
  if (!entity || !pk) return null;

  return (
    <div className="flex flex-col overflow-hidden h-full">
      <PageHeader title={`${entity} · ${pk}`} />
      <div className="flex-1 overflow-y-auto p-6">
        <DetailCard
          entity={entity}
          pk={pk}
          onBack={() => navigate(-1)}
          onNavigate={(e, id) => navigate(`/entities/${e}/${encodeURIComponent(id)}`)}
        />
      </div>
    </div>
  );
}
