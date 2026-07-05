import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveZone, resolveInstitution } from '@/lib/routing';
import { analyzeReportImage } from '@/lib/gemini';
import type { Category, Institution, Zone } from '@/lib/types';

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

  if (!title || !category || typeof latitude !== 'number' || typeof longitude !== 'number') {
    return NextResponse.json(
      { error: 'title, category, latitude and longitude are required' },
      { status: 400 },
    );
  }

  // Load reference data for routing.
  const [{ data: zones }, { data: institutions }] = await Promise.all([
    supabase.from('zones').select('*'),
    supabase.from('institutions').select('*'),
  ]);

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
    .select('*')
    .single();

  if (error || !report) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to create report' },
      { status: 400 },
    );
  }

  // Best-effort AI image analysis (does not block the response longer than needed).
  if (image_url && process.env.GEMINI_API_KEY) {
    try {
      const { data: categories } = await supabase.from('categories').select('id');
      const categoryIds = ((categories as Pick<Category, 'id'>[]) ?? []).map(
        (c) => c.id,
      );

      const imgRes = await fetch(image_url);
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
          // Adopt the AI priority as the working priority for triage.
          priority: analysis.priority,
        })
        .eq('id', report.id);
    } catch {
      await supabase
        .from('reports')
        .update({ ai_status: 'failed' })
        .eq('id', report.id);
    }
  }

  // Optional n8n notification for high-priority items.
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
