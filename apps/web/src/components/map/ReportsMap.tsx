'use client';

import Link from 'next/link';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { categoryColor, DEFAULT_CENTER, DEFAULT_ZOOM } from '@/lib/constants';
import type { Report } from '@/lib/types';

export default function ReportsMap({
  reports,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  height = '70vh',
}: {
  reports: Report[];
  center?: [number, number];
  zoom?: number;
  height?: string;
}) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-slate-200"
      style={{ height }}
    >
      <MapContainer center={center} zoom={zoom} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {reports.map((r) => (
          <CircleMarker
            key={r.id}
            center={[r.latitude, r.longitude]}
            radius={8}
            pathOptions={{
              color: '#ffffff',
              weight: 2,
              fillColor: categoryColor(r.category),
              fillOpacity: 0.9,
            }}
          >
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold">{r.title}</p>
                <p className="text-xs capitalize text-slate-500">
                  {r.category} · {r.priority} · {r.status}
                </p>
                <Link
                  href={`/reports/${r.id}`}
                  className="text-xs text-brand-600 underline"
                >
                  View report
                </Link>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
