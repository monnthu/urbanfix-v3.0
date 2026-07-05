import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { ApplicationRow } from './ApplicationRow';

export default async function AdminPage() {
  const session = await getSessionProfile();
  if (!session) redirect('/login?next=/admin');
  if (session.profile?.role !== 'admin') {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <h1 className="text-xl font-semibold">Admins only</h1>
        <p className="mt-2 text-sm text-slate-500">
          Your account does not have admin access.
        </p>
      </div>
    );
  }

  const supabase = createClient();
  const { data: apps } = await supabase
    .from('institution_applications')
    .select('*')
    .order('created_at', { ascending: false });

  const pending = (apps ?? []).filter((a) => a.status === 'pending');
  const processed = (apps ?? []).filter((a) => a.status !== 'pending');

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Admin — institution applications</h1>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Pending ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-slate-400">No pending applications.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((a) => (
              <ApplicationRow key={a.id} app={a} />
            ))}
          </div>
        )}
      </section>

      {processed.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Processed
          </h2>
          <div className="space-y-3">
            {processed.map((a) => (
              <ApplicationRow key={a.id} app={a} readOnly />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
