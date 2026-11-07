-- Private bucket for delivery-proof screenshots (chargeback evidence). Admin-only, served via signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('order-proofs', 'order-proofs', false, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

create policy "admins read proofs"   on storage.objects for select to authenticated using (bucket_id = 'order-proofs' and public.is_admin());
create policy "admins upload proofs" on storage.objects for insert to authenticated with check (bucket_id = 'order-proofs' and public.is_admin());
create policy "admins delete proofs" on storage.objects for delete to authenticated using (bucket_id = 'order-proofs' and public.is_admin());
