import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { env } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Email confirmation / recovery callback.
 *
 * Supabase email links (signup confirmation, password recovery, magic link)
 * carry either a PKCE `code` or an OTP `token_hash`+`type`. That token MUST be
 * exchanged for a session on the server before the user is authenticated —
 * without this route, the verification link lands on a static page and the
 * session cookie is never set (so the user can never sign in, and password
 * reset's updateUser has no session to act on).
 *
 * The destination after a successful exchange is encoded by the caller via the
 * `next` query param (e.g. `/onboarding/role-select` for signup,
 * `/auth/reset-password` for recovery).
 */
export const GET = async (request: Request) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const next = url.searchParams.get('next') || '/app';

  const supabase = await createSupabaseServerClient();

  let exchangeError: string | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    exchangeError = error?.message ?? null;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    exchangeError = error?.message ?? null;
  } else {
    exchangeError = 'Missing verification token.';
  }

  if (exchangeError) {
    const failUrl = new URL('/auth/sign-in', env.NEXT_PUBLIC_SITE_URL);
    failUrl.searchParams.set('error', 'verification_failed');
    return NextResponse.redirect(failUrl);
  }

  // Only allow same-origin relative redirects.
  const safeNext = next.startsWith('/') ? next : '/app';
  return NextResponse.redirect(new URL(safeNext, env.NEXT_PUBLIC_SITE_URL));
};
