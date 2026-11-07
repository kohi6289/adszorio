-- Row Level Security (NPI-1234).
-- Public (anon) can only READ active catalogue/content. Orders, leads and data requests are inserted
-- by server code using the service role after validation, so anon has NO direct access to them.

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['platforms','categories','services','packages','currencies','orders','leads',
    'banners','testimonials','faqs','legal_pages','site_settings','data_requests','admin_users','audit_log']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy admin_all on public.%I for all to authenticated
                    using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- audit_log is append-only even for admins
drop policy admin_all on public.audit_log;
create policy admin_read  on public.audit_log for select to authenticated using (public.is_admin());
create policy admin_write on public.audit_log for insert to authenticated with check (public.is_admin());

-- public read policies
create policy public_read on public.platforms    for select to anon, authenticated using (is_active);
create policy public_read on public.categories   for select to anon, authenticated
  using (exists (select 1 from public.platforms p where p.id = platform_id and p.is_active));
create policy public_read on public.services     for select to anon, authenticated using (is_active);
create policy public_read on public.packages     for select to anon, authenticated using (is_active);
create policy public_read on public.currencies   for select to anon, authenticated using (is_active);
create policy public_read on public.testimonials for select to anon, authenticated using (is_active);
create policy public_read on public.faqs         for select to anon, authenticated using (is_active);
create policy public_read on public.legal_pages  for select to anon, authenticated using (published_at is not null);
create policy public_read on public.site_settings for select to anon, authenticated using (true);
create policy public_read on public.banners      for select to anon, authenticated
  using (is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));

-- the private column of site_settings is only readable via the service role (server code)
revoke select on public.site_settings from anon, authenticated;
grant select (id, data, updated_at) on public.site_settings to anon, authenticated;

-- orders, leads, data_requests, admin_users: no anon policy => no anon access.
