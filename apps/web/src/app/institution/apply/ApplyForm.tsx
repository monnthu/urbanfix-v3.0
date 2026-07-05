'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Category, Zone } from '@/lib/types';

export function ApplyForm({
  categories,
  zones,
  defaultEmail,
}: {
  categories: Category[];
  zones: Zone[];
  defaultEmail: string;
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState(defaultEmail);
  const [cats, setCats] = useState<string[]>([]);
  const [zs, setZs] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(list: string[], set: (v: string[]) => void, id: string) {
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const res = await fetch('/api/institution/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        institution_name: name,
        official_email: email,
        category_coverage: cats,
        zone_coverage: zs,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? 'Something went wrong');
      setBusy(false);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card space-y-5 p-6">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div>
        <label className="label">Institution name</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="City Public Works"
          required
        />
      </div>

      <div>
        <label className="label">Official email</label>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@publicworks.gov"
          required
        />
        <p className="mt-1 text-xs text-slate-400">
          Must use an official government/institution domain.
        </p>
      </div>

      <fieldset>
        <legend className="label">Categories handled</legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Chip
              key={c.id}
              active={cats.includes(c.id)}
              onClick={() => toggle(cats, setCats, c.id)}
              label={c.label}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">Zones covered</legend>
        <div className="flex flex-wrap gap-2">
          {zones.map((z) => (
            <Chip
              key={z.id}
              active={zs.includes(z.id)}
              onClick={() => toggle(zs, setZs, z.id)}
              label={z.label}
            />
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={busy || !name || !email || cats.length === 0}
        className="btn-primary"
      >
        {busy ? 'Submitting…' : 'Submit application'}
      </button>
    </form>
  );
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`badge border px-3 py-1 ${
        active
          ? 'border-brand-500 bg-brand-50 text-brand-700'
          : 'border-slate-300 bg-white text-slate-600'
      }`}
    >
      {label}
    </button>
  );
}
