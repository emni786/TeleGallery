import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabaseClient(url: string, anonKey: string): SupabaseClient {
  if (client) return client;
  client = createClient(url, anonKey);
  return client;
}

export function resetSupabaseClient() {
  client = null;
}
