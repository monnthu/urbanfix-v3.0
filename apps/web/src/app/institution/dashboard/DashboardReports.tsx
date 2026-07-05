'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  PRIORITY_STYLES,
  STATUS_STYLES,
  STATUS_LABELS,
} from '@/lib/constants';
import type { Report, ReportStatus } from '@/lib/types';

const STATUS_OPTIONS: ReportStatus[] = [
  'assigned',
  'in_progress',
  'resolved',
  'rejected',
];

const FILTERS: { label: string; value: string | null }[] = [
  { label: 'All', value: null },
  { label: 'Assigned', value: 'assigned' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
];

export function DashboardReports({
  reports,
  activeStatus,
}: {
  reports: Report[];
  activeStatus: string | null;
}) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.label}
            href={f.value ? `?status=${f.value}` : '?'}
            className={`badge border px-3 py-1 ${
              (activeStatus ?? null) === f.value
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {reports.length === 0 ? (
        <div className="card p-10 text-center text-slate-500">
          No reports match this filter.
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <ReportRow key={r.id} report={r} onChanged={() => router.refresh()} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportRow({
  report,
  onChanged,
}: {
  report: Report;
  onChanged: () => void;
}) {
  const [status, setStatus] = useState<ReportStatus>(report.status);
  const [busy, setBusy] = useState(false);

  async function updateStatus(next: ReportStatus) {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('reports')
      .update({ status: next })
      .eq('id', report.id);
    if (!error) {
      setStatus(next);
      onChanged();
    }
    setBusy(false);
  }

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/reports/${report.id}`} className="font-semibold hover:underline">
            {report.title}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className={`badge ${STATUS_STYLES[status]}`}>
              {STATUS_LABELS[status]}
            </span>
            <span className={`badge ${PRIORITY_STYLES[report.priority]}`}>
              {report.priority}
            </span>
            <span className="badge bg-slate-100 capitalize text-slate-700">
              {report.category}
            </span>
            <span className="text-xs text-slate-400">
              {report.zone_id ?? 'no zone'} · {report.support_count} supports
            </span>
          </div>
        </div>

        <select
          className="input w-auto text-sm"
          value={status}
          disabled={busy}
          onChange={(e) => updateStatus(e.target.value as ReportStatus)}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
