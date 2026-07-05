import Link from 'next/link';
import { getSessionProfile } from '@/lib/auth';
import { SignOutButton } from './SignOutButton';

export async function Navbar() {
  const session = await getSessionProfile();
  const role = session?.profile?.role;

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            U
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Urbanfix
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link href="/reports" className="btn-ghost">
            Reports
          </Link>
          <Link href="/map" className="btn-ghost">
            Map
          </Link>
          {session && (
            <Link href="/reports/new" className="btn-ghost">
              Report an issue
            </Link>
          )}
          {role === 'institution' && (
            <Link href="/institution/dashboard" className="btn-ghost">
              Dashboard
            </Link>
          )}
          {role === 'admin' && (
            <Link href="/admin" className="btn-ghost">
              Admin
            </Link>
          )}

          {session ? (
            <div className="ml-2 flex items-center gap-2">
              <Link
                href="/account"
                className="hidden text-slate-500 hover:text-slate-800 sm:inline"
                title={session.email ?? undefined}
              >
                {session.profile?.display_name ?? session.email}
              </Link>
              <SignOutButton />
            </div>
          ) : (
            <Link href="/login" className="btn-primary ml-2">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
