/*
# Add font, timezone, social, and homepage content columns to site_settings

## Overview
Adds new columns to support: editable font family (default Google Alice), timezone selection,
additional social connectors (WhatsApp, TikTok, YouTube), about section image, and editable
"why choose us" section content for the homepage.

## New Columns on site_settings
1. font_family (text, default 'Alice') — Google Font name for the whole site
2. timezone (text, default 'UTC') — IANA timezone for date/time display
3. whatsapp_url (text, default '') — WhatsApp social link
4. tiktok_url (text, default '') — TikTok social link
5. youtube_url (text, default '') — YouTube social link
6. about_image_url (text, nullable) — Image for the about section on homepage
7. about_badge_value (text, default '99.8%') — Badge value on about image
8. about_badge_label (text, default 'On-time Delivery') — Badge label on about image
9. why_choose_title (text, default 'Why Choose Us') — Section heading
10. why_choose_subtitle (text) — Section subtitle
11. why_choose_json (jsonb, default '[]') — Array of {icon, title, description} for the 3 cards
12. services_title (text, default 'Our Services') — Services section heading
13. services_subtitle (text) — Services section subtitle
14. contact_title (text, default 'Ready to Ship?') — Contact section heading
15. contact_subtitle (text) — Contact section subtitle

## Security
No security changes — existing RLS policies on site_settings cover all columns.
*/

DO $$ BEGIN
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS font_family text DEFAULT 'Alice';
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC';
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS whatsapp_url text DEFAULT '';
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS tiktok_url text DEFAULT '';
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS youtube_url text DEFAULT '';
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS about_image_url text;
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS about_badge_value text DEFAULT '99.8%';
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS about_badge_label text DEFAULT 'On-time Delivery';
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS why_choose_title text DEFAULT 'Why Choose Us';
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS why_choose_subtitle text DEFAULT 'We deliver more than packages — we deliver reliability, speed, and peace of mind.';
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS why_choose_json jsonb DEFAULT '[{"icon":"Clock","title":"Lightning Fast","description":"Express delivery options with same-day and next-day service in major cities."},{"icon":"Shield","title":"Secure & Insured","description":"Every shipment is insured and handled with tamper-proof packaging."},{"icon":"Star","title":"Trusted by Thousands","description":"Over 500,000 successful deliveries with a 99.8% on-time rate."}]'::jsonb;
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS services_title text DEFAULT 'Our Services';
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS services_subtitle text DEFAULT 'Comprehensive courier and logistics solutions designed to meet all your delivery needs, from local parcels to international freight.';
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS contact_title text DEFAULT 'Ready to Ship?';
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS contact_subtitle text DEFAULT 'Get in touch with our team to schedule a pickup, ask a question, or learn more about our delivery services.';
END $$;
