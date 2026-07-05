import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionProfile } from '@/lib/auth';
import { MfaEnroll } from '@/components/MfaEnroll';

export default async function AccountPage() {
  const session = await getSessionProfile();
  if (!session) redirect('/login');

  const { profile, email } = session;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Your account</h1>

      <div className="card space-y-2 p-6">
        <Row label="Email" value={email ?? '—'} />
        <Row label="Name" value={profile?.display_name ?? '—'} />
        <Row label="Role" value={profile?.role ?? 'civilian'} />
        <Row
          label="Verified"
          value={profile?.civilian_verified ? 'Yes (TOTP enabled)' : 'No'}
        />
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold">Two-factor authentication</h2>
        <p className="mt-1 text-sm text-slate-500">
          Required to verify civilian accounts. Uses a free TOTP authenticator
          app — no SMS.
        </p>
        <div className="mt-4">
          <MfaEnroll />
        </div>
      </div>

      {profile?.role === 'civilian' && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold">Represent an institution?</h2>
          <p className="mt-1 text-sm text-slate-500">
            Apply with your official government email to access an institution
            dashboard after admin approval.
          </p>
          <Link href="/institution/apply" className="btn-secondary mt-4">
            Apply for institution access
          </Link>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-2 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium capitalize">{value}</span>
    </div>
  );
}
