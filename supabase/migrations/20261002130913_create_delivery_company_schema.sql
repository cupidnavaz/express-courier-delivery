/*
# Express Courier Services - Full Schema

## Overview
Complete schema for a delivery company website with admin dashboard, invoice management, and package tracking.

## New Tables

1. `site_settings` - Single-row table storing company-wide configuration:
   - company_name, logo_url, tagline, phone, email, address
   - about_text, facebook_url, twitter_url, instagram_url, linkedin_url
   - primary_color, secondary_color, accent_color
   - hero_title, hero_subtitle, hero_image_url
   - services_json (array of service cards)
   - stats_json (array of stat counters)
   - footer_text

2. `nav_links` - Navbar navigation links:
   - label, url, link_order, is_active, is_external

3. `footer_links` - Footer navigation links grouped by column:
   - label, url, link_order, column_name, is_external

4. `pages` - Dynamic website pages:
   - title, slug (unique), content (HTML), is_published, meta_description, page_order

5. `invoices` - Delivery invoices with full sender/receiver/package details:
   - tracking_code (unique, auto-generated pattern)
   - sender_name, sender_phone, sender_email, sender_address
   - receiver_name, receiver_phone, receiver_email, receiver_address
   - package_description, package_weight, package_type, package_dimensions
   - shipping_method, total_cost, currency
   - status (enum: processing, dispatched, in_transit, on_hold, delivered)
   - estimated_delivery_date, notes
   - qr_code_data (the tracking code encoded)

6. `invoice_status_history` - Timeline of status changes per invoice:
   - invoice_id (FK to invoices)
   - status, notes, location, timestamp

## Security (RLS)
- All tables: public SELECT for anon+authenticated (website content and tracking are public)
- All tables: INSERT/UPDATE/DELETE restricted to authenticated (admin only)
- This is a single-admin-app pattern where public visitors read content and track packages,
  while the authenticated admin manages everything.
*/

-- Enable pgcrypto for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================
-- site_settings
-- =====================
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT 'Express Courier Services',
  logo_url text,
  tagline text NOT NULL DEFAULT 'Fast. Reliable. Worldwide.',
  phone text NOT NULL DEFAULT '+1 (800) 555-0100',
  email text NOT NULL DEFAULT 'info@expresscourier.com',
  address text NOT NULL DEFAULT '123 Logistics Avenue, New York, NY 10001',
  about_text text,
  facebook_url text DEFAULT '',
  twitter_url text DEFAULT '',
  instagram_url text DEFAULT '',
  linkedin_url text DEFAULT '',
  primary_color text DEFAULT '#0ea5e9',
  secondary_color text DEFAULT '#0f172a',
  accent_color text DEFAULT '#f59e0b',
  hero_title text DEFAULT 'Delivering Trust, Every Package, Every Time',
  hero_subtitle text DEFAULT 'Your trusted partner for fast, secure, and reliable courier services across the globe.',
  hero_image_url text,
  services_json jsonb DEFAULT '[]'::jsonb,
  stats_json jsonb DEFAULT '[]'::jsonb,
  footer_text text DEFAULT '© 2024 Express Courier Services. All rights reserved.',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_site_settings" ON site_settings;
CREATE POLICY "public_read_site_settings" ON site_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_site_settings" ON site_settings;
CREATE POLICY "admin_insert_site_settings" ON site_settings FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_site_settings" ON site_settings;
CREATE POLICY "admin_update_site_settings" ON site_settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_site_settings" ON site_settings;
CREATE POLICY "admin_delete_site_settings" ON site_settings FOR DELETE
  TO authenticated USING (true);

-- =====================
-- nav_links
-- =====================
CREATE TABLE IF NOT EXISTS nav_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  url text NOT NULL,
  link_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_external boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE nav_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_nav_links" ON nav_links;
CREATE POLICY "public_read_nav_links" ON nav_links FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_nav_links" ON nav_links;
CREATE POLICY "admin_insert_nav_links" ON nav_links FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_nav_links" ON nav_links;
CREATE POLICY "admin_update_nav_links" ON nav_links FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_nav_links" ON nav_links;
CREATE POLICY "admin_delete_nav_links" ON nav_links FOR DELETE
  TO authenticated USING (true);

-- =====================
-- footer_links
-- =====================
CREATE TABLE IF NOT EXISTS footer_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  url text NOT NULL,
  link_order int NOT NULL DEFAULT 0,
  column_name text NOT NULL DEFAULT 'Company',
  is_external boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE footer_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_footer_links" ON footer_links;
CREATE POLICY "public_read_footer_links" ON footer_links FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_footer_links" ON footer_links;
CREATE POLICY "admin_insert_footer_links" ON footer_links FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_footer_links" ON footer_links;
CREATE POLICY "admin_update_footer_links" ON footer_links FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_footer_links" ON footer_links;
CREATE POLICY "admin_delete_footer_links" ON footer_links FOR DELETE
  TO authenticated USING (true);

-- =====================
-- pages
-- =====================
CREATE TABLE IF NOT EXISTS pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL DEFAULT '',
  is_published boolean NOT NULL DEFAULT true,
  meta_description text,
  page_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_pages" ON pages;
CREATE POLICY "public_read_pages" ON pages FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_pages" ON pages;
CREATE POLICY "admin_insert_pages" ON pages FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_pages" ON pages;
CREATE POLICY "admin_update_pages" ON pages FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_pages" ON pages;
CREATE POLICY "admin_delete_pages" ON pages FOR DELETE
  TO authenticated USING (true);

-- =====================
-- invoices
-- =====================
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code text NOT NULL UNIQUE,
  barcode_value text NOT NULL,
  sender_name text NOT NULL,
  sender_phone text NOT NULL,
  sender_email text,
  sender_address text NOT NULL,
  receiver_name text NOT NULL,
  receiver_phone text NOT NULL,
  receiver_email text,
  receiver_address text NOT NULL,
  package_description text NOT NULL,
  package_weight text,
  package_type text,
  package_dimensions text,
  shipping_method text NOT NULL DEFAULT 'Standard',
  total_cost numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'processing',
  estimated_delivery_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (
    status IN ('processing', 'dispatched', 'in_transit', 'on_hold', 'delivered')
  )
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_invoices" ON invoices;
CREATE POLICY "public_read_invoices" ON invoices FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_invoices" ON invoices;
CREATE POLICY "admin_insert_invoices" ON invoices FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_invoices" ON invoices;
CREATE POLICY "admin_update_invoices" ON invoices FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_invoices" ON invoices;
CREATE POLICY "admin_delete_invoices" ON invoices FOR DELETE
  TO authenticated USING (true);

-- Index for tracking code lookups
CREATE INDEX IF NOT EXISTS idx_invoices_tracking_code ON invoices(tracking_code);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- =====================
-- invoice_status_history
-- =====================
CREATE TABLE IF NOT EXISTS invoice_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  status text NOT NULL,
  notes text,
  location text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_history_status CHECK (
    status IN ('processing', 'dispatched', 'in_transit', 'on_hold', 'delivered')
  )
);

ALTER TABLE invoice_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_invoice_history" ON invoice_status_history;
CREATE POLICY "public_read_invoice_history" ON invoice_status_history FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_invoice_history" ON invoice_status_history;
CREATE POLICY "admin_insert_invoice_history" ON invoice_status_history FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_invoice_history" ON invoice_status_history;
CREATE POLICY "admin_update_invoice_history" ON invoice_status_history FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_invoice_history" ON invoice_status_history;
CREATE POLICY "admin_delete_invoice_history" ON invoice_status_history FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_invoice_history_invoice_id ON invoice_status_history(invoice_id);

-- =====================
-- Seed initial data
-- =====================

-- Seed site settings (only if no row exists)
INSERT INTO site_settings (company_name, about_text, services_json, stats_json)
SELECT 'Express Courier Services',
  'Express Courier Services has been a leader in logistics and delivery solutions for over 15 years. We connect businesses and individuals across the globe with our reliable, fast, and secure courier network. Our commitment to excellence and customer satisfaction sets us apart in the industry.',
  '[
    {"icon": "Truck", "title": "Express Delivery", "description": "Same-day and next-day delivery options for urgent shipments across major cities."},
    {"icon": "Globe", "title": "International Shipping", "description": "Worldwide shipping network covering over 200 countries with real-time tracking."},
    {"icon": "Shield", "title": "Secure Handling", "description": "Insured shipments with tamper-proof packaging and verified chain of custody."},
    {"icon": "Package", "title": "Bulk Logistics", "description": "Enterprise-grade logistics solutions for high-volume shippers and e-commerce."},
    {"icon": "MapPin", "title": "Real-Time Tracking", "description": "Track your packages live with our advanced GPS-powered tracking system."},
    {"icon": "Headphones", "title": "24/7 Support", "description": "Round-the-clock customer support to assist you at every step of delivery."}
  ]'::jsonb,
  '[
    {"label": "Packages Delivered", "value": "500K+"},
    {"label": "Countries Served", "value": "200+"},
    {"label": "Delivery Agents", "value": "1,200+"},
    {"label": "Years of Service", "value": "15+"}
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_settings);

-- Seed default nav links
INSERT INTO nav_links (label, url, link_order, is_active)
SELECT 'Home', '/', 0, true
WHERE NOT EXISTS (SELECT 1 FROM nav_links);

INSERT INTO nav_links (label, url, link_order, is_active)
SELECT 'Track Package', '/track', 1, true
WHERE NOT EXISTS (SELECT 1 FROM nav_links WHERE url = '/track');

INSERT INTO nav_links (label, url, link_order, is_active)
SELECT 'Services', '/#services', 2, true
WHERE NOT EXISTS (SELECT 1 FROM nav_links WHERE url = '/#services');

INSERT INTO nav_links (label, url, link_order, is_active)
SELECT 'About', '/#about', 3, true
WHERE NOT EXISTS (SELECT 1 FROM nav_links WHERE url = '/#about');

INSERT INTO nav_links (label, url, link_order, is_active)
SELECT 'Contact', '/#contact', 4, true
WHERE NOT EXISTS (SELECT 1 FROM nav_links WHERE url = '/#contact');

-- Seed default footer links
INSERT INTO footer_links (label, url, link_order, column_name)
SELECT 'Home', '/', 0, 'Company'
WHERE NOT EXISTS (SELECT 1 FROM footer_links);

INSERT INTO footer_links (label, url, link_order, column_name)
SELECT 'Track Package', '/track', 1, 'Company'
WHERE NOT EXISTS (SELECT 1 FROM footer_links WHERE url = '/track' AND column_name = 'Company');

INSERT INTO footer_links (label, url, link_order, column_name)
SELECT 'About Us', '/#about', 0, 'Services'
WHERE NOT EXISTS (SELECT 1 FROM footer_links WHERE url = '/#about' AND column_name = 'Services');

INSERT INTO footer_links (label, url, link_order, column_name)
SELECT 'Express Delivery', '/#services', 1, 'Services'
WHERE NOT EXISTS (SELECT 1 FROM footer_links WHERE url = '/#services' AND column_name = 'Services');

INSERT INTO footer_links (label, url, link_order, column_name)
SELECT 'International Shipping', '/#services', 2, 'Services'
WHERE NOT EXISTS (SELECT 1 FROM footer_links WHERE label = 'International Shipping' AND column_name = 'Services');

-- Seed default pages
INSERT INTO pages (title, slug, content, is_published, meta_description, page_order)
SELECT 'Terms of Service', 'terms-of-service',
  '<h1>Terms of Service</h1><p>These terms govern your use of Express Courier Services. By using our services, you agree to these terms.</p><h2>Shipments</h2><p>All shipments are subject to our terms and conditions. We reserve the right to refuse shipments that contain prohibited items.</p><h2>Liability</h2><p>Our liability is limited to the declared value of the shipment. Additional insurance can be purchased at the time of booking.</p>',
  true, 'Terms of service for Express Courier Services', 0
WHERE NOT EXISTS (SELECT 1 FROM pages WHERE slug = 'terms-of-service');

INSERT INTO pages (title, slug, content, is_published, meta_description, page_order)
SELECT 'Privacy Policy', 'privacy-policy',
  '<h1>Privacy Policy</h1><p>We respect your privacy and are committed to protecting your personal data. This policy explains how we collect, use, and safeguard your information.</p><h2>Data Collection</h2><p>We collect sender and receiver information necessary for delivery purposes. This includes names, addresses, phone numbers, and email addresses.</p><h2>Data Usage</h2><p>Your data is used solely for processing deliveries and providing tracking information. We do not sell your data to third parties.</p>',
  true, 'Privacy policy for Express Courier Services', 1
WHERE NOT EXISTS (SELECT 1 FROM pages WHERE slug = 'privacy-policy');
