import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { encrypt, decrypt } from '@/lib/crypto';
import { getSupabaseClient, resetSupabaseClient } from '@/lib/supabaseClient';
import { resetApi } from '@/lib/api';

export interface Credentials {
  supabaseUrl: string;
  supabaseAnonKey: string;
  botToken: string;
  channelId: string;
  apiId: string;
  apiHash: string;
  backendUrl: string;
}

const EMPTY_CREDS: Credentials = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  botToken: '',
  channelId: '',
  apiId: '',
  apiHash: '',
  backendUrl: '',
};

const STORAGE_KEY = 'tg_credentials';

interface ConfigContextType {
  credentials: Credentials;
  isConfigured: boolean;
  setCredentials: (creds: Credentials) => void;
  clearCredentials: () => void;
  saveToSupabase: (creds: Credentials) => Promise<void>;
  restoreFromSupabase: (url: string, key: string) => Promise<Credentials | null>;
}

const ConfigContext = createContext<ConfigContextType | null>(null);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [credentials, setCredsState] = useState<Credentials>(EMPTY_CREDS);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setCredsState(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const isConfigured = !!(
    credentials.supabaseUrl &&
    credentials.supabaseAnonKey &&
    credentials.botToken &&
    credentials.channelId &&
    credentials.backendUrl
  );

  const setCredentials = useCallback((creds: Credentials) => {
    setCredsState(creds);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
    resetSupabaseClient();
    resetApi();
  }, []);

  const clearCredentials = useCallback(() => {
    setCredsState(EMPTY_CREDS);
    localStorage.removeItem(STORAGE_KEY);
    resetSupabaseClient();
    resetApi();
  }, []);

  const saveToSupabase = useCallback(async (creds: Credentials) => {
    const sb = getSupabaseClient(creds.supabaseUrl, creds.supabaseAnonKey);
    const encKey = creds.supabaseAnonKey;
    const entries = [
      { key: 'bot_token', value: encrypt(creds.botToken, encKey) },
      { key: 'channel_id', value: encrypt(creds.channelId, encKey) },
      { key: 'api_id', value: encrypt(creds.apiId, encKey) },
      { key: 'api_hash', value: encrypt(creds.apiHash, encKey) },
      { key: 'backend_url', value: creds.backendUrl },
    ];
    for (const entry of entries) {
      await sb.from('credentials').upsert(entry, { onConflict: 'key' });
    }
  }, []);

  const restoreFromSupabase = useCallback(async (url: string, key: string): Promise<Credentials | null> => {
    try {
      const sb = getSupabaseClient(url, key);
      const { data, error } = await sb.from('credentials').select('*');
      if (error || !data || data.length === 0) return null;

      const map: Record<string, string> = {};
      data.forEach((row: { key: string; value: string }) => {
        map[row.key] = row.value;
      });

      const restored: Credentials = {
        supabaseUrl: url,
        supabaseAnonKey: key,
        botToken: map.bot_token ? decrypt(map.bot_token, key) : '',
        channelId: map.channel_id ? decrypt(map.channel_id, key) : '',
        apiId: map.api_id ? decrypt(map.api_id, key) : '',
        apiHash: map.api_hash ? decrypt(map.api_hash, key) : '',
        backendUrl: map.backend_url || '',
      };
      return restored;
    } catch {
      return null;
    }
  }, []);

  return (
    <ConfigContext.Provider value={{ credentials, isConfigured, setCredentials, clearCredentials, saveToSupabase, restoreFromSupabase }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
  return ctx;
}
