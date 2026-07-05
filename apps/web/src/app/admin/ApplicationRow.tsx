'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Application = {
  id: string;
  institution_name: string;
  official_email: string;
  category_coverage: string[];
  zone_coverage: string[];
  status: string;
  admin_notes: string | null;
};

export function ApplicationRow({
  app,
  readOnly = false,
}: {
  app: Application;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(action: 'approve' | 'reject') {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/applications/${app.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? 'Failed');
      setBusy(false);
      return;
    }
    router.refresh();
  }

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{app.institution_name}</h3>
            <StatusBadge status={app.status} />
          </div>
          <p className="text-sm text-slate-500">{app.official_email}</p>
          <p className="mt-2 text-xs text-slate-400">
            Categories: {app.category_coverage.join(', ') || '—'} · Zones:{' '}
            {app.zone_coverage.join(', ') || '—'}
          </p>
        </div>

        {!readOnly && (
          <div className="flex gap-2">
            <button
              onClick={() => act('approve')}
              disabled={busy}
              className="btn-primary"
            >
              Approve
            </button>
            <button
              onClick={() => act('reject')}
              disabled={busy}
              className="btn-secondary"
            >
              Reject
            </button>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`badge ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}
