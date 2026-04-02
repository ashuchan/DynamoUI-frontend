import { LayoutGrid } from 'lucide-react';

interface CategoryHeaderProps {
  category: string;
  count: number;
}

export function CategoryHeader({ category, count }: CategoryHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <LayoutGrid size={14} className="text-dui-text-muted" />
      <h2 className="text-xs font-semibold uppercase tracking-widest text-dui-text-muted">
        {category}
      </h2>
      <span className="ml-auto text-xs text-dui-text-muted">{count}</span>
    </div>
  );
}
