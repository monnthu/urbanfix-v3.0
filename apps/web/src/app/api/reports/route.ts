import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveZone, resolveInstitution } from '@/lib/routing';
import { analyzeReportImage } from '@/lib/gemini';
import type { Category, Institution, Zone } from '@/lib/types';

const DEFAULT_CATEGORY_IDS = [
  'flooding',
  'pothole',
  'streetlight',
  'garbage',
  'graffiti',
  'water',
  'other',
];

async function runImageAnalysis(
  supabase: ReturnType<typeof createClient>,
  reportId: string,
  imageUrl: string,
) {
  try {
    const { data: report } = await supabase
      .from('reports')
      .select('latitude, longitude, zone_id')
      .eq('id', reportId)
      .single();

    const [{ data: categories }, { data: zones }, { data: institutions }] =
      await Promise.all([
        supabase.from('categories').select('id'),
        supabase.from('zones').select('*'),
        supabase.from('institutions').select('*'),
      ]);

    const categoryIds =
      ((categories as Pick<Category, 'id'>[]) ?? []).map((c) => c.id).length > 0
        ? ((categories as Pick<Category, 'id'>[]) ?? []).map((c) => c.id)
        : DEFAULT_CATEGORY_IDS;

    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error('Could not fetch uploaded image');
    const buf = Buffer.from(await imgRes.arrayBuffer());
    const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';

    const analysis = await analyzeReportImage(
      buf.toString('base64'),
      mimeType,
      categoryIds,
    );

    const zone =
      report?.zone_id != null
        ? ((zones as Zone[]) ?? []).find((z) => z.id === report.zone_id) ?? null
        : report
          ? resolveZone(report.latitude, report.longitude, (zones as Zone[]) ?? [])
          : null;

    const institutionId = resolveInstitution(
      analysis.category,
      zone?.id ?? report?.zone_id ?? null,
      (institutions as Institution[]) ?? [],
    );

    await supabase
      .from('reports')
      .update({
        category: analysis.category,
        ai_category_suggestion: analysis.category,
        ai_priority_suggestion: analysis.priority,
        ai_confidence: analysis.confidence,
        ai_reason: analysis.reason,
        ai_status: 'completed',
        priority: analysis.priority,
        assigned_institution_id: institutionId,
        status: institutionId ? 'assigned' : 'unassigned',
      })
      .eq('id', reportId);
  } catch {
    await supabase
      .from('reports')
      .update({ ai_status: 'failed' })
      .eq('id', reportId);
  }
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const {
    title,
    description = '',
    category: requestedCategory,
    address_text = null,
    latitude,
    longitude,
    image_url = null,
  } = body ?? {};

  if (!title || typeof latitude !== 'number' || typeof longitude !== 'number') {
    return NextResponse.json(
      { error: 'title, latitude and longitude are required' },
      { status: 400 },
    );
  }

  // With a photo, AI assigns the real category after submit. Without one, pick manually.
  const category =
    requestedCategory ?? (image_url ? 'other' : null);

  if (!category) {
    return NextResponse.json(
      { error: 'Choose a category, or attach a photo for AI detection.' },
      { status: 400 },
    );
  }

  const [{ data: zones }, { data: institutions }, { data: categoryRow }] =
    await Promise.all([
      supabase.from('zones').select('*'),
      supabase.from('institutions').select('*'),
      supabase.from('categories').select('id').eq('id', category).maybeSingle(),
    ]);

  if (!categoryRow) {
    return NextResponse.json(
      {
        error:
          'Unknown category. Run supabase/seed.sql in your Supabase project first.',
      },
      { status: 400 },
    );
  }

  const zone = resolveZone(latitude, longitude, (zones as Zone[]) ?? []);
  const institutionId = resolveInstitution(
    category,
    zone?.id ?? null,
    (institutions as Institution[]) ?? [],
  );

  const { data: report, error } = await supabase
    .from('reports')
    .insert({
      title,
      description,
      category,
      latitude,
      longitude,
      address_text,
      image_url,
      zone_id: zone?.id ?? null,
      civilian_user_id: user.id,
      assigned_institution_id: institutionId,
      status: institutionId ? 'assigned' : 'unassigned',
      ai_status: image_url ? 'pending' : 'completed',
    })
    .select('id')
    .single();

  if (error || !report) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to create report' },
      { status: 400 },
    );
  }

  // Return immediately — AI triage runs in the background so submit is not
  // blocked by Gemini latency or Vercel function timeouts.
  if (image_url && process.env.GEMINI_API_KEY) {
    void runImageAnalysis(supabase, report.id, image_url);
  }

  if (process.env.N8N_WEBHOOK_URL) {
    fetch(process.env.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'new_report',
        report_id: report.id,
        title,
        category,
        assigned_institution_id: institutionId,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ id: report.id });
}
