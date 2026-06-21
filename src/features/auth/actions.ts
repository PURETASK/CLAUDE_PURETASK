'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { notify } from '@/features/notifications/dispatch';
import { env } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';

import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from './validation';

export type AuthActionState = {
  ok: boolean;
  error: string | null;
  message?: string;
};

export const signInAction = async (
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> => {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid sign-in details.',
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  revalidatePath('/', 'layout');

  // Route by role so returning cleaners land on their dashboard, not the
  // customer home. Mirrors the gating in src/middleware.ts.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const meta = user?.user_metadata as { role?: string; role_confirmed?: boolean } | undefined;
  if (!meta?.role_confirmed) redirect('/onboarding/role-select');
  redirect(meta.role === 'cleaner' ? '/app/cleaner' : '/app');
};

export const signUpAction = async (
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> => {
  const parsed = signUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
    role: formData.get('role') ?? 'customer',
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid sign-up details.',
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=${encodeURIComponent(
        '/onboarding/role-select',
      )}`,
      data: {
        role: parsed.data.role,
      },
    },
  });

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  return {
    ok: true,
    error: null,
    message: 'Account created. Check your email to verify your account.',
  };
};

export const forgotPasswordAction = async (
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> => {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get('email'),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid email.',
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=${encodeURIComponent(
      '/auth/reset-password',
    )}`,
  });

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  return {
    ok: true,
    error: null,
    message: 'If an account exists, we sent a reset link.',
  };
};

export const resetPasswordAction = async (
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> => {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid password reset input.',
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  // Security notice — alert the user their password changed.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    void notify({
      recipientUserId: user.id,
      type: 'password_changed',
      title: 'Your password was changed',
      body: 'If you did not make this change, contact support immediately.',
    });
  }

  return {
    ok: true,
    error: null,
    message: 'Password reset complete. You can now sign in.',
  };
};

export const confirmRoleAction = async (formData: FormData): Promise<void> => {
  const role = formData.get('role');
  if (role !== 'customer' && role !== 'cleaner') return;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  await supabase.from('users').update({ primary_role: role }).eq('id', user.id);

  await supabase.auth.updateUser({ data: { role, role_confirmed: true } });

  revalidatePath('/', 'layout');
  redirect(role === 'cleaner' ? '/app/cleaner' : '/app');
};

export const signOutAction = async () => {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/auth/sign-in');
};
