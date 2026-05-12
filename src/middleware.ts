import { NextResponse, type NextRequest } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware';

const PROTECTED_PREFIXES = ['/app', '/settings', '/cleaner', '/applications', '/admin', '/onboarding'];
const AUTH_PREFIXES = [
  '/auth/sign-in',
  '/auth/sign-up',
  '/auth/forgot-password',
  '/auth/reset-password',
];
const CUSTOMER_ONLY_PREFIXES = [
  '/app/cleaners',
  '/app/bookings',
  '/app/recurring',
  '/app/favorites',
  '/app/waitlist',
  '/app/dashboard',
];
const CLEANER_ONLY_PREFIXES = ['/app/cleaner'];

export const middleware = async (request: NextRequest) => {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAuthRoute = AUTH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!user && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/auth/sign-in';
    redirectUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/app';
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isProtectedRoute) {
    const roleConfirmed = user.user_metadata?.role_confirmed === true;
    const primaryRole = user.user_metadata?.role as string | undefined;

    if (!roleConfirmed && !pathname.startsWith('/onboarding')) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/onboarding/role-select';
      return NextResponse.redirect(redirectUrl);
    }

    if (roleConfirmed && primaryRole === 'customer') {
      if (CLEANER_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/app';
        return NextResponse.redirect(redirectUrl);
      }
    }

    if (roleConfirmed && primaryRole === 'cleaner') {
      if (CUSTOMER_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/app/cleaner';
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return response;
};

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
