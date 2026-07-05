import { createClient } from '@/lib/supabase/server';
import { MapClient } from '@/components/map/MapClient';
import { Legend } from '@/components/map/Legend';
import type { Category, Report } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function MapPage() {
  const supabase = createClient();
  const [{ data: reports }, { data: categories }] = await Promise.all([
    supabase.from('reports').select('*').order('created_at', { ascending: false }),
    supabase.from('categories').select('*').order('label'),
  ]);

  const list = (reports as Report[]) ?? [];
  const center =
    list.length > 0
      ? ([list[0].latitude, list[0].longitude] as [number, number])
      : undefined;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Report map</h1>
      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        <MapClient reports={list} center={center} />
        <Legend categories={(categories as Category[]) ?? []} />
      </div>
    </div>
  );
}
