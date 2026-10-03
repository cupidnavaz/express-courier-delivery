/*
# Create messages table for admin-customer communication

## Overview
Creates a messages table that stores all communications between the admin and customers,
supporting both email and WhatsApp channels. Messages track direction (outbound/inbound),
delivery status, and thread relationships for reply chains.

## New Tables
1. `messages`
   - id (uuid, primary key)
   - channel (text: 'email' or 'whatsapp')
   - direction (text: 'outbound' or 'inbound')
   - recipient_email (text, nullable — target customer email for outbound)
   - recipient_phone (text, nullable — target customer phone for WhatsApp)
   - recipient_name (text, nullable — customer name)
   - subject (text, nullable — email subject line)
   - body (text, message content)
   - sender_brand_name (text, the company name shown to customer)
   - status (text: 'sent', 'failed', 'delivered', 'received', 'pending')
   - thread_id (uuid, nullable — groups replies into threads)
   - parent_id (uuid, nullable — FK to parent message for replies)
   - invoice_id (uuid, nullable — FK to invoices if message relates to a delivery)
   - created_at (timestamptz)

## Security (RLS)
- SELECT: authenticated only (admin can see all messages)
- INSERT: authenticated only (admin sends; customer replies come through edge function using service role)
- UPDATE: authenticated only (admin can update status)
- DELETE: authenticated only
*/
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL DEFAULT 'email',
  direction text NOT NULL DEFAULT 'outbound',
  recipient_email text,
  recipient_phone text,
  recipient_name text,
  subject text,
  body text NOT NULL,
  sender_brand_name text NOT NULL DEFAULT 'Express Courier Services',
  status text NOT NULL DEFAULT 'pending',
  thread_id uuid,
  parent_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_channel CHECK (channel IN ('email', 'whatsapp')),
  CONSTRAINT valid_direction CHECK (direction IN ('outbound', 'inbound')),
  CONSTRAINT valid_msg_status CHECK (status IN ('sent', 'failed', 'delivered', 'received', 'pending'))
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_messages" ON messages;
CREATE POLICY "admin_read_messages" ON messages FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_messages" ON messages;
CREATE POLICY "admin_insert_messages" ON messages FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_messages" ON messages;
CREATE POLICY "admin_update_messages" ON messages FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_messages" ON messages;
CREATE POLICY "admin_delete_messages" ON messages FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel);
CREATE INDEX IF NOT EXISTS idx_messages_direction ON messages(direction);
