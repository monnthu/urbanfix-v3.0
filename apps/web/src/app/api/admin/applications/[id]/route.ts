import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Verify caller is an admin.
  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (me?.role !== 'admin') {
    return NextResponse.json({ error: 'Admins only' }, { status: 403 });
  }

  const { action } = await request.json();
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: app, error: appErr } = await admin
    .from('institution_applications')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (appErr || !app) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  if (action === 'reject') {
    await admin
      .from('institution_applications')
      .update({ status: 'rejected' })
      .eq('id', params.id);
    return NextResponse.json({ ok: true });
  }

  // Approve: create the institution, then grant the applicant the role + link.
  const { data: institution, error: instErr } = await admin
    .from('institutions')
    .insert({
      name: app.institution_name,
      official_email_domain: String(app.official_email).split('@')[1] ?? '',
      category_coverage: app.category_coverage,
      zone_coverage: app.zone_coverage,
      status: 'approved',
    })
    .select('id')
    .single();

  if (instErr || !institution) {
    return NextResponse.json(
      { error: instErr?.message ?? 'Failed to create institution' },
      { status: 400 },
    );
  }

  await admin
    .from('profiles')
    .update({ role: 'institution', institution_id: institution.id })
    .eq('id', app.applicant_user_id);

  await admin
    .from('institution_applications')
    .update({ status: 'approved' })
    .eq('id', params.id);

  return NextResponse.json({ ok: true, institution_id: institution.id });
}
