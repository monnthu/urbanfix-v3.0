-- Fix report-images storage RLS so authenticated users can upload.
-- Run this in Supabase SQL Editor if uploads fail with RLS errors.

insert into storage.buckets (id, name, public)
values ('report-images', 'report-images', true)
on conflict (id) do nothing;

-- Drop old policies if they exist (from 0001_init or manual setup).
drop policy if exists "report images public read" on storage.objects;
drop policy if exists "report images authenticated upload" on storage.objects;
drop policy if exists "report images auth insert" on storage.objects;
drop policy if exists "report images auth update" on storage.objects;

-- Allow anyone to read images (public bucket).
create policy "report images public read"
  on storage.objects for select
  using (bucket_id = 'report-images');

-- Authenticated users can upload to their own folder: {user_id}/...
create policy "report images auth insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'report-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Required if upload uses upsert or overwrites an existing object.
create policy "report images auth update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'report-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Let clients resolve the bucket metadata.
drop policy if exists "report images bucket read" on storage.buckets;
create policy "report images bucket read"
  on storage.buckets for select
  using (id = 'report-images');
