'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function SupportButton({
  reportId,
  initialSupported,
  initialCount,
  signedIn,
}: {
  reportId: string;
  initialSupported: boolean;
  initialCount: number;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [supported, setSupported] = useState(initialSupported);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    if (!signedIn) {
      router.push(`/login?next=/reports/${reportId}`);
      return;
    }
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    if (supported) {
      const { error } = await supabase
        .from('report_supports')
        .delete()
        .eq('report_id', reportId)
        .eq('civilian_user_id', user.id);
      if (error) setError(error.message);
      else {
        setSupported(false);
        setCount((c) => Math.max(0, c - 1));
      }
    } else {
      const { error } = await supabase
        .from('report_supports')
        .insert({ report_id: reportId, civilian_user_id: user.id });
      if (error) setError(error.message);
      else {
        setSupported(true);
        setCount((c) => c + 1);
      }
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={toggle}
        disabled={busy}
        className={supported ? 'btn-secondary' : 'btn-primary'}
      >
        {supported ? '✓ Supported' : 'Support / verify'} ({count})
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
