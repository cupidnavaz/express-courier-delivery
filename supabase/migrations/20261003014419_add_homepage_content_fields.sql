/*
# Add homepage content columns to site_settings

## New Columns
1. hero_badge_text (text, default 'Fastest Delivery Network') — the badge in the hero section
2. about_features_json (jsonb) — array of strings for the checklist under About text
3. contact_info_text (text) — the descriptive text in the contact info card

## Security
No security changes — existing RLS policies cover all columns.
*/

DO $$ BEGIN
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_badge_text text DEFAULT 'Fastest Delivery Network';
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS about_features_json jsonb DEFAULT '["Real-time GPS tracking","Insured shipments","24/7 customer support","200+ countries covered"]'::jsonb;
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS contact_info_text text DEFAULT 'Fill out the form and our team will get back to you as soon as possible. Your message goes directly to our admin dashboard.';
END $$;
