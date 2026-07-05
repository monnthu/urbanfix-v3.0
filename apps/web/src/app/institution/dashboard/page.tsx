import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardReports } from './DashboardReports';
import { AiChat } from './AiChat';
import type { Institution, Report } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function InstitutionDashboardPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const session = await getSessionProfile();
  if (!session) redirect('/login?next=/institution/dashboard');

  if (session.profile?.role !== 'institution' || !session.profile.institution_id) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <h1 className="text-xl font-semibold">No institution access</h1>
        <p className="mt-2 text-sm text-slate-500">
          Your account is not linked to an approved institution.
        </p>
        <a href="/institution/apply" className="btn-primary mt-4">
          Apply for access
        </a>
      </div>
    );
  }

  const supabase = createClient();
  const institutionId = session.profile.institution_id;

  let query = supabase
    .from('reports')
    .select('*')
    .eq('assigned_institution_id', institutionId)
    .order('created_at', { ascending: false });

  if (searchParams.status) query = query.eq('status', searchParams.status);

  const [{ data: reports }, { data: institution }] = await Promise.all([
    query,
    supabase
      .from('institutions')
      .select('*')
      .eq('id', institutionId)
      .maybeSingle(),
  ]);

  const inst = institution as Institution | null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{inst?.name ?? 'Institution'} dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Showing reports assigned to your institution only.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <DashboardReports
          reports={(reports as Report[]) ?? []}
          activeStatus={searchParams.status ?? null}
        />
        <AiChat />
      </div>
    </div>
  );
}
