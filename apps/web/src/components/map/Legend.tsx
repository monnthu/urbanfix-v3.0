import { categoryColor } from '@/lib/constants';
import type { Category } from '@/lib/types';

export function Legend({ categories }: { categories: Category[] }) {
  return (
    <div className="card p-4">
      <h3 className="mb-2 text-sm font-semibold">Legend</h3>
      <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-1">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full border border-white shadow"
              style={{ backgroundColor: categoryColor(c.id) }}
            />
            <span className="text-slate-600">{c.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
