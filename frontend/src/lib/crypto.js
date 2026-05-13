import CryptoJS from 'crypto-js';

/**
 * The encryption key is derived from the first 32 chars of the user's
 * Supabase anon key — same as documented in the TeleGallery spec. This means
 * knowing the Supabase URL + anon key is enough to recover everything else
 * stored in the `credentials` table.
 */
export function deriveKey(supabaseAnonKey) {
  if (!supabaseAnonKey) return '';
  return supabaseAnonKey.slice(0, 32).padEnd(32, '0');
}

export function encrypt(plain, supabaseAnonKey) {
  if (plain == null || plain === '') return '';
  const key = deriveKey(supabaseAnonKey);
  if (!key) return plain;
  return CryptoJS.AES.encrypt(String(plain), key).toString();
}

export function decrypt(cipher, supabaseAnonKey) {
  if (!cipher) return '';
  const key = deriveKey(supabaseAnonKey);
  if (!key) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return '';
  }
}
