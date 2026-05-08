'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

type Factor = {
  id: string;
  factor_type: string;
  friendly_name?: string;
  status: 'verified' | 'unverified';
};

type EnrollState =
  | { step: 'idle' }
  | { step: 'scanning'; factorId: string; qrCode: string; secret: string }
  | { step: 'verifying'; factorId: string }
  | { step: 'done' };

export function MFASetup({ initialFactors }: { initialFactors: Factor[] }) {
  const supabase = createSupabaseBrowserClient();
  const [factors, setFactors] = useState<Factor[]>(initialFactors);
  const [enroll, setEnroll] = useState<EnrollState>({ step: 'idle' });
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const verifiedFactors = factors.filter((f) => f.status === 'verified');
  const hasTotp = verifiedFactors.some((f) => f.factor_type === 'totp');

  const refreshFactors = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors((data?.all ?? []) as Factor[]);
  };

  useEffect(() => {
    refreshFactors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startEnrollment = async () => {
    setError(null);
    setLoading(true);
    const { data, error: err } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Authenticator app',
    });
    setLoading(false);
    if (err || !data) {
      setError(err?.message ?? 'Failed to start enrollment.');
      return;
    }
    setEnroll({
      step: 'scanning',
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    });
  };

  const verifyCode = async () => {
    if (enroll.step !== 'scanning') return;
    setError(null);
    setLoading(true);
    const challengeRes = await supabase.auth.mfa.challenge({ factorId: enroll.factorId });
    if (challengeRes.error) {
      setError(challengeRes.error.message);
      setLoading(false);
      return;
    }
    const verifyRes = await supabase.auth.mfa.verify({
      factorId: enroll.factorId,
      challengeId: challengeRes.data.id,
      code: code.trim(),
    });
    setLoading(false);
    if (verifyRes.error) {
      setError('Invalid code. Check your authenticator app and try again.');
      return;
    }
    setEnroll({ step: 'done' });
    setCode('');
    await refreshFactors();
  };

  const unenroll = async (factorId: string) => {
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.mfa.unenroll({ factorId });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    await refreshFactors();
    setEnroll({ step: 'idle' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-zinc-900">Two-factor authentication</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Add an authenticator app to require a one-time code when signing in.
        </p>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      {hasTotp ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-800">2FA is enabled</p>
              <p className="mt-0.5 text-xs text-emerald-600">
                Your account is protected by an authenticator app.
              </p>
            </div>
            <button
              onClick={() => {
                const factor = verifiedFactors.find((f) => f.factor_type === 'totp');
                if (factor) unenroll(factor.id);
              }}
              disabled={loading}
              className="ml-4 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        </div>
      ) : enroll.step === 'idle' || enroll.step === 'done' ? (
        <div className="rounded-xl border border-zinc-100 bg-white p-5">
          <p className="text-sm text-zinc-600">
            {enroll.step === 'done'
              ? '2FA successfully set up!'
              : '2FA is not enabled on your account.'}
          </p>
          <button
            onClick={startEnrollment}
            disabled={loading}
            className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? 'Starting…' : 'Set up authenticator app'}
          </button>
        </div>
      ) : enroll.step === 'scanning' ? (
        <div className="rounded-xl border border-zinc-100 bg-white p-5">
          <p className="mb-4 text-sm font-medium text-zinc-800">
            Scan this QR code with your authenticator app
          </p>
          <div className="mb-4 flex justify-center">
            <Image src={enroll.qrCode} alt="TOTP QR code" width={180} height={180} unoptimized />
          </div>
          <p className="mb-1 text-xs text-zinc-400">Or enter the secret manually:</p>
          <p className="mb-5 break-all rounded-md bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-700">
            {enroll.secret}
          </p>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            Enter the 6-digit code from your app
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-32 rounded-lg border border-zinc-200 px-3 py-2 text-center font-mono text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            <button
              onClick={verifyCode}
              disabled={loading || code.length < 6}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {loading ? 'Verifying…' : 'Verify'}
            </button>
            <button
              onClick={() => setEnroll({ step: 'idle' })}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
