-- Public media bucket for banners, platform icons and testimonial avatars (NPI-1234).
-- Anyone can read; only admins can upload, replace or delete. Max 5 MB, images only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('public-media', 'public-media', true, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/svg+xml'])
on conflict (id) do nothing;

create policy "admins upload media" on storage.objects for insert to authenticated
  with check (bucket_id = 'public-media' and public.is_admin());
create policy "admins update media" on storage.objects for update to authenticated
  using (bucket_id = 'public-media' and public.is_admin());
create policy "admins delete media" on storage.objects for delete to authenticated
  using (bucket_id = 'public-media' and public.is_admin());
