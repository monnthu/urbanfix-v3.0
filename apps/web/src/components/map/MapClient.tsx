'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '@/lib/constants';
import type { Report } from '@/lib/types';

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
  const [userCenter, setUserCenter] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCenter([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }, []);

  const center =
    userCenter ??
    props.center ??
    (props.reports.length > 0
      ? ([props.reports[0].latitude, props.reports[0].longitude] as [
          number,
          number,
        ])
      : DEFAULT_CENTER);

  const zoom = userCenter ? 14 : (props.zoom ?? DEFAULT_ZOOM);

  return <ReportsMap {...props} center={center} zoom={zoom} />;
}
