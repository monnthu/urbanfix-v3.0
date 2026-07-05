import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { ApplyForm } from './ApplyForm';
import type { Category, Zone } from '@/lib/types';

export default async function InstitutionApplyPage() {
  const session = await getSessionProfile();
  if (!session) redirect('/login?next=/institution/apply');

  const supabase = createClient();
  const [{ data: categories }, { data: zones }, { data: existing }] =
    await Promise.all([
      supabase.from('categories').select('*').order('label'),
      supabase.from('zones').select('*').order('label'),
      supabase
        .from('institution_applications')
        .select('id, status, institution_name')
        .eq('applicant_user_id', session.userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (session.profile?.role === 'institution') {
    return (
      <Notice
        title="You already have institution access"
        body="Head to your dashboard to view assigned reports."
      />
    );
  }

  if (existing) {
    return (
      <Notice
        title={`Application ${existing.status}`}
        body={
          existing.status === 'pending'
            ? `Your application for "${existing.institution_name}" is awaiting admin approval.`
            : `Your last application for "${existing.institution_name}" was ${existing.status}.`
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Institution application</h1>
        <p className="mt-1 text-sm text-slate-500">
          Apply with your official government/institution email. An admin
          reviews and approves before you get dashboard access.
        </p>
      </div>
      <ApplyForm
        categories={(categories as Category[]) ?? []}
        zones={(zones as Zone[]) ?? []}
        defaultEmail={session.email ?? ''}
      />
    </div>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="card p-8 text-center">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{body}</p>
      </div>
    </div>
  );
}
