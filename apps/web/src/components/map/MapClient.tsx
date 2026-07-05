'use client';

import dynamic from 'next/dynamic';
import type { Report } from '@/lib/types';

// Leaflet touches `window`, so load the map only on the client.
const ReportsMap = dynamic(() => import('./ReportsMap'), {
  ssr: false,
  loading: () => (
    <div className="grid h-[70vh] place-items-center rounded-xl border border-slate-200 bg-slate-100 text-sm text-slate-400">
      Loading map…
    </div>
  ),
});

export function MapClient(props: {
  reports: Report[];
  center?: [number, number];
  zoom?: number;
  height?: string;
}) {
  return <ReportsMap {...props} />;
}
