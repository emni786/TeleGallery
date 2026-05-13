import axios from 'axios';

/**
 * Build a per-call axios client so every request carries the user's current
 * credentials in headers. The backend is stateless — it relies on these.
 */
export function makeApi(config) {
  const baseURL = (config?.backend_url || '').replace(/\/+$/, '');
  const client = axios.create({
    baseURL,
    timeout: 0,
    headers: {
      'X-Bot-Token': config?.bot_token || '',
      'X-Channel-Id': config?.channel_id || '',
      'X-Api-Id': config?.api_id || '',
      'X-Api-Hash': config?.api_hash || '',
      'X-Supabase-Url': config?.supabase_url || '',
      'X-Supabase-Key': config?.supabase_key || '',
    },
  });
  return client;
}

export function fileUrl(config, fileId) {
  if (!config?.backend_url || !fileId) return '';
  const base = config.backend_url.replace(/\/+$/, '');
  const params = new URLSearchParams({
    bt: config.bot_token || '',
    ch: config.channel_id || '',
  });
  return `${base}/api/file/${fileId}?${params.toString()}`;
}

export function thumbnailUrl(config, fileId) {
  if (!config?.backend_url || !fileId) return '';
  const base = config.backend_url.replace(/\/+$/, '');
  const params = new URLSearchParams({
    bt: config.bot_token || '',
    ch: config.channel_id || '',
  });
  return `${base}/api/thumbnail/${fileId}?${params.toString()}`;
}

export async function testConnections(config) {
  const api = makeApi(config);
  const { data } = await api.post('/api/setup/test');
  return data;
}
