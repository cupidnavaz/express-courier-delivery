import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// Keep the preview bootable when Supabase variables have not been provisioned yet.
// Requests will fail until the project is connected/configured, but module loading
// no longer crashes the entire app with Supabase's constructor error.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
const clientUrl = supabaseUrl || 'https://placeholder.supabase.co';
const clientKey = supabaseAnonKey || 'preview-placeholder-key';

if (!isSupabaseConfigured) {
  console.warn('[v0] Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable data access.');
}

export const supabase = createClient(clientUrl, clientKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
