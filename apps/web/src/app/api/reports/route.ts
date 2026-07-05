import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveZone, resolveInstitution } from '@/lib/routing';
import { analyzeReportImage } from '@/lib/gemini';
import type { Category, Institution, Zone } from '@/lib/types';

async function runImageAnalysis(
  supabase: ReturnType<typeof createClient>,
  reportId: string,
  imageUrl: string,
) {
  try {
    const { data: categories } = await supabase.from('categories').select('id');
    const categoryIds = ((categories as Pick<Category, 'id'>[]) ?? []).map(
      (c) => c.id,
    );

    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error('Could not fetch uploaded image');
    const buf = Buffer.from(await imgRes.arrayBuffer());
    const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';

    const analysis = await analyzeReportImage(
      buf.toString('base64'),
      mimeType,
      categoryIds,
    );

    await supabase
      .from('reports')
      .update({
        ai_category_suggestion: analysis.category,
        ai_priority_suggestion: analysis.priority,
        ai_confidence: analysis.confidence,
        ai_reason: analysis.reason,
        ai_status: 'completed',
        priority: analysis.priority,
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
    category,
    address_text = null,
    latitude,
    longitude,
    image_url = null,
  } = body ?? {};

  if (
    !title ||
    !category ||
    typeof latitude !== 'number' ||
    typeof longitude !== 'number'
  ) {
    return NextResponse.json(
      { error: 'title, category, latitude and longitude are required' },
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
