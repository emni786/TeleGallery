import CryptoJS from 'crypto-js';

export function encrypt(text: string, key: string): string {
  const encKey = key.substring(0, 32);
  return CryptoJS.AES.encrypt(text, encKey).toString();
}

export function decrypt(ciphertext: string, key: string): string {
  const encKey = key.substring(0, 32);
  const bytes = CryptoJS.AES.decrypt(ciphertext, encKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}
