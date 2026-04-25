import { PageHeader } from '../components/shell/PageHeader';
import { SavedViewList } from '../components/saved-view/SavedViewList';

export function ViewsPage() {
  return (
    <div className="flex flex-col overflow-hidden h-full">
      <PageHeader
        title="My Views"
        subtitle="Named queries you saved — click to execute, pin, share, or schedule."
      />
      <div className="flex-1 overflow-y-auto">
        <SavedViewList />
      </div>
    </div>
  );
}
