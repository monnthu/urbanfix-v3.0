'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Factor = { id: string; status: string };

export function MfaEnroll() {
  const router = useRouter();
  const supabase = createClient();

  const [factors, setFactors] = useState<Factor[]>([]);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verified = factors.some((f) => f.status === 'verified');

  async function loadFactors() {
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors(
      (data?.all ?? []).map((f) => ({ id: f.id, status: f.status })),
    );
  }

  useEffect(() => {
    loadFactors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startEnroll() {
    setBusy(true);
    setError(null);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
    });
    if (error) {
      setError(error.message);
    } else if (data) {
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
    }
    setBusy(false);
  }

  async function verify() {
    if (!factorId) return;
    setBusy(true);
    setError(null);

    const challenge = await supabase.auth.mfa.challenge({ factorId });
    if (challenge.error) {
      setError(challenge.error.message);
      setBusy(false);
      return;
    }

    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.data.id,
      code,
    });

    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }

    // Mark the profile as civilian-verified.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ civilian_verified: true })
        .eq('id', user.id);
    }

    setQr(null);
    setSecret(null);
    await loadFactors();
    router.refresh();
    setBusy(false);
  }

  if (verified) {
    return (
      <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
        Two-factor authentication is enabled. Your account is verified.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!qr ? (
        <button
          onClick={startEnroll}
          disabled={busy}
          className="btn-primary"
        >
          {busy ? 'Preparing…' : 'Set up authenticator app'}
        </button>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Scan this QR code with Google Authenticator, Authy, or 1Password,
            then enter the 6-digit code to finish.
          </p>
          {/* Supabase returns the QR as an SVG data URL */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qr}
            alt="TOTP QR code"
            className="h-44 w-44 rounded-lg border border-slate-200 bg-white p-2"
          />
          {secret && (
            <p className="text-xs text-slate-400">
              Or enter this key manually:{' '}
              <code className="rounded bg-slate-100 px-1">{secret}</code>
            </p>
          )}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="label">6-digit code</label>
              <input
                className="input tracking-widest"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
              />
            </div>
            <button
              onClick={verify}
              disabled={busy || code.length !== 6}
              className="btn-primary"
            >
              Verify
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
