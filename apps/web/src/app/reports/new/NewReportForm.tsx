'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Category } from '@/lib/types';

const LocationPickerMap = dynamic(
  () => import('@/components/map/LocationPickerMap'),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-72 place-items-center rounded-xl border border-slate-200 bg-slate-100 text-sm text-slate-400">
        Loading map…
      </div>
    ),
  },
);

export function NewReportForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const supabase = createClient();
  const categoryOptions =
    categories.length > 0 ? categories : [{ id: 'other', label: 'Other', icon: 'pin' }];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categoryOptions[0].id);
  const [address, setAddress] = useState('');
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      setError('Geolocation is not available in this browser.');
      return;
    }
    setError(null);
    setStatus('Getting your location…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus(null);
      },
      () => {
        setStatus(null);
        setError('Could not get your location. Drop a pin instead.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }

  // Center the map on the user's location as soon as the form loads.
  useEffect(() => {
    requestLocation();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!loc) {
      setError('Please set a location (drop a pin or use your location).');
      return;
    }
    setBusy(true);

    try {
      let imageUrl: string | null = null;

      if (file) {
        setStatus('Uploading image…');
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `${user?.id ?? 'anon'}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('report-images')
          .upload(path, file, {
            upsert: false,
            contentType: file.type || 'image/jpeg',
          });
        if (upErr) throw new Error(`Image upload failed: ${upErr.message}`);
        const { data } = supabase.storage
          .from('report-images')
          .getPublicUrl(path);
        imageUrl = data.publicUrl;
      }

      setStatus('Filing report and routing…');
      const res = await fetch('/api/reports', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          address_text: address,
          latitude: loc.lat,
          longitude: loc.lng,
          image_url: imageUrl,
        }),
      });
      const text = await res.text();
      const json = text ? JSON.parse(text) : null;
      if (!res.ok) {
        throw new Error(
          json?.error ?? `Failed to create report (HTTP ${res.status})`,
        );
      }
      if (!json?.id) {
        throw new Error('Report was created but no report id was returned.');
      }

      router.push(`/reports/${json.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setBusy(false);
      setStatus(null);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-5 p-6">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div>
        <label className="label">Title</label>
        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Large pothole on Main St"
          required
        />
      </div>

      <div>
        <label className="label">Category</label>
        <select
          className="input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categoryOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          className="input min-h-[96px]"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the issue…"
        />
      </div>

      <div>
        <label className="label">Photo</label>
        <input
          type="file"
          accept="image/*"
          onChange={onFile}
          className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-700"
        />
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="preview"
            className="mt-3 h-40 rounded-lg object-cover"
          />
        )}
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="label mb-0">Location</label>
          <button
            type="button"
            onClick={requestLocation}
            className="btn-ghost text-xs"
          >
            Use my location
          </button>
        </div>
        <LocationPickerMap value={loc} onPick={(lat, lng) => setLoc({ lat, lng })} />
        <p className="mt-1 text-xs text-slate-400">
          {loc
            ? `Selected: ${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`
            : status === 'Getting your location…'
              ? status
              : 'Click the map to drop a pin.'}
        </p>
      </div>

      <div>
        <label className="label">Address (optional)</label>
        <input
          className="input"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="123 Main St"
        />
      </div>

      <button type="submit" disabled={busy || !title} className="btn-primary">
        {busy ? status ?? 'Submitting…' : 'Submit report'}
      </button>
    </form>
  );
}
