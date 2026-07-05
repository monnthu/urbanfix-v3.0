import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionProfile } from '@/lib/auth';
import { SupportButton } from '@/components/SupportButton';
import { MapClient } from '@/components/map/MapClient';
import {
  PRIORITY_STYLES,
  STATUS_STYLES,
  STATUS_LABELS,
} from '@/lib/constants';
import type { Report } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ReportDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const session = await getSessionProfile();

  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (!report) notFound();
  const r = report as Report;

  const [{ data: category }, { data: institution }, supportRow] =
    await Promise.all([
      supabase.from('categories').select('label').eq('id', r.category).maybeSingle(),
      r.assigned_institution_id
        ? supabase
            .from('institutions')
            .select('name')
            .eq('id', r.assigned_institution_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      session
        ? supabase
            .from('report_supports')
            .select('report_id')
            .eq('report_id', r.id)
            .eq('civilian_user_id', session.userId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{r.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`badge ${STATUS_STYLES[r.status]}`}>
              {STATUS_LABELS[r.status]}
            </span>
            <span className={`badge ${PRIORITY_STYLES[r.priority]}`}>
              {r.priority} priority
            </span>
            <span className="badge bg-slate-100 text-slate-700">
              {category?.label ?? r.category}
            </span>
          </div>
        </div>
        <SupportButton
          reportId={r.id}
          initialSupported={!!supportRow?.data}
          initialCount={r.support_count}
          signedIn={!!session}
        />
      </div>

      {r.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={r.image_url}
          alt=""
          className="max-h-96 w-full rounded-xl border border-slate-200 object-cover"
        />
      )}

      <div className="card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Description
        </h2>
        <p className="mt-2 whitespace-pre-wrap text-slate-700">
          {r.description || 'No description provided.'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Info label="Assigned to" value={institution?.name ?? 'Unassigned'} />
        <Info label="Zone" value={r.zone_id ?? 'Outside known zones'} />
        <Info label="Location" value={r.address_text ?? `${r.latitude.toFixed(5)}, ${r.longitude.toFixed(5)}`} />
        <Info label="Filed" value={new Date(r.created_at).toLocaleString()} />
      </div>

      {r.ai_status === 'completed' && (
        <div className="card border-brand-200 bg-brand-50/50 p-5">
          <h2 className="text-sm font-semibold text-brand-800">
            AI triage suggestion
          </h2>
          <p className="mt-2 text-sm text-slate-700">
            Suggested category:{' '}
            <strong>{r.ai_category_suggestion ?? '—'}</strong> · priority:{' '}
            <strong>{r.ai_priority_suggestion ?? '—'}</strong>
            {r.ai_confidence != null && (
              <> · confidence {Math.round(r.ai_confidence * 100)}%</>
            )}
          </p>
          {r.ai_reason && (
            <p className="mt-1 text-sm text-slate-500">{r.ai_reason}</p>
          )}
        </div>
      )}

      <MapClient
        reports={[r]}
        center={[r.latitude, r.longitude]}
        zoom={15}
        height="320px"
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-medium text-slate-700">{value}</p>
    </div>
  );
}
