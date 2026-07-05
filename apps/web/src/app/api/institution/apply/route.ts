import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Common consumer email providers are not valid institution domains.
const PUBLIC_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'icloud.com',
  'proton.me',
  'protonmail.com',
  'aol.com',
]);

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
    institution_name,
    official_email,
    category_coverage = [],
    zone_coverage = [],
  } = body ?? {};

  if (!institution_name || !official_email) {
    return NextResponse.json(
      { error: 'Institution name and official email are required' },
      { status: 400 },
    );
  }

  const domain = String(official_email).split('@')[1]?.toLowerCase();
  if (!domain) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }
  if (PUBLIC_DOMAINS.has(domain)) {
    return NextResponse.json(
      { error: 'Please use an official institution email, not a personal one.' },
      { status: 400 },
    );
  }

  const { error } = await supabase.from('institution_applications').insert({
    applicant_user_id: user.id,
    institution_name,
    official_email,
    category_coverage,
    zone_coverage,
    status: 'pending',
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Fire-and-forget notification (n8n) if configured.
  if (process.env.N8N_WEBHOOK_URL) {
    fetch(process.env.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'institution_application',
        institution_name,
        official_email,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
