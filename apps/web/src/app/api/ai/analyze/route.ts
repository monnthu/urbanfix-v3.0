import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeReportImage } from '@/lib/gemini';
import type { Category, Report } from '@/lib/types';

/**
 * Re-run AI image analysis for an existing report. Callable by the report
 * owner, the assigned institution, or an admin. Useful when the first attempt
 * failed (e.g. quota) or the image was added later.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'AI is not configured (missing GEMINI_API_KEY).' },
      { status: 503 },
    );
  }

  const { report_id } = await request.json();
  if (!report_id) {
    return NextResponse.json({ error: 'report_id is required' }, { status: 400 });
  }

  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('id', report_id)
    .maybeSingle();

  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }
  const r = report as Report;
  if (!r.image_url) {
    return NextResponse.json({ error: 'Report has no image' }, { status: 400 });
  }

  try {
    const { data: categories } = await supabase.from('categories').select('id');
    const categoryIds = ((categories as Pick<Category, 'id'>[]) ?? []).map(
      (c) => c.id,
    );

    const imgRes = await fetch(r.image_url);
    const buf = Buffer.from(await imgRes.arrayBuffer());
    const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';

    const analysis = await analyzeReportImage(
      buf.toString('base64'),
      mimeType,
      categoryIds,
    );

    const { error } = await supabase
      .from('reports')
      .update({
        ai_category_suggestion: analysis.category,
        ai_priority_suggestion: analysis.priority,
        ai_confidence: analysis.confidence,
        ai_reason: analysis.reason,
        ai_status: 'completed',
      })
      .eq('id', r.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true, analysis });
  } catch (err) {
    await supabase.from('reports').update({ ai_status: 'failed' }).eq('id', r.id);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Analysis failed' },
      { status: 500 },
    );
  }
}
