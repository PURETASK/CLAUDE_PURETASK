-- Phase 5: authenticated customers can join the waitlist with their own account email.

drop policy if exists waitlist_signups_insert_customer_self on public.waitlist_signups;
create policy waitlist_signups_insert_customer_self
on public.waitlist_signups
for insert
to authenticated
with check (
  trim(lower(email::text)) = trim(lower((
    select u.email::text from public.users u where u.id = auth.uid()
  )))
);
