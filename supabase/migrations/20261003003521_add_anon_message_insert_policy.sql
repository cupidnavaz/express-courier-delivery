/*
# Add anon insert policy for messages table

## Overview
The public contact form on the website uses the anon key to submit customer messages.
The existing messages table only allows authenticated users to insert, which blocks
the public contact form. This adds an anon INSERT policy restricted to inbound messages
(so the public can send messages TO the company, but cannot send outbound messages
masquerading as the company).

## Changes
- New policy: anon can INSERT messages where direction = 'inbound' (customer contact form)
- No other policy changes needed — admin still has full CRUD via authenticated policies
*/

DROP POLICY IF EXISTS "public_insert_inbound_messages" ON messages;
CREATE POLICY "public_insert_inbound_messages"
ON messages FOR INSERT
TO anon, authenticated
WITH CHECK (direction = 'inbound');
