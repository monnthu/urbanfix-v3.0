import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { NewReportForm } from './NewReportForm';
import type { Category } from '@/lib/types';

export default async function NewReportPage() {
  const session = await getSessionProfile();
  if (!session) redirect('/login?next=/reports/new');

  const supabase = createClient();
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('label');

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Report an issue</h1>
        <p className="mt-1 text-sm text-slate-500">
          Add a photo and drop a pin. We&apos;ll route it to the responsible
          institution and run AI triage on the image.
        </p>
      </div>
      <NewReportForm categories={(categories as Category[]) ?? []} />
    </div>
  );
}
