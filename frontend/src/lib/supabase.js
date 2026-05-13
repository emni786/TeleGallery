import { createClient } from '@supabase/supabase-js';

let cached = { url: '', key: '', client: null };

export function getSupabase(url, key) {
  if (!url || !key) return null;
  if (cached.client && cached.url === url && cached.key === key) {
    return cached.client;
  }
  cached = {
    url,
    key,
    client: createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
  };
  return cached.client;
}
