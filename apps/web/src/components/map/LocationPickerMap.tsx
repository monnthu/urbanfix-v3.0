'use client';

import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '@/lib/constants';

function ClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPickerMap({
  value,
  onPick,
}: {
  value: { lat: number; lng: number } | null;
  onPick: (lat: number, lng: number) => void;
}) {
  return (
    <div className="h-72 overflow-hidden rounded-xl border border-slate-200">
      <MapContainer
        center={value ? [value.lat, value.lng] : DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={onPick} />
        {value && (
          <CircleMarker
            center={[value.lat, value.lng]}
            radius={9}
            pathOptions={{
              color: '#ffffff',
              weight: 2,
              fillColor: '#1a57f5',
              fillOpacity: 0.9,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
