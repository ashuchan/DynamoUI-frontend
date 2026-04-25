import { AdminPortal } from '../admin/AdminPortal';
import { PageHeader } from '../components/shell/PageHeader';

export function AdminPage() {
  return (
    <div className="flex flex-col overflow-hidden h-full">
      <PageHeader
        title="Admin"
        subtitle="Tenant connections, scaffolding jobs, and YAML registry."
      />
      <div className="flex-1 overflow-y-auto p-6">
        <AdminPortal />
      </div>
    </div>
  );
}
