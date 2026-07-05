import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { answerInstitutionQuestion } from '@/lib/gemini';
import type { Report } from '@/lib/types';

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Must be an institution user with a linked institution.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, institution_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'institution' || !profile.institution_id) {
    return NextResponse.json({ error: 'Institution access required' }, { status: 403 });
  }

  const { question } = await request.json();
  if (!question || typeof question !== 'string') {
    return NextResponse.json({ error: 'A question is required' }, { status: 400 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'AI is not configured (missing GEMINI_API_KEY).' },
      { status: 503 },
    );
  }

  // Always scope by assigned institution BEFORE the AI sees anything.
  const { data: reportsData } = await supabase
    .from('reports')
    .select('*')
    .eq('assigned_institution_id', profile.institution_id)
    .order('created_at', { ascending: false })
    .limit(200);

  let reports = (reportsData as Report[]) ?? [];

  // Lightweight in-code filters to keep the prompt focused.
  const q = question.toLowerCase();
  if (/\bhigh\b|urgent|critical/.test(q)) {
    reports = reports.filter((r) => r.priority === 'high' || r.priority === 'critical');
  }
  if (/\bopen\b|unresolved|pending/.test(q)) {
    reports = reports.filter((r) => r.status !== 'resolved' && r.status !== 'rejected');
  }
  if (/last week|past week|recent/.test(q)) {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    reports = reports.filter((r) => new Date(r.created_at).getTime() >= weekAgo);
  }

  try {
    const { answer, referencedReportIds } = await answerInstitutionQuestion(
      question,
      reports.slice(0, 60),
    );

    await supabase.from('ai_interactions').insert({
      institution_user_id: user.id,
      institution_id: profile.institution_id,
      question,
      answer,
      referenced_report_ids: referencedReportIds,
    });

    return NextResponse.json({ answer, referencedReportIds });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'AI request failed' },
      { status: 500 },
    );
  }
}
