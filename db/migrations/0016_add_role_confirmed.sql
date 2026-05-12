-- Add role_confirmed flag to users table.
-- Set to true once a user completes role selection at /onboarding/role-select.
-- Used by middleware to redirect new users through the onboarding flow.

alter table public.users
  add column if not exists role_confirmed boolean not null default false;

comment on column public.users.role_confirmed is
  'True once the user has explicitly chosen customer or cleaner at /onboarding/role-select.';
