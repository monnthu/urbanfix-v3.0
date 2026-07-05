import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ReportCard } from '@/components/ReportCard';
import type { Category, Report } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { category?: string; status?: string };
}) {
  const supabase = createClient();

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('label');

  let query = supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (searchParams.category) query = query.eq('category', searchParams.category);
  if (searchParams.status) query = query.eq('status', searchParams.status);

  const { data: reports } = await query;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Reports</h1>
        <Link href="/reports/new" className="btn-primary">
          Report an issue
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterLink label="All" active={!searchParams.category} href="/reports" />
        {(categories as Category[] | null)?.map((c) => (
          <FilterLink
            key={c.id}
            label={c.label}
            active={searchParams.category === c.id}
            href={`/reports?category=${c.id}`}
          />
        ))}
      </div>

      {reports && reports.length > 0 ? (
        <div className="grid gap-3">
          {(reports as Report[]).map((r) => (
            <ReportCard key={r.id} report={r} />
          ))}
        </div>
      ) : (
        <div className="card p-10 text-center text-slate-500">
          No reports yet.{' '}
          <Link href="/reports/new" className="text-brand-600 underline">
            Be the first to file one.
          </Link>
        </div>
      )}
    </div>
  );
}

function FilterLink({
  label,
  active,
  href,
}: {
  label: string;
  active: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`badge border px-3 py-1 ${
        active
          ? 'border-brand-500 bg-brand-50 text-brand-700'
          : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-100'
      }`}
    >
      {label}
    </Link>
  );
}
