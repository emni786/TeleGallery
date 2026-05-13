import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { encrypt, decrypt } from '../lib/crypto.js';
import { getSupabase } from '../lib/supabase.js';

const STORAGE_KEY = 'telegallery.config.v1';
const THEME_KEY = 'telegallery.theme';

const EMPTY = {
  supabase_url: '',
  supabase_key: '',
  bot_token: '',
  channel_id: '',
  api_id: '',
  api_hash: '',
  backend_url: '',
};

/**
 * Encrypted-on-disk keys: every secret except the Supabase URL & anon key,
 * which act as the master key for unlocking everything else.
 */
const ENCRYPTED_KEYS = ['bot_token', 'channel_id', 'api_id', 'api_hash'];
const PLAIN_BACKUP_KEYS = ['backend_url'];

const ConfigContext = createContext({
  config: EMPTY,
  ready: false,
  setConfig: () => {},
  clearCache: () => {},
  resetAll: async () => {},
  saveToSupabase: async () => {},
  restoreFromSupabase: async () => false,
  theme: 'light',
  toggleTheme: () => {},
});

function readLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    return { ...EMPTY, ...parsed };
  } catch {
    return EMPTY;
  }
}

function writeLocal(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function readTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || 'light';
  } catch {
    return 'light';
  }
}

export function ConfigProvider({ children }) {
  const [config, setConfigState] = useState(EMPTY);
  const [ready, setReady] = useState(false);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    setConfigState(readLocal());
    const t = readTheme();
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
    setReady(true);
  }, []);

  const setConfig = useCallback((next) => {
    setConfigState((prev) => {
      const merged = typeof next === 'function' ? next(prev) : { ...prev, ...next };
      writeLocal(merged);
      return merged;
    });
  }, []);

  const clearCache = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setConfigState(EMPTY);
  }, []);

  const resetAll = useCallback(async () => {
    clearCache();
  }, [clearCache]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (e) {
        void e;
      }
      document.documentElement.setAttribute('data-theme', next);
      return next;
    });
  }, []);

  const saveToSupabase = useCallback(async (cfg) => {
    const sb = getSupabase(cfg.supabase_url, cfg.supabase_key);
    if (!sb) throw new Error('Supabase URL & anon key are required');
    const rows = [];
    for (const k of ENCRYPTED_KEYS) {
      if (cfg[k]) rows.push({ key: k, value: encrypt(cfg[k], cfg.supabase_key) });
    }
    for (const k of PLAIN_BACKUP_KEYS) {
      if (cfg[k]) rows.push({ key: k, value: cfg[k] });
    }
    if (!rows.length) return;
    const { error } = await sb.from('credentials').upsert(rows, { onConflict: 'key' });
    if (error) throw error;
  }, []);

  const restoreFromSupabase = useCallback(async (url, key) => {
    const sb = getSupabase(url, key);
    if (!sb) throw new Error('Supabase URL & anon key are required');
    const { data, error } = await sb.from('credentials').select('key,value');
    if (error) throw error;
    const restored = { ...EMPTY, supabase_url: url, supabase_key: key };
    for (const row of data || []) {
      if (ENCRYPTED_KEYS.includes(row.key)) {
        restored[row.key] = decrypt(row.value, key);
      } else if (PLAIN_BACKUP_KEYS.includes(row.key)) {
        restored[row.key] = row.value;
      }
    }
    writeLocal(restored);
    setConfigState(restored);
    return restored;
  }, []);

  const value = useMemo(
    () => ({
      config,
      ready,
      setConfig,
      clearCache,
      resetAll,
      saveToSupabase,
      restoreFromSupabase,
      theme,
      toggleTheme,
    }),
    [
      config,
      ready,
      setConfig,
      clearCache,
      resetAll,
      saveToSupabase,
      restoreFromSupabase,
      theme,
      toggleTheme,
    ],
  );

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  return useContext(ConfigContext);
}

export function isConfigured(config) {
  return Boolean(
    config?.supabase_url &&
      config?.supabase_key &&
      config?.bot_token &&
      config?.channel_id &&
      config?.backend_url,
  );
}
