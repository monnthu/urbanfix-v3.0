import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = createClient();

  const [{ count: reportCount }, { count: resolvedCount }] = await Promise.all([
    supabase.from('reports').select('*', { count: 'exact', head: true }),
    supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved'),
  ]);

  return (
    <div className="space-y-16">
      <section className="grid items-center gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <span className="badge bg-brand-100 text-brand-800">
            Civic reporting MVP
          </span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Report local issues.
            <br />
            Get them to the right people.
          </h1>
          <p className="text-lg text-slate-600">
            Snap a photo, drop a pin, and Urbanfix routes your report to the
            responsible institution by category and zone — with AI-assisted
            triage.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/reports/new" className="btn-primary">
              Report an issue
            </Link>
            <Link href="/map" className="btn-secondary">
              Explore the map
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Stat label="Reports filed" value={reportCount ?? 0} />
          <Stat label="Resolved" value={resolvedCount ?? 0} />
          <Feature title="Smart routing" body="Category + zone assignment." />
          <Feature title="AI triage" body="Photo-based priority suggestions." />
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <Step n={1} title="Report" body="Add a category, description, photo, and location." />
        <Step n={2} title="Route" body="We assign it to the responsible institution automatically." />
        <Step n={3} title="Resolve" body="Institutions triage assigned reports with AI assistance." />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card flex flex-col justify-center p-6">
      <span className="text-3xl font-bold text-brand-700">{value}</span>
      <span className="text-sm text-slate-500">{label}</span>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="card p-6">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{body}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="card p-6">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 font-semibold text-white">
        {n}
      </span>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{body}</p>
    </div>
  );
}
