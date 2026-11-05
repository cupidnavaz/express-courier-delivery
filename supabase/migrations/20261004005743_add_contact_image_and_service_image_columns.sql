/*
# Add contact image and service image columns

1. Changes to site_settings table
   - Add `contact_image_url` (text, nullable) — stores an optional image for the contact section of the homepage.
2. Notes
   - The `services_json` column is a JSON array that already stores service items. Each service item will now optionally include an `image_url` field — no schema change needed since it's JSON.
   - No new tables. No security changes (existing policies on site_settings already cover reads/writes).
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'contact_image_url') THEN
    ALTER TABLE site_settings ADD COLUMN contact_image_url text;
  END IF;
END $$;
