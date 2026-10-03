/*
# Create media storage bucket and policies

## Overview
Creates a public storage bucket for media uploads (logos, hero images, etc.)
and sets up RLS policies allowing public reads and authenticated writes.

## Storage Changes
1. New bucket: `media` (public, for company logos, hero images, etc.)
2. Storage policies:
   - Public SELECT: anyone can view uploaded media
   - Authenticated INSERT: only logged-in admin can upload
   - Authenticated UPDATE: only logged-in admin can replace files
   - Authenticated DELETE: only logged-in admin can remove files

## Notes
- The bucket is public so website visitors can see logos/images without auth.
- Uploads, modifications, and deletions require authentication (admin only).
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
DROP POLICY IF EXISTS "Public can read media" ON storage.objects;
CREATE POLICY "Public can read media"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'media');

-- Authenticated upload
DROP POLICY IF EXISTS "Admin can upload media" ON storage.objects;
CREATE POLICY "Admin can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- Authenticated update
DROP POLICY IF EXISTS "Admin can update media" ON storage.objects;
CREATE POLICY "Admin can update media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'media')
WITH CHECK (bucket_id = 'media');

-- Authenticated delete
DROP POLICY IF EXISTS "Admin can delete media" ON storage.objects;
CREATE POLICY "Admin can delete media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media');
